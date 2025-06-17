// src/types/types.ts - KESİN VE DOĞRU HALE GETİRİLDİ
export interface User {
  id: number; // Backend User modeline (User.ts) uygun olarak number yapıldı
  email: string;
  password_hash: string; // password yerine password_hash kullanıldı ve backend ile uyumlu
  database_name: string;
  created_at: string;
  // password alanı frontend için kaldırıldı
}

export type Platform = 'instagram' | 'whatsapp' | 'messenger';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'unknown';

export interface Message {
  id: string;
  conversation_id: string;
  sender_name: string;
  content: string; // Backend'den gelen ana metin içeriği
  message_text?: string; // Opsiyonel hale getirildi, çünkü content ile aynı olabilir
  image_url?: string | null; // Opsiyonel hale getirildi ve null olabilir
  audio_url?: string | null; // Opsiyonel hale getirildi ve null olabilir
  timestamp: string;
  is_outbound: boolean;
  platform: Platform;
  message_type: MessageType;
  // sender_avatar ve sticker_url tamamen kaldırıldı - çünkü backend'den gelmiyor ve istenmiyor
}

export interface Conversation {
  id: string;
  user_id: number; // Backend Conversation modeline uygun olarak eklendi (user_id: INT)
  contact_name: string;
  // contact_avatar: string; // İsteğiniz üzerine frontend'den ve bu interface'den kaldırıldı
  contact_phone_number?: string;
  contact_instagram_id?: string;
  last_message_content: string; // İsim backend ile uyumlu hale getirildi (last_message_content)
  last_message_timestamp: string; // İsim backend ile uyumlu hale getirildi (last_message_timestamp)
  unread_count: number;
  platform: Platform;
  created_at: string;
  updated_at: string;
}

export interface WhatsappBufferMessage {
  id: string;
  session_id: string;
  message_type: MessageType;
  message_text: string;
  image_url?: string | null;
  audio_url?: string | null;
  timestamp: string;
  is_processed: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface AgentStatus {
  user_id: number; // Backend'deki user_id'ye uygun olarak number yapıldı
  platform: Platform;
   status: 'active' | 'inactive'; // <<< İŞTE BU SATIRI DEĞİŞTİRDİK!
}