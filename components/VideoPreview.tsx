
import React, { useRef, useEffect, useState } from 'react';
import { GenerationState, AspectRatio, ScriptBeat } from '../types';

interface VideoPreviewProps {
  genState: GenerationState;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  onGenerate: () => void;
  script: ScriptBeat[];
  audioUrl: string | null;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ genState, aspectRatio, setAspectRatio, onGenerate, script, audioUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useEffect(() => {
    if (genState.videoUrl && videoRef.current) {
      setIsVideoLoading(true);
      videoRef.current.play().then(() => setIsVideoLoading(false)).catch(e => {
        console.log("Auto-play blocked", e);
        setIsVideoLoading(false);
      });
      if (audioUrl && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio-play blocked", e));
      }
    }
  }, [genState.videoUrl, audioUrl]);

  // Sync Video and Audio
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const syncAudio = () => {
      if (Math.abs(video.currentTime - audio.currentTime) > 0.15) {
        audio.currentTime = video.currentTime;
      }
    };

    const handlePlay = () => audio.play().catch(() => {});
    const handlePause = () => audio.pause();

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', syncAudio);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', syncAudio);
    };
  }, [genState.videoUrl, audioUrl]);

  // Handle Subtitles Synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !script.length || !genState.videoUrl) return;

    const updateSubtitles = () => {
      const currentTime = video.currentTime;
      let accumulatedTime = 0;
      let activeSubtitle = "";

      for (const beat of script) {
        if (currentTime >= accumulatedTime && currentTime < accumulatedTime + beat.duration) {
          activeSubtitle = beat.content;
          break;
        }
        accumulatedTime += beat.duration;
      }
      setCurrentSubtitle(activeSubtitle);

      if (isExporting) {
        const totalDuration = script.reduce((acc, curr) => acc + curr.duration, 0) || video.duration;
        setExportProgress(Math.floor((currentTime / totalDuration) * 100));
      }
    };

    video.addEventListener('timeupdate', updateSubtitles);
    return () => video.removeEventListener('timeupdate', updateSubtitles);
  }, [script, genState.videoUrl, isExporting]);

  const toggleAspectRatio = () => {
    setAspectRatio(aspectRatio === '9:16' ? '16:9' : '9:16');
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const downloadFullVideo = async () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const videoStream = (video as any).captureStream();
      const audioStream = (audio as any).captureStream ? (audio as any).captureStream() : (audio as any).mozCaptureStream();
      
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(combinedStream, { 
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 8000000 
      });
      
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(fullBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `veo3_pro_export_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsExporting(false);
        setExportProgress(0);
      };

      video.currentTime = 0;
      audio.currentTime = 0;
      
      await new Promise(r => setTimeout(r, 800));
      
      recorder.start();
      video.play();
      audio.play();

      video.onended = () => {
        recorder.stop();
        video.onended = null;
      };
    } catch (err) {
      console.error("Lỗi xuất video:", err);
      setIsExporting(false);
      alert("Trình duyệt không hỗ trợ Media Capture. Hãy thử Chrome hoặc Edge mới nhất.");
    }
  };

  return (
    <div className="glass rounded-2xl p-4 flex flex-col items-center">
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`video-container w-full max-w-[280px] rounded-xl overflow-hidden transition-all duration-500 ease-in-out border-2 ${
          isHovered ? 'scale-[1.03] border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.5)]' : 'border-slate-800'
        } ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} ${genState.isGenerating ? 'pulse-active' : ''} ${isShaking ? 'shake-effect' : ''}`}
      >
        {genState.videoUrl ? (
          <>
            <video 
              ref={videoRef}
              src={genState.videoUrl} 
              controls 
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onWaiting={() => setIsVideoLoading(true)}
              onPlaying={() => setIsVideoLoading(false)}
            />
            {audioUrl && (
              <audio ref={audioRef} src={audioUrl} className="hidden" crossOrigin="anonymous" />
            )}
            
            {isVideoLoading && !isExporting && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {isExporting && (
              <div className="absolute inset-0 export-overlay z-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-400">{exportProgress}%</div>
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Đang Ghi Hình Đồng Bộ</h4>
                <p className="text-[9px] text-slate-400 mb-4 uppercase tracking-widest">Đừng tắt trình duyệt</p>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300" 
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            {genState.isGenerating ? (
              <div className="space-y-4 flex flex-col items-center w-full px-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="space-y-1 w-full text-center">
                  <p className="text-blue-400 font-medium animate-pulse text-xs">{genState.status}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{genState.progress}%</p>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${genState.progress}%` }}></div>
                </div>
              </div>
            ) : (
              <>
                <div className={`p-5 rounded-full bg-slate-800/50 mb-4 transition-all duration-500 ${isHovered ? 'scale-110 bg-blue-500/10' : ''}`}>
                  <svg className={`w-12 h-12 transition-colors duration-500 ${isHovered ? 'text-blue-400' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sẵn sàng sáng tạo với Veo 3</p>
              </>
            )}
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button onClick={toggleAspectRatio} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-blue-600 transition-all shadow-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
          <button onClick={triggerShake} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-red-600 transition-all shadow-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
        </div>

        {genState.videoUrl && currentSubtitle && !isExporting && (
          <div className="absolute bottom-12 left-0 right-0 px-6 text-center pointer-events-none">
            <p className="bg-black/80 backdrop-blur-lg text-white text-[11px] py-2 px-4 rounded-xl border border-white/10 shadow-2xl inline-block font-bold leading-tight animate-fade-in ring-1 ring-white/20">
              {currentSubtitle}
            </p>
          </div>
        )}
      </div>

      <div className="w-full mt-6 space-y-3">
        <button 
          onClick={onGenerate}
          disabled={genState.isGenerating || isExporting}
          className="w-full py-4 bg-white text-slate-950 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all active:scale-[0.98] disabled:opacity-50 group shadow-lg shadow-white/5"
        >
          {genState.isGenerating ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          {genState.isGenerating ? 'Đang xuất kịch bản...' : `Sản xuất Video AI (${aspectRatio})`}
        </button>

        {genState.videoUrl && (
          <div className="flex flex-col gap-2">
            <button 
              onClick={downloadFullVideo}
              disabled={isExporting}
              className={`w-full py-4 ${isExporting ? 'bg-indigo-900' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 shadow-lg'} text-white rounded-xl font-bold flex flex-col items-center justify-center transition-all border border-indigo-500/20`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>{isExporting ? `Đang hợp nhất âm thanh (${exportProgress}%)` : 'Tải Video Pro (Full Sync)'}</span>
              </div>
              {!isExporting && <span className="text-[8px] opacity-80 mt-1 font-black uppercase tracking-widest">Đã bao gồm lồng tiếng & kịch bản</span>}
            </button>
            <div className="grid grid-cols-2 gap-2">
               <a href={genState.videoUrl} download="veo3_raw.mp4" className="py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-[9px] text-center hover:bg-slate-700 transition font-bold text-slate-400">Video thô (Silent)</a>
               {audioUrl && <a href={audioUrl} download="veo3_audio.wav" className="py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-[9px] text-center hover:bg-slate-700 transition font-bold text-slate-400">Lồng tiếng (WAV)</a>}
            </div>
          </div>
        )}

        {genState.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] text-center font-bold">{genState.error}</div>
        )}
      </div>
    </div>
  );
};
