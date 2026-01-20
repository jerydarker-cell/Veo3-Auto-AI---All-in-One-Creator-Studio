
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:3' | '21:9' | 'Custom';
export type Resolution = '720p' | '1080p';
export type SubtitleStyle = 'viral' | 'minimal' | 'neon' | 'karaoke';

export interface ScriptBeat {
  type: 'HOOK' | 'BODY' | 'PAYOFF' | 'CTA';
  content: string;
  duration: number; // in seconds
}

export interface VoicePreset {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: string;
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  promptPrefix: string;
}

export interface ProjectConfig {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  customWidth?: number;
  customHeight?: number;
  resolution: Resolution;
  script: ScriptBeat[];
  voiceId: string;
  templateId: string;
  emotionGoal: string;
  seoKeywords: string;
  duration: number;
  subtitleStyle: SubtitleStyle;
}

export interface GenerationState {
  isGenerating: boolean;
  status: string;
  progress: number;
  error: string | null;
  videoUrl: string | null;
  videoQueue: string[];
}
