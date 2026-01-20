
import React, { useState, useEffect, useCallback } from 'react';
import { ProjectConfig, GenerationState, AspectRatio, ScriptBeat, SubtitleStyle } from './types';
import { VIDEO_TEMPLATES, VOICE_PRESETS, EMOTION_GOALS } from './constants';
import { aiService } from './services/aiService';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { VideoPreview } from './components/VideoPreview';

const STORAGE_KEY = 'veo3_project_config_v5';

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectConfig>({
    id: Date.now().toString(),
    name: 'Dự án Sáng tạo 2025',
    prompt: '',
    negativePrompt: '',
    aspectRatio: '9:16',
    resolution: '720p',
    script: [],
    voiceId: VOICE_PRESETS[0].id,
    templateId: VIDEO_TEMPLATES[0].id,
    emotionGoal: EMOTION_GOALS[0],
    seoKeywords: '',
    duration: 25,
    subtitleStyle: 'viral'
  });

  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    status: 'Sẵn sàng',
    progress: 0,
    error: null,
    videoUrl: null,
    videoQueue: []
  });

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'voice'>('editor');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const checkApiKey = async () => {
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      setHasApiKey(!!hasKey);
    };
    checkApiKey();
  }, []);

  const handleOpenSelectKey = async () => {
    await (window as any).aistudio?.openSelectKey();
    setHasApiKey(true);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProject(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  const saveProject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    alert('Đã lưu cấu hình dự án!');
  }, [project]);

  const handleGenerateScript = async () => {
    if (!project.prompt) return;
    setGenState(prev => ({ ...prev, isGenerating: true, status: 'AI đang biên kịch & tối ưu phụ đề...' }));
    try {
      const script = await aiService.generateScript(project.prompt, project.emotionGoal, project.seoKeywords);
      setProject(prev => ({ ...prev, script }));
      setGenState(prev => ({ ...prev, isGenerating: false, status: 'Kịch bản viral sẵn sàng!' }));
    } catch (error: any) {
      setGenState(prev => ({ ...prev, isGenerating: false, error: error.message }));
    }
  };

  const updateScriptBeat = (index: number, content: string) => {
    const newScript = [...project.script];
    newScript[index] = { ...newScript[index], content };
    setProject(prev => ({ ...prev, script: newScript }));
  };

  const decodeBase64 = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const generateFullVoiceover = async (script: ScriptBeat[], voiceId: string) => {
    const voice = VOICE_PRESETS.find(v => v.id === voiceId) || VOICE_PRESETS[0];
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    setGenState(prev => ({ ...prev, status: 'Lồng tiếng AI Tiếng Việt...' }));
    try {
      const audioBuffers: AudioBuffer[] = [];
      for (const beat of script) {
        const base64 = await aiService.generateSpeech(beat.content, voice.voiceName);
        if (base64) {
          const rawData = decodeBase64(base64);
          const dataInt16 = new Int16Array(rawData.buffer);
          const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
          audioBuffers.push(buffer);
        }
      }
      if (!audioBuffers.length) return null;
      const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
      const combined = audioContext.createBuffer(1, totalLength, 24000);
      let offset = 0;
      for (const buf of audioBuffers) {
        combined.copyToChannel(buf.getChannelData(0), 0, offset);
        offset += buf.length;
      }
      return URL.createObjectURL(audioBufferToWav(combined));
    } catch (err) { return null; }
  };

  const audioBufferToWav = (buffer: AudioBuffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const dataSize = buffer.length * numChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    const writeString = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeString(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, dataSize, true);
    const ch0 = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, ch0[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handleGenerateVideo = async () => {
    setGenState(prev => ({ ...prev, isGenerating: true, status: 'Kết nối Veo 3 Engine...', progress: 5, error: null }));
    try {
      const template = VIDEO_TEMPLATES.find(t => t.id === project.templateId);
      const finalConfig = { ...project, prompt: (template?.promptPrefix || '') + project.prompt };
      let op = await aiService.generateVideo(finalConfig, refImage || undefined);
      const timer = setInterval(async () => {
        const update = await aiService.pollVideoStatus(op);
        op = update;
        if (update.error) { 
          clearInterval(timer); 
          setGenState(p => ({ ...p, isGenerating: false, error: String((update.error as any)?.message || 'Lỗi API Veo') })); 
        }
        else if (update.done) {
          clearInterval(timer);
          const uri = update.response?.generatedVideos?.[0]?.video?.uri;
          if (uri) {
            const resp = await fetch(`${uri}&key=${process.env.API_KEY}`);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const aUrl = await generateFullVoiceover(project.script, project.voiceId);
            setAudioUrl(aUrl);
            setGenState(p => ({ ...p, isGenerating: false, status: 'Hoàn tất!', progress: 100, videoUrl: url, videoQueue: [...p.videoQueue, url] }));
          }
        } else {
          setGenState(p => ({ ...p, progress: Math.min(p.progress + 2, 95), status: 'AI đang vẽ từng khung hình...' }));
        }
      }, 5000);
    } catch (e: any) { 
      if (e.message?.includes("Requested entity was not found")) setHasApiKey(false);
      setGenState(p => ({ ...p, isGenerating: false, error: e.message })); 
    }
  };

  if (!hasApiKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Cần cấu hình API Key</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">Để sử dụng Veo 3 Video Generation, bạn cần chọn một API Key từ một dự án Google Cloud có bật tính năng thanh toán.</p>
          <button onClick={handleOpenSelectKey} className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg">Chọn API Key (Paid Project)</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
      <Sidebar project={project} setProject={setProject} saveProject={saveProject} onNewProject={() => {}} />
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold gradient-text">Veo3 Studio AI</h1>
            <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-800">
              {['editor', 'templates', 'voice'].map((t: any) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                  {t === 'editor' ? 'Cấu hình' : t === 'templates' ? 'Mẫu' : 'Lồng tiếng'}
                </button>
              ))}
            </div>
          </header>
          <Editor project={project} setProject={setProject} activeTab={activeTab} refImage={refImage} setRefImage={setRefImage} onGenerateScript={handleGenerateScript} isGenerating={genState.isGenerating} />
        </div>
        <div className="w-full md:w-[380px] flex flex-col gap-4">
          <VideoPreview genState={genState} aspectRatio={project.aspectRatio} setAspectRatio={(r) => setProject(p => ({...p, aspectRatio: r}))} onGenerate={handleGenerateVideo} script={project.script} audioUrl={audioUrl} subtitleStyle={project.subtitleStyle} />
          <div className="glass rounded-2xl p-5 flex-1 overflow-hidden flex flex-col">
            <h3 className="font-bold mb-4 flex justify-between items-center text-sm">
              <span>Phụ đề AI Chuẩn Xác (Dính Video)</span>
              <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">SỬA LẠI CHỮ</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {project.script.length > 0 ? project.script.map((beat, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl group hover:border-blue-500/50 transition-all">
                  <div className="flex justify-between mb-1 items-center">
                    <span className="text-[9px] font-black uppercase text-blue-500/70">{beat.type}</span>
                    <span className="text-[9px] text-slate-500 font-mono bg-slate-800 px-1.5 rounded">{beat.duration}s</span>
                  </div>
                  <input 
                    value={beat.content} 
                    onChange={(e) => updateScriptBeat(idx, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[13px] text-slate-200 font-medium focus:text-white transition-colors"
                  />
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
                  <p className="text-xs">Chưa có kịch bản dán chữ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
