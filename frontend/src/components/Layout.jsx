import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Player from './Player';

const Layout = ({ isAdmin = false }) => {
  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden font-sans">
      <div className="flex flex-1 h-[calc(100vh-90px)] overflow-hidden">
        {/* Sidebar */}
        <Sidebar isAdmin={isAdmin} />
        
        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto ${isAdmin ? 'bg-zinc-950' : 'bg-gradient-to-b from-zinc-900 to-black'} px-4 md:px-8 py-6 rounded-tl-2xl border-t border-l border-white/5 shadow-2xl relative`}>
          <Outlet />
        </main>
      </div>
      
      {/* Persistent Bottom Player Dock */}
      {!isAdmin && <Player />}
      {isAdmin && (
        <div className="h-[90px] bg-black border-t border-white/5 flex items-center px-8 justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-black">A</div>
              <div>
                <p className="font-bold">Admin Console</p>
                <p className="text-xs text-zinc-500">System Management Active</p>
              </div>
           </div>
           <div className="text-zinc-500 text-sm">
             M3 Music v2.0 • Build 2026.05
           </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
