
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectConfig, ScriptBeat } from "../types";

export class AIService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  // Generate Script using Gemini 3 Flash
  async generateScript(topic: string, emotionGoal: string, keywords: string): Promise<ScriptBeat[]> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tạo kịch bản video viral cho chủ đề: "${topic}". 
      Mạch cảm xúc: "${emotionGoal}". 
      Từ khóa SEO: "${keywords}".
      Yêu cầu cấu trúc JSON mảng các đối tượng: { type: "HOOK" | "BODY" | "PAYOFF" | "CTA", content: string, duration: number }. 
      Tổng thời lượng khoảng 25-60 giây. Ngôn ngữ: Tiếng Việt.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["HOOK", "BODY", "PAYOFF", "CTA"] },
              content: { type: Type.STRING },
              duration: { type: Type.NUMBER }
            },
            required: ["type", "content", "duration"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Lỗi parse kịch bản:", e);
      return [];
    }
  }

  // Generate Video using Veo 3
  async generateVideo(config: ProjectConfig, referenceImageBase64?: string) {
    const ai = this.getAI();
    
    // Explicitly instruct character consistency if a reference image is present
    const characterContext = referenceImageBase64 
      ? "Duy trì sự đồng nhất của nhân vật chính từ hình ảnh tham khảo trong suốt video. "
      : "";
    
    const prompt = `${characterContext}${config.prompt}. Style: ${config.seoKeywords}. Mạch cảm xúc: ${config.emotionGoal}. Đảm bảo nhân vật chính xuất hiện xuyên suốt.`;
    
    const videoPayload: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: config.resolution,
        aspectRatio: config.aspectRatio
      }
    };

    if (referenceImageBase64) {
      videoPayload.image = {
        imageBytes: referenceImageBase64.split(',')[1],
        mimeType: 'image/png'
      };
    }

    return await ai.models.generateVideos(videoPayload);
  }

  async pollVideoStatus(operation: any) {
    const ai = this.getAI();
    return await ai.operations.getVideosOperation({ operation });
  }

  // Generate Voiceover using TTS for a specific text
  async generateSpeech(text: string, voiceName: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Đọc văn bản sau một cách tự nhiên, truyền cảm và đồng nhất giọng điệu: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO' as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || '';
  }
}

export const aiService = new AIService();
