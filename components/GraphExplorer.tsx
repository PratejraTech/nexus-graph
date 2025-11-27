import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { INITIAL_GRAPH_DATA } from '../constants';
import { NodeData } from '../types';
import { ZoomIn, ZoomOut, RefreshCw, Maximize, MousePointer2 } from 'lucide-react';

export const GraphExplorer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [data, setData] = useState(INITIAL_GRAPH_DATA);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{node: any, x: number, y: number} | null>(null);
  
  // D3 Refs
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Re-run simulation / Reset
  const handleRefresh = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.2);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.8);
    }
  };

  const handleFitView = () => {
      if (svgRef.current && zoomRef.current && containerRef.current) {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          
          // Reset to center
          d3.select(svgRef.current).transition().duration(750).call(
              zoomRef.current.transform, 
              d3.zoomIdentity.translate(width/2, height/2).scale(1).translate(-width/2, -height/2) // Simplify: just identity often works if centered
              // Actually, better is just identity for now unless we calculate bounding box
          );
          // Proper reset
          d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
      }
  }

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("cursor", "grab");

    // Add a rect for background clicks
    svg.append("rect")
       .attr("width", width)
       .attr("height", height)
       .attr("fill", "transparent")
       .on("click", () => {
         setSelectedNodeId(null);
         d3.selectAll(".selection-ring").attr("stroke-width", 0);
         d3.selectAll(".node").style("opacity", 1);
         d3.selectAll(".link").style("stroke-opacity", 0.6).style("stroke", "#334155");
       });

    // Zoom container
    const g = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    
    svg.call(zoom as any);
    zoomRef.current = zoom;

    // Simulation Setup
    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => Math.sqrt(d.val) * 4 + 20).iterations(2));

    simulationRef.current = simulation;

    // Draw Links
    const link = g.append("g")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 1.5)
      .attr("class", "link");

    // Draw Nodes Group
    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any);

    // Selection Ring (Hidden by default)
    node.append("circle")
        .attr("r", (d: any) => Math.sqrt(d.val) * 4 + 12)
        .attr("fill", "none")
        .attr("stroke", "#60a5fa")
        .attr("stroke-width", 0)
        .attr("class", "selection-ring")
        .attr("stroke-dasharray", "4 2");

    // Main Node Circle
    node.append("circle")
      .attr("r", (d: any) => Math.sqrt(d.val) * 4 + 8)
      .attr("fill", (d: any) => {
        if(d.group === 1) return "#3b82f6"; // Core
        if(d.group === 2) return "#ef4444"; // Auth
        if(d.group === 3) return "#10b981"; // Docs
        if(d.group === 4) return "#8b5cf6"; // Entities
        return "#f59e0b"; // DB
      })
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .attr("class", "node-circle");

    // Labels
    node.append("text")
      .attr("dy", (d: any) => Math.sqrt(d.val) * 4 + 24)
      .attr("text-anchor", "middle")
      .text((d: any) => d.label)
      .attr("fill", "#cbd5e1")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "11px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.9)");

    // Interaction Handlers
    node.on("mouseover", (event, d: any) => {
        // Highlight logic
        link.style("stroke-opacity", (l: any) => l.source.id === d.id || l.target.id === d.id ? 1 : 0.05);
        link.style("stroke", (l: any) => l.source.id === d.id || l.target.id === d.id ? "#60a5fa" : "#334155");
        
        d3.selectAll(".node").style("opacity", (n: any) => {
            const isConnected = data.links.some((l: any) => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id));
            return n.id === d.id || isConnected ? 1 : 0.2;
        });

        // Tooltip position (relative to container)
        // We use d3.pointer on the containerRef
        const [x, y] = d3.pointer(event, containerRef.current);
        setHoveredNode({ node: d, x, y });
    })
    .on("mouseout", () => {
        if (!selectedNodeId) {
            // Reset styles only if no node is selected (or reset to selected state)
            // For simplicity, reset all
            link.style("stroke-opacity", 0.6).style("stroke", "#334155");
            d3.selectAll(".node").style("opacity", 1);
        } else {
             // If a node is selected, revert to that selection state (optional, simplified here to just reset)
             link.style("stroke-opacity", 0.6).style("stroke", "#334155");
             d3.selectAll(".node").style("opacity", 1);
        }
        setHoveredNode(null);
    })
    .on("click", (event, d: any) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
        
        // Highlight selection ring
        d3.selectAll(".selection-ring").attr("stroke-width", 0);
        d3.select(event.currentTarget).select(".selection-ring").attr("stroke-width", 2);

        // Zoom to node
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(width / 2, height / 2).scale(2).translate(-d.x, -d.y)
        );
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      svg.style("cursor", "grabbing");
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      svg.style("cursor", "grab");
    }

    return () => {
      simulation.stop();
    };
  }, [data, selectedNodeId]); // Re-bind if selection changes to ensure consistent state if needed

  return (
    <div className="h-full flex flex-col p-4 relative">
      <div className="flex justify-between items-center mb-4 px-2">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <MousePointer2 className="w-6 h-6 text-nexus-500" />
             Graph Explorer
          </h2>
          <p className="text-sm text-slate-400">Interactive Knowledge Graph Visualization</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleZoomIn} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={handleZoomOut} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
           <button onClick={handleFitView} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition" title="Fit View">
            <Maximize className="w-5 h-5" />
          </button>
          <button onClick={handleRefresh} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition" title="Refresh Layout">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-900/40 rounded-3xl border border-slate-800 relative overflow-hidden backdrop-blur-sm shadow-inner" ref={containerRef}>
        
        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 space-y-2 bg-slate-900/90 p-4 rounded-xl border border-slate-800/50 backdrop-blur shadow-xl">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Entity Types</div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-3 h-3 rounded-full bg-nexus-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> 
              <span>System Core</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-3 h-3 rounded-full bg-nexus-accent shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div> 
              <span>Entities</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-3 h-3 rounded-full bg-nexus-success shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> 
              <span>Documents</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-3 h-3 rounded-full bg-nexus-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div> 
              <span>Databases</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredNode && (
            <div 
                className="absolute z-20 pointer-events-none bg-slate-900/95 border border-nexus-500/30 p-3 rounded-lg shadow-2xl backdrop-blur-md max-w-[200px]"
                style={{ 
                    left: hoveredNode.x + 20, 
                    top: hoveredNode.y - 20,
                    transform: 'translate(0, 0)'
                }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                        hoveredNode.node.group === 1 ? 'bg-nexus-500' : 
                        hoveredNode.node.group === 2 ? 'bg-red-500' :
                        hoveredNode.node.group === 3 ? 'bg-nexus-success' :
                        hoveredNode.node.group === 4 ? 'bg-nexus-accent' : 'bg-nexus-warning'
                    }`}></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                        {hoveredNode.node.group === 3 ? 'Document' : hoveredNode.node.group === 4 ? 'Entity' : 'System Node'}
                    </span>
                </div>
                <div className="text-sm font-medium text-slate-200 mb-1">{hoveredNode.node.label}</div>
                <div className="text-[10px] text-slate-400 font-mono">ID: {hoveredNode.node.id}</div>
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Connections</span>
                    <span className="text-nexus-400 font-bold">
                        {data.links.filter((l: any) => l.source.id === hoveredNode.node.id || l.target.id === hoveredNode.node.id).length}
                    </span>
                </div>
            </div>
        )}

        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
};
