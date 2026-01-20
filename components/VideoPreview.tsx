
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GenerationState, AspectRatio, ScriptBeat, SubtitleStyle } from '../types';

interface VideoPreviewProps {
  genState: GenerationState;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  onGenerate: () => void;
  script: ScriptBeat[];
  audioUrl: string | null;
  subtitleStyle: SubtitleStyle;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ genState, aspectRatio, setAspectRatio, onGenerate, script, audioUrl, subtitleStyle }) => {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerStyle = useMemo(() => {
    const ratios: Record<string, string> = { '9:16': '9/16', '16:9': '16/9', '1:1': '1/1', '4:3': '4/3', '21:9': '21/9' };
    return { aspectRatio: ratios[aspectRatio] || '9/16' };
  }, [aspectRatio]);

  const playVideoWithTransition = (url: string) => {
    const nextActive = activeVideo === 1 ? 2 : 1;
    const nextVideo = nextActive === 1 ? videoRef1.current : videoRef2.current;
    const prevVideo = activeVideo === 1 ? videoRef1.current : videoRef2.current;
    if (nextVideo) {
      setIsVideoLoading(true);
      nextVideo.src = url;
      nextVideo.oncanplay = () => {
        setIsTransitioning(true); setIsVideoLoading(false);
        nextVideo.play().catch(() => {});
        if (currentIndex === 0 && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
        setTimeout(() => { setActiveVideo(nextActive); setIsTransitioning(false); if (prevVideo) prevVideo.pause(); }, 600);
      };
    }
  };

  useEffect(() => {
    if (genState.videoQueue.length > 0) {
      const latest = genState.videoQueue[genState.videoQueue.length - 1];
      setCurrentIndex(genState.videoQueue.length - 1);
      playVideoWithTransition(latest);
    }
  }, [genState.videoQueue]);

  useEffect(() => {
    const v = activeVideo === 1 ? videoRef1.current : videoRef2.current;
    if (!v) return;
    const updateSubtitles = () => {
      let acc = 0; let found = "";
      for (const beat of script) {
        if (v.currentTime >= acc && v.currentTime < acc + beat.duration) { found = beat.content; break; }
        acc += beat.duration;
      }
      if (found !== currentSubtitle) setCurrentSubtitle(found);
      if (isExporting) setExportProgress(Math.floor((v.currentTime / v.duration) * 100));
    };
    v.addEventListener('timeupdate', updateSubtitles);
    return () => v.removeEventListener('timeupdate', updateSubtitles);
  }, [script, genState.videoQueue, isExporting, activeVideo, currentSubtitle]);

  const drawSubtitle = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, style: SubtitleStyle, time: number) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (style === 'viral') {
      ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = fontSize * 0.2;
      ctx.strokeText(text, x, y);
      const grad = ctx.createLinearGradient(x, y - fontSize/2, x, y + fontSize/2);
      grad.addColorStop(0, '#FFF176'); grad.addColorStop(1, '#FFD600');
      ctx.fillStyle = grad;
      ctx.fillText(text, x, y);
    } 
    else if (style === 'minimal') {
      const padding = fontSize * 0.4;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.roundRect(x - textWidth/2 - padding, y - fontSize/2 - padding/2, textWidth + padding*2, fontSize + padding, 10);
      ctx.fill();
      ctx.font = `500 ${fontSize * 0.8}px "Inter", sans-serif`;
      ctx.fillStyle = 'white';
      ctx.fillText(text, x, y);
    }
    else if (style === 'neon') {
      ctx.font = `800 ${fontSize}px "Inter", sans-serif`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsl(${(time * 50) % 360}, 100%, 50%)`;
      ctx.fillStyle = 'white';
      ctx.fillText(text, x, y);
    }
    else if (style === 'karaoke') {
      ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
      ctx.fillStyle = 'white';
      ctx.fillText(text, x, y);
      
      const progress = (time % 2) / 2; // Giả lập nhịp karaoke
      const textWidth = ctx.measureText(text).width;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - textWidth/2, y - fontSize/2, textWidth * progress, fontSize);
      ctx.clip();
      ctx.fillStyle = '#ff00ff';
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    ctx.restore();
  };

  const downloadFullVideo = async () => {
    const v = activeVideo === 1 ? videoRef1.current : videoRef2.current;
    const a = audioRef.current;
    const canvas = canvasRef.current;
    if (!v || !a || !canvas) return;
    setIsExporting(true);
    const ctx = canvas.getContext('2d')!;
    canvas.width = v.videoWidth || 1080; canvas.height = v.videoHeight || 1920;
    
    const stream = canvas.captureStream(60);
    const audioStream = (a as any).captureStream ? (a as any).captureStream() : (a as any).mozCaptureStream();
    const recorder = new MediaRecorder(new MediaStream([...stream.getVideoTracks(), ...audioStream.getAudioTracks()]), { 
      mimeType: 'video/webm;codecs=vp9,opus', 
      videoBitsPerSecond: 25000000 
    });
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
      const link = document.createElement('a'); link.href = url; link.download = `veo3_viral_${Date.now()}.webm`; link.click();
      setIsExporting(false);
    };
    
    v.currentTime = 0; a.currentTime = 0; v.play(); a.play();
    
    const render = () => {
      if (v.paused || v.ended) return;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      let acc = 0; let activeBeat = "";
      for (const beat of script) { if (v.currentTime >= acc && v.currentTime < acc + beat.duration) { activeBeat = beat.content; break; } acc += beat.duration; }
      if (activeBeat) {
        const fs = Math.floor(canvas.width * 0.08);
        drawSubtitle(ctx, activeBeat, canvas.width / 2, canvas.height * 0.75, fs, subtitleStyle, v.currentTime);
      }
      requestAnimationFrame(render);
    };
    render(); recorder.start(); v.onended = () => recorder.stop();
  };

  const getSubtitleClass = (style: SubtitleStyle) => {
    switch(style) {
      case 'viral': return 'bg-black/60 text-yellow-300 border-yellow-400/20 text-shadow-black';
      case 'minimal': return 'bg-black/80 text-white border-white/10 font-medium';
      case 'neon': return 'bg-transparent text-white neon-text animate-pulse';
      case 'karaoke': return 'bg-black/40 text-white border-white/20 font-black';
      default: return '';
    }
  };

  return (
    <div className="glass rounded-2xl p-4 flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />
      <div className="video-container w-full max-w-[280px] rounded-xl overflow-hidden relative" style={containerStyle}>
        {genState.videoQueue.length > 0 ? (
          <>
            <video ref={videoRef1} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${activeVideo === 1 ? 'opacity-100 z-10' : 'opacity-0'}`} crossOrigin="anonymous" />
            <video ref={videoRef2} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${activeVideo === 2 ? 'opacity-100 z-10' : 'opacity-0'}`} crossOrigin="anonymous" />
            {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" crossOrigin="anonymous" />}
            {isExporting && (
              <div className="absolute inset-0 export-overlay z-50 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h4 className="font-bold mb-2 uppercase tracking-widest text-xs">Đang dán chữ cứng... {exportProgress}%</h4>
                <p className="text-[10px] opacity-70">Phong cách: {subtitleStyle.toUpperCase()}</p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            {genState.isGenerating ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[10px] font-bold uppercase tracking-widest animate-pulse">{genState.status}</div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-300" style={{width: `${genState.progress}%`}}></div>
                </div>
              </div>
            ) : "Hệ thống Veo 3 đã sẵn sàng"}
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
          <button onClick={() => setAspectRatio(aspectRatio === '9:16' ? '16:9' : '9:16')} className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-blue-600 transition shadow-xl">📱</button>
          <button onClick={onGenerate} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition shadow-xl">➕</button>
        </div>
        {currentSubtitle && !isExporting && (
          <div className="absolute bottom-16 left-0 right-0 px-4 text-center z-20 flex justify-center">
            <p className={`backdrop-blur-md text-[13px] py-1.5 px-4 rounded-xl font-black border-2 shadow-2xl animate-[pop_0.3s_ease-out] max-w-[90%] leading-tight ${getSubtitleClass(subtitleStyle)}`}>
              {currentSubtitle}
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pop { 0% { transform: scale(0.8); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
        .text-shadow-black { text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
        .neon-text { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff00de, 0 0 30px #ff00de; }
      `}</style>
      <div className="w-full mt-6 space-y-3">
        <button onClick={onGenerate} disabled={genState.isGenerating} className="w-full py-4 bg-white text-slate-900 rounded-xl font-black uppercase hover:bg-blue-50 transition shadow-lg active:scale-95 disabled:opacity-50">
          {genState.isGenerating ? 'Đang xuất bản...' : 'Sản xuất Video Viral AI'}
        </button>
        {genState.videoQueue.length > 0 && (
          <button onClick={downloadFullVideo} disabled={isExporting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-500 transition flex items-center justify-center gap-2">
            {isExporting ? <span className="animate-pulse">Đang kết xuất...</span> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Tải Video Dán Chữ Chuẩn</>}
          </button>
        )}
      </div>
    </div>
  );
};
