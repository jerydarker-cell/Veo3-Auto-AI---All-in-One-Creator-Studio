
import { VoicePreset, VideoTemplate } from './types';

export const VOICE_PRESETS: VoicePreset[] = [
  { id: 'v1', name: 'Nam MC Tin Tức', gender: 'male', style: 'Chuyên nghiệp, đĩnh đạc', voiceName: 'Kore' },
  { id: 'v2', name: 'Nữ Thuyết Minh', gender: 'female', style: 'Truyền cảm, ấm áp', voiceName: 'Puck' },
  { id: 'v3', name: 'Nam Diễn Giả', gender: 'male', style: 'Năng lượng, truyền cảm hứng', voiceName: 'Charon' },
  { id: 'v4', name: 'Nữ Reviewer', gender: 'female', style: 'Trẻ trung, năng động', voiceName: 'Zephyr' },
  { id: 'v5', name: 'Giọng Kể Chuyện', gender: 'male', style: 'Huyền bí, trầm ấm', voiceName: 'Fenrir' },
  { id: 'v6', name: 'Nữ Thời Trang', gender: 'female', style: 'Sang trọng, lôi cuốn', voiceName: 'Zephyr' },
  { id: 'v7', name: 'Nam Podcast', gender: 'male', style: 'Thân thiện, gần gũi', voiceName: 'Kore' },
];

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'super_realistic',
    name: 'Siêu Thực Tế (Super Realistic)',
    description: 'Chuyển động mượt mà, ánh sáng CGI đỉnh cao, chất lượng như ảnh chụp.',
    previewUrl: 'https://picsum.photos/seed/realistic/400/600',
    promptPrefix: 'hyper-realistic 8k video, cinematic lighting, ultra-detailed texture, smooth motion, professional CGI, photorealistic masterpiece, '
  },
  {
    id: 'cyberpunk_glitch',
    name: 'Cyberpunk Glitch',
    description: 'Phong cách tương lai với hiệu ứng lỗi kỹ thuật, neon bloom và quang sai màu.',
    previewUrl: 'https://picsum.photos/seed/cyber/400/600',
    promptPrefix: 'cyberpunk glitch aesthetic, neon lights, chromatic aberration, digital distortion, future city, flickering neon, '
  },
  {
    id: 'product_ad',
    name: 'Quảng Cáo Sản Phẩm AI',
    description: 'Tập trung vào chi tiết, chuyển động quay chậm sang trọng cho sản phẩm.',
    previewUrl: 'https://picsum.photos/seed/product/400/600',
    promptPrefix: 'luxury product commercial, slow motion, elegant lighting, studio background, 4k macro shot, sleek presentation, '
  },
  {
    id: 'fashion_accessory',
    name: 'Thời Trang Phụ Kiện',
    description: 'Sống động, bắt mắt, phù hợp với xu hướng TikTok Fashion.',
    previewUrl: 'https://picsum.photos/seed/fashion/400/600',
    promptPrefix: 'dynamic fashion showcase, high speed cuts, stylish models, trendy accessories, vibrant colors, runway style, '
  },
  {
    id: 'kids_cartoon',
    name: 'Trò Chơi Hoạt Hình',
    description: 'Màu sắc rực rỡ, nhân vật đáng yêu, chuyển động vui nhộn cho trẻ em.',
    previewUrl: 'https://picsum.photos/seed/kids/400/600',
    promptPrefix: '3d animation for children, cute characters, bright vivid colors, playful atmosphere, Disney Pixar style, '
  }
];

export const EMOTION_GOALS = [
  'Hồi hộp đến Chiến thắng',
  'Hài hước đến Cung cấp thông tin',
  'Cảm động & Sâu sắc',
  'Năng lượng & Động lực',
  'Bí ẩn & Tò mò',
  'Sang trọng & Đẳng cấp'
];

export const TEXT_ANIMATIONS = [
  { id: 'shake', name: 'Lắc lưu', description: 'Hiệu ứng rung chuyển nhẹ nhàng' },
  { id: 'beat', name: 'Nhịp đập', description: 'Hiệu ứng phóng to thu nhỏ theo nhịp' },
  { id: 'fade', name: 'Mờ ảo', description: 'Hiệu ứng hiện hình mượt mà' }
];
