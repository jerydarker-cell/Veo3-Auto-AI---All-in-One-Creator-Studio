
import React from 'react';
import { ProjectConfig } from '../types';
import { VIDEO_TEMPLATES, VOICE_PRESETS, EMOTION_GOALS } from '../constants';

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
          {/* Basic Info */}
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

          {/* Prompt Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Lời nhắc Video (Prompt)</label>
            <textarea 
              value={project.prompt}
              onChange={(e) => setProject({...project, prompt: e.target.value})}
              placeholder="Mô tả video bạn muốn tạo (ví dụ: Một phi hành gia đang pha cà phê trong môi trường không trọng lực...)"
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Từ khóa SEO & Phong cách</label>
            <input 
              value={project.seoKeywords}
              onChange={(e) => setProject({...project, seoKeywords: e.target.value})}
              placeholder="ví dụ: #viral, #cinematic, #scifi, #ultrarealistic"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Reference Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Ảnh tham khảo (Đồng nhất nhân vật)</label>
            <div className="flex gap-4 items-center">
              <label className="flex-1 h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-blue-500 cursor-pointer transition overflow-hidden bg-slate-900/50">
                {refImage ? (
                  <img src={refImage} alt="Reference" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 mx-auto text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-slate-500">Tải ảnh lên hoặc kéo thả</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {refImage && (
                <button onClick={() => setRefImage(null)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={onGenerateScript}
            disabled={isGenerating || !project.prompt}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
          >
            {isGenerating ? 'Đang phân tích...' : 'Tạo Kịch Bản AI & Script Beats'}
          </button>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VIDEO_TEMPLATES.map(template => (
            <div 
              key={template.id}
              onClick={() => setProject({...project, templateId: template.id})}
              className={`glass rounded-2xl overflow-hidden cursor-pointer border-2 transition ${project.templateId === template.id ? 'border-blue-500 scale-[1.02]' : 'border-transparent hover:border-slate-600'}`}
            >
              <img src={template.previewUrl} className="w-full h-40 object-cover" alt={template.name} />
              <div className="p-4">
                <h4 className="font-bold mb-1">{template.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'voice' && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-lg mb-4">Lồng tiếng AI Đa Dạng</h3>
          <div className="space-y-3">
            {VOICE_PRESETS.map(voice => (
              <div 
                key={voice.id}
                onClick={() => setProject({...project, voiceId: voice.id})}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-4 ${project.voiceId === voice.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${voice.gender === 'male' ? 'bg-blue-500/20 text-blue-500' : 'bg-pink-500/20 text-pink-500'}`}>
                  {voice.gender === 'male' ? 'M' : 'F'}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{voice.name}</p>
                  <p className="text-xs text-slate-400">{voice.style}</p>
                </div>
                {project.voiceId === voice.id && (
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
