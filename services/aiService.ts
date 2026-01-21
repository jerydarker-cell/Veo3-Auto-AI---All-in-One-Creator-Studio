
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProjectConfig, ScriptBeat } from "../types";

export class AIService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateScript(topic: string, emotionGoal: string, keywords: string, duration: number = 25): Promise<ScriptBeat[]> {
    const ai = this.getAI();
    
    const estimatedWordCount = Math.floor(duration * 2.5);
    const durationLabel = duration <= 20 ? "NGẮN (Reels/Shorts)" : duration >= 60 ? "DÀI (Storytelling)" : "TIÊU CHUẨN";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Bạn là chuyên gia biên kịch video viral và tối ưu hóa phụ đề (Subtitle Expert) hàng đầu Việt Nam.
      Chủ đề: "${topic}".
      Mạch cảm xúc mong muốn: "${emotionGoal}".
      Từ khóa SEO: "${keywords}".
      
      YÊU CẦU QUAN TRỌNG VỀ THỜI LƯỢNG:
      - Thời lượng mục tiêu: ${duration} giây (${durationLabel}).
      - Tổng độ dài kịch bản phải xấp xỉ ${estimatedWordCount} từ.

      NHIỆM VỤ:
      1. Viết kịch bản video chia làm các phân đoạn (beats).
      2. MỖI PHÂN ĐOẠN PHẢI LÀ MỘT CÂU PHỤ ĐỀ HOÀN CHỈNH, NGẮN GỌN (tối đa 10-12 từ).
      3. Đảm bảo ngôn từ Tiếng Việt chuẩn xác tuyệt đối.
      
      PHÂN LOẠI BEATS:
      - HOOK: Câu đầu tiên gây sốc (0-3s).
      - BODY: Diễn giải nội dung.
      - PAYOFF: Câu chốt kết quả.
      - CTA: Kêu gọi hành động.

      ĐỊNH DẠNG TRẢ VỀ: JSON array các object { type, content, duration }.`,
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

  async generateVideo(config: ProjectConfig, referenceImageBase64?: string) {
    const ai = this.getAI();
    
    // Nâng cấp Prompt để giữ tính đồng nhất vật thể/giày
    let finalPrompt = `Cinematic high-end video showcase. Scene: ${config.prompt}. Style: ${config.seoKeywords}. Cinematography: Masterpiece, 8k, professional product lighting, fluid and realistic camera movement.`;
    
    if (referenceImageBase64) {
      // Prompt đặc biệt để AI tập trung vào việc giữ nguyên thiết kế từ ảnh gốc
      finalPrompt = `STRICT PRODUCT CONSISTENCY: Maintain the exact design, colorway, material textures, and silhouette of the product/shoes shown in the reference image. ${finalPrompt} The item in the video must be identical to the starting frame. No design changes allowed. High-fidelity rendering.`;
    }
    
    const veoAspectRatio = config.aspectRatio === '16:9' ? '16:9' : '9:16';

    const videoParams: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: finalPrompt,
      config: {
        numberOfVideos: 1,
        resolution: config.resolution,
        aspectRatio: veoAspectRatio
      }
    };

    if (referenceImageBase64) {
      const matches = referenceImageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        videoParams.image = {
          mimeType: matches[1],
          imageBytes: matches[2]
        };
      }
    }

    return await ai.models.generateVideos(videoParams);
  }

  async pollVideoStatus(operation: any) {
    const ai = this.getAI();
    return await ai.operations.getVideosOperation({ operation });
  }

  async generateSpeech(text: string, voiceName: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Hãy đọc đoạn văn Tiếng Việt này thật truyền cảm: "${text}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any }
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  }
}

export const aiService = new AIService();
