import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Database, FileText, Share2, Zap } from 'lucide-react';
import { MOCK_LOGS } from '../constants';

const StatsCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm hover:border-nexus-500/30 transition-colors group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white group-hover:text-nexus-400 transition-colors">{value}</h3>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const data = [
  { name: '00:00', queries: 4 },
  { name: '04:00', queries: 1 },
  { name: '08:00', queries: 12 },
  { name: '12:00', queries: 35 },
  { name: '16:00', queries: 28 },
  { name: '20:00', queries: 15 },
  { name: '23:59', queries: 8 },
];

const ingestionData = [
  { name: 'Mon', docs: 10 },
  { name: 'Tue', docs: 45 },
  { name: 'Wed', docs: 28 },
  { name: 'Thu', docs: 80 },
  { name: 'Fri', docs: 55 },
  { name: 'Sat', docs: 12 },
  { name: 'Sun', docs: 5 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-slate-400">Monitoring real-time metrics for the Nexus Graph-RAG pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Knowledge Graph" 
          value="12,450" 
          sub="Nodes in Memgraph" 
          icon={Share2} 
          color="nexus" 
        />
        <StatsCard 
          title="Vector Embeddings" 
          value="85,210" 
          sub="Chunks in ChromaDB" 
          icon={Database} 
          color="nexus" 
        />
        <StatsCard 
          title="Processed Docs" 
          value="1,204" 
          sub="PDF, MD, TXT sources" 
          icon={FileText} 
          color="nexus" 
        />
        <StatsCard 
          title="Agent Latency" 
          value="450ms" 
          sub="Avg. response time" 
          icon={Zap} 
          color="nexus" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Query Volume (24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Ingestion Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingestionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{fill: '#1e293b'}}
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                   itemStyle={{ color: '#8b5cf6' }}
                />
                <Bar dataKey="docs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-black/40 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
          Live System Logs
        </h3>
        <div className="font-mono text-sm space-y-2 max-h-48 overflow-y-auto pr-2">
          {MOCK_LOGS.map((log, i) => {
            const isError = log.includes("[ERROR]");
            const isDebug = log.includes("[DEBUG]");
            const color = isError ? 'text-red-400' : isDebug ? 'text-nexus-400' : 'text-slate-400';
            return (
              <div key={i} className={`${color} border-b border-white/5 pb-1 last:border-0`}>
                {log}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
