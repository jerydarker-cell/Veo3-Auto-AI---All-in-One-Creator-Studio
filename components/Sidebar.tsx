
import React from 'react';
import { ProjectConfig } from '../types';

interface SidebarProps {
  project: ProjectConfig;
  setProject: (p: ProjectConfig) => void;
  saveProject: () => void;
  onNewProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ project, setProject, saveProject, onNewProject }) => {
  return (
    <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 transition-all">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="hidden lg:block font-bold text-xl tracking-tight">Veo3<span className="text-blue-500">Auto</span></span>
      </div>

      <nav className="flex-1 space-y-2">
        <button 
          onClick={onNewProject}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-300 group"
        >
          <svg className="w-5 h-5 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden lg:block">Dự án mới</span>
        </button>

        <button 
          onClick={saveProject}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition text-slate-300 group"
        >
          <svg className="w-5 h-5 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span className="hidden lg:block">Lưu dự án</span>
        </button>
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="hidden lg:block p-3 rounded-xl bg-slate-800/50 text-xs text-slate-500">
          <p className="font-semibold text-slate-400 mb-1">Dự án hiện tại:</p>
          <p className="truncate">{project.name}</p>
          <p className="mt-2 text-[10px] uppercase font-bold tracking-wider text-blue-500/80">Premium Active</p>
        </div>
      </div>
    </aside>
  );
};
