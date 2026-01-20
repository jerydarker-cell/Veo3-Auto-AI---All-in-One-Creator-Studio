
import React from 'react';
import { ProjectConfig, AspectRatio, SubtitleStyle } from '../types';
import { VIDEO_TEMPLATES, VOICE_PRESETS, EMOTION_GOALS, ASPECT_RATIOS, SUBTITLE_STYLES } from '../constants';

interface EditorProps {
  project: ProjectConfig;
  setProject: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  activeTab: 'editor' | 'templates' | 'voice';
  refImage: string | null;
  setRefImage: (img: string | null) => void;
  onGenerateScript: () => void;
  isGenerating: boolean;
}

export const Editor: React.FC<EditorProps> = ({ 
  project, setProject, activeTab, refImage, setRefImage, onGenerateScript, isGenerating 
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {activeTab === 'editor' && (
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Tên dự án</label>
              <input 
                value={project.name}
                onChange={(e) => setProject({...project, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Cảm xúc mục tiêu</label>
              <select 
                value={project.emotionGoal}
                onChange={(e) => setProject({...project, emotionGoal: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition"
              >
                {EMOTION_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Tỷ lệ khung hình (Flexible)</label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setProject({...project, aspectRatio: ratio.id})}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    project.aspectRatio === ratio.id 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <span>{ratio.icon}</span>
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Phong cách Phụ đề AI</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUBTITLE_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setProject({...project, subtitleStyle: style.id})}
                  className={`px-3 py-3 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center text-center gap-1 ${
                    project.subtitleStyle === style.id 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="uppercase">{style.label}</span>
                  <span className="text-[8px] opacity-60 font-medium leading-tight">{style.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Lời nhắc Video (Phụ đề sẽ bám sát nội dung này)</label>
            <textarea 
              value={project.prompt}
              onChange={(e) => setProject({...project, prompt: e.target.value})}
              placeholder="Ví dụ: Một cô gái đang pha cà phê trong ánh nắng sớm, vui vẻ nhìn vào máy quay..."
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition resize-none text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Từ khóa & Hashtags</label>
            <input 
              value={project.seoKeywords}
              onChange={(e) => setProject({...project, seoKeywords: e.target.value})}
              placeholder="ví dụ: #morningcoffee, #aesthetic, #vietnam"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Ảnh tham khảo (Đồng nhất nhân vật)</label>
            <div className="flex gap-4 items-center">
              <label className="flex-1 h-28 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-blue-500 cursor-pointer transition overflow-hidden bg-slate-900/50">
                {refImage ? <img src={refImage} alt="Reference" className="w-full h-full object-cover" /> : <span className="text-xs text-slate-500">Giữ nhân vật xuyên suốt các cảnh</span>}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <button 
            onClick={onGenerateScript}
            disabled={isGenerating || !project.prompt}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            {isGenerating ? 'Đang tinh chỉnh phụ đề...' : 'Tạo Kịch Bản Phụ Đề AI'}
          </button>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in p-2">
          {VIDEO_TEMPLATES.map(template => (
            <div 
              key={template.id}
              onClick={() => setProject({...project, templateId: template.id})}
              className={`glass rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 group ${project.templateId === template.id ? 'border-blue-500 scale-[1.03] shadow-xl shadow-blue-500/10' : 'border-slate-800 hover:border-slate-600 hover:scale-[1.01]'}`}
            >
              <div className="relative overflow-hidden h-40">
                <img src={template.previewUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={template.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
              </div>
              <div className="p-4 relative">
                <h4 className="font-bold mb-1 text-sm group-hover:text-blue-400 transition-colors">{template.name}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'voice' && (
        <div className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Lồng tiếng AI Tiếng Việt</h3>
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-full text-blue-400 font-bold uppercase tracking-wider">Sync Enabled</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {VOICE_PRESETS.map(voice => (
              <div 
                key={voice.id}
                onClick={() => setProject({...project, voiceId: voice.id})}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 group ${project.voiceId === voice.id ? 'bg-blue-600/10 border-blue-500 ring-4 ring-blue-500/5' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${voice.gender === 'male' ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30' : 'bg-pink-500/20 text-pink-400 group-hover:bg-pink-500/30'}`}>
                   {voice.gender === 'male' ? (
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                   ) : (
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                   )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{voice.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight mt-0.5">{voice.style}</p>
                </div>
                {project.voiceId === voice.id && (
                  <div className="flex gap-1 items-end h-4">
                    <div className="w-1 bg-blue-500 h-2 animate-bounce"></div>
                    <div className="w-1 bg-blue-500 h-4 animate-bounce [animation-delay:-0.2s]"></div>
                    <div className="w-1 bg-blue-500 h-3 animate-bounce [animation-delay:-0.4s]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
