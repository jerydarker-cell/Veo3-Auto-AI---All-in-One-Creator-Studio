
import React, { useState, useEffect, useCallback } from 'react';
import { ProjectConfig, GenerationState, AspectRatio, VoicePreset } from './types';
import { VIDEO_TEMPLATES, VOICE_PRESETS, EMOTION_GOALS } from './constants';
import { aiService } from './services/aiService';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { VideoPreview } from './components/VideoPreview';

const STORAGE_KEY = 'veo3_project_config_v2';

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
    duration: 25
  });

  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    status: 'Sẵn sàng',
    progress: 0,
    error: null,
    videoUrl: null
  });

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'voice'>('editor');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProject(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi tải dự án:", e);
      }
    }
  }, []);

  const saveProject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    alert('Đã lưu cấu hình dự án!');
  }, [project]);

  const handleGenerateScript = async () => {
    if (!project.prompt) {
      alert("Vui lòng nhập ý tưởng video trước.");
      return;
    }
    setGenState(prev => ({ ...prev, isGenerating: true, status: 'Đang thiết kế kịch bản virus...' }));
    try {
      const script = await aiService.generateScript(project.prompt, project.emotionGoal, project.seoKeywords);
      setProject(prev => ({ ...prev, script }));
      setGenState(prev => ({ ...prev, isGenerating: false, status: 'Kịch bản đã sẵn sàng!' }));
    } catch (error: any) {
      setGenState(prev => ({ ...prev, isGenerating: false, error: "Lỗi tạo kịch bản: " + error.message }));
    }
  };

  const decodeBase64 = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const generateFullVoiceover = async (script: any[], voiceId: string) => {
    const voice = VOICE_PRESETS.find(v => v.id === voiceId) || VOICE_PRESETS[0];
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    setGenState(prev => ({ ...prev, status: 'Đang lồng tiếng AI đồng nhất...' }));
    
    try {
      const audioBuffers: AudioBuffer[] = [];
      for (const beat of script) {
        const base64 = await aiService.generateSpeech(beat.content, voice.voiceName);
        if (base64) {
          const rawData = decodeBase64(base64);
          const dataInt16 = new Int16Array(rawData.buffer);
          const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
          }
          audioBuffers.push(buffer);
        }
      }

      if (audioBuffers.length === 0) return null;

      const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
      const combinedBuffer = audioContext.createBuffer(1, totalLength, 24000);
      let offset = 0;
      for (const buf of audioBuffers) {
        combinedBuffer.copyToChannel(buf.getChannelData(0), 0, offset);
        offset += buf.length;
      }

      const wavBlob = audioBufferToWav(combinedBuffer);
      return URL.createObjectURL(wavBlob);
    } catch (err) {
      console.error("Lỗi tạo âm thanh:", err);
      return null;
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; 
    const bitDepth = 16;
    const blockAlign = numChannels * (bitDepth / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;
    const arrayBuffer = new ArrayBuffer(fileSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handleGenerateVideo = async () => {
    if (!process.env.API_KEY) {
      alert("Vui lòng cấu hình API KEY trong môi trường.");
      return;
    }

    setGenState(prev => ({ ...prev, isGenerating: true, status: 'Khởi tạo Veo 3 Engine...', progress: 5, videoUrl: null, error: null }));
    setAudioUrl(null);
    
    try {
      const template = VIDEO_TEMPLATES.find(t => t.id === project.templateId);
      const finalConfig = { ...project, prompt: (template?.promptPrefix || '') + project.prompt };
      
      let operation = await aiService.generateVideo(finalConfig, refImage || undefined);
      
      const pollInterval = setInterval(async () => {
        try {
          const update = await aiService.pollVideoStatus(operation);
          operation = update;

          if (update.error) {
            clearInterval(pollInterval);
            setGenState(prev => ({ ...prev, isGenerating: false, error: `AI Error: ${update.error.message || 'Lỗi không xác định trong quá trình tạo video.'}` }));
            return;
          }

          if (update.done) {
            clearInterval(pollInterval);
            const uri = update.response?.generatedVideos?.[0]?.video?.uri;
            if (uri) {
              setGenState(prev => ({ ...prev, status: 'Đang tải tệp video AI...', progress: 95 }));
              
              const videoResponse = await fetch(`${uri}&key=${process.env.API_KEY}`);
              if (!videoResponse.ok) throw new Error("Không thể tải tập tin video từ máy chủ.");
              
              const blob = await videoResponse.blob();
              const url = URL.createObjectURL(blob);
              
              if (project.script.length > 0) {
                const combinedAudioUrl = await generateFullVoiceover(project.script, project.voiceId);
                setAudioUrl(combinedAudioUrl);
              }
              
              setGenState({ isGenerating: false, status: 'Hoàn tất!', progress: 100, error: null, videoUrl: url });
            } else {
              setGenState(prev => ({ ...prev, isGenerating: false, error: 'Phản hồi từ AI không chứa dữ liệu video (URI trống).' }));
            }
          } else {
            setGenState(prev => ({ 
              ...prev, 
              progress: Math.min(prev.progress + 1.5, 92), 
              status: 'Đang kết xuất nhân vật & bối cảnh CGI...' 
            }));
          }
        } catch (pollError: any) {
          clearInterval(pollInterval);
          setGenState(prev => ({ ...prev, isGenerating: false, error: "Lỗi kết nối hoặc API: " + pollError.message }));
        }
      }, 5000);

    } catch (error: any) {
      setGenState({ isGenerating: false, status: 'Lỗi hệ thống', progress: 0, error: error.message, videoUrl: null });
    }
  };

  const handleNewProject = () => {
    if (confirm("Xác nhận tạo dự án mới? Dữ liệu chưa lưu sẽ bị xóa.")) {
      setProject({
        id: Date.now().toString(),
        name: 'Dự án mới',
        prompt: '',
        negativePrompt: '',
        aspectRatio: '9:16',
        resolution: '720p',
        script: [],
        voiceId: VOICE_PRESETS[0].id,
        templateId: VIDEO_TEMPLATES[0].id,
        emotionGoal: EMOTION_GOALS[0],
        seoKeywords: '',
        duration: 25
      });
      setRefImage(null);
      setAudioUrl(null);
      setGenState({ isGenerating: false, status: 'Sẵn sàng', progress: 0, error: null, videoUrl: null });
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
      <Sidebar 
        project={project} 
        setProject={setProject} 
        saveProject={saveProject}
        onNewProject={handleNewProject}
      />

      <main className="flex-1 flex flex-col md:flex-row p-4 gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Veo3 Studio AI</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Sáng tạo video All-in-One cho Creator</p>
            </div>
            <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-800">
              <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>Cấu hình</button>
              <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'templates' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>Mẫu Video</button>
              <button onClick={() => setActiveTab('voice')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'voice' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}>Lồng tiếng</button>
            </div>
          </header>

          <Editor 
            project={project} 
            setProject={setProject} 
            activeTab={activeTab}
            refImage={refImage}
            setRefImage={setRefImage}
            onGenerateScript={handleGenerateScript}
            isGenerating={genState.isGenerating}
          />
        </div>

        <div className="w-full md:w-[380px] flex flex-col gap-4">
          <VideoPreview 
            genState={genState} 
            aspectRatio={project.aspectRatio}
            setAspectRatio={(ratio) => setProject(p => ({ ...p, aspectRatio: ratio }))}
            onGenerate={handleGenerateVideo}
            script={project.script}
            audioUrl={audioUrl}
          />
          
          <div className="glass rounded-2xl p-5 flex-1 overflow-hidden flex flex-col border-slate-800/50">
            <h3 className="font-bold flex items-center gap-2 mb-4"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>Dòng thời gian Kịch bản</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {project.script.length > 0 ? project.script.map((beat, idx) => (
                <div key={idx} className="group p-3 bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-xl transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${beat.type === 'HOOK' ? 'bg-red-500/10 text-red-400' : beat.type === 'CTA' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{beat.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{beat.duration}s</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">"{beat.content}"</p>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 2v4a2 2 0 002 2h4" /></svg>
                  <p className="text-sm">Chưa có kịch bản AI</p>
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
