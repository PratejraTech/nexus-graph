import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Network, 
  MessageSquare, 
  Settings, 
  Activity, 
  Database,
  Cpu,
  Menu,
  X,
  Layers
} from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

const NavItem = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span className="font-medium text-sm tracking-wide">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-nexus-900 overflow-hidden text-slate-200 font-sans selection:bg-nexus-500 selection:text-white">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-nexus-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-nexus-500 to-nexus-accent flex items-center justify-center shadow-lg shadow-nexus-500/20">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="font-mono font-bold text-lg tracking-tight text-white">NEXUS<span className="text-nexus-400">RAG</span></span>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">Platform</div>
          <NavItem 
            active={currentView === ViewState.DASHBOARD} 
            onClick={() => setView(ViewState.DASHBOARD)} 
            icon={LayoutDashboard} 
            label="Overview" 
          />
          <NavItem 
            active={currentView === ViewState.GRAPH} 
            onClick={() => setView(ViewState.GRAPH)} 
            icon={Network} 
            label="Graph Explorer" 
          />
          <NavItem 
            active={currentView === ViewState.CHAT} 
            onClick={() => setView(ViewState.CHAT)} 
            icon={MessageSquare} 
            label="Agent Chat" 
          />
          <NavItem 
            active={currentView === ViewState.INGESTION} 
            onClick={() => setView(ViewState.INGESTION)} 
            icon={Layers} 
            label="Ingestion Engine" 
          />
          
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 mt-8 px-4">System</div>
          <NavItem 
            active={currentView === ViewState.SETTINGS} 
            onClick={() => setView(ViewState.SETTINGS)} 
            icon={Settings} 
            label="Configuration" 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">System Health</span>
              <Activity className="w-3 h-3 text-nexus-success" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center"><Database className="w-3 h-3 mr-1"/> Memgraph</span>
                <span className="text-nexus-success">Online</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center"><Cpu className="w-3 h-3 mr-1"/> Agent</span>
                <span className="text-nexus-success">Idle</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-slate-800 flex items-center px-4 bg-nexus-900/90 backdrop-blur z-30">
          <button onClick={() => setMobileMenuOpen(true)} className="text-slate-400 mr-4">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-white">Nexus RAG</span>
        </header>

        <div className="flex-1 overflow-auto bg-slate-950/50 relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          {children}
        </div>
      </main>
    </div>
  );
};
