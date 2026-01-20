
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProjectConfig, ScriptBeat } from "../types";

export class AIService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateScript(topic: string, emotionGoal: string, keywords: string): Promise<ScriptBeat[]> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Bạn là chuyên gia biên kịch video viral và tối ưu hóa phụ đề (Subtitle Expert) hàng đầu Việt Nam.
      Chủ đề: "${topic}".
      Mạch cảm xúc mong muốn: "${emotionGoal}".
      Từ khóa SEO: "${keywords}".

      NHIỆM VỤ:
      1. Viết kịch bản video ngắn (20-45s) chia làm các phân đoạn (beats).
      2. MỖI PHÂN ĐOẠN PHẢI LÀ MỘT CÂU PHỤ ĐỀ HOÀN CHỈNH, NGẮN GỌN (tối đa 10 từ).
      3. Đảm bảo ngôn từ Tiếng Việt chuẩn xác tuyệt đối, không sai chính tả, dấu câu đặt đúng chỗ để khi hiển thị dính trên video sẽ cực kỳ chuyên nghiệp.
      4. TRÍCH XUẤT THÔNG ĐIỆP CHÍNH: Nếu lời nhắc có chứa nội dung cụ thể, bạn PHẢI biến nó thành câu phụ đề đắt giá nhất.
      
      PHÂN LOẠI BEATS:
      - HOOK: Câu đầu tiên gây sốc hoặc tò mò.
      - BODY: Diễn giải nội dung chính, mỗi beat là một ý tưởng hình ảnh.
      - PAYOFF: Câu chốt giá trị hoặc kết quả.
      - CTA: Kêu gọi hành động (Follow, Tim, Mua ngay).

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
    const prompt = `High-end cinematic video. Scene: ${config.prompt}. Style: ${config.seoKeywords}. Cinematography: Masterpiece, 8k, fluid motion, professional lighting.`;
    
    const veoAspectRatio = config.aspectRatio === '16:9' ? '16:9' : '9:16';

    const videoParams: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: config.resolution,
        aspectRatio: veoAspectRatio
      }
    };

    // Nếu có ảnh tham khảo, truyền vào tham số 'image' để đảm bảo đồng nhất
    if (referenceImageBase64) {
      // Tách mimeType và data từ chuỗi base64 (ví dụ: data:image/png;base64,iVBOR...)
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
      contents: [{ parts: [{ text: `Hãy đọc đoạn văn Tiếng Việt này thật truyền cảm, tự nhiên, ngắt nghỉ đúng nhịp để khớp hoàn hảo với phụ đề chạy trên video: "${text}"` }] }],
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
