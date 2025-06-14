// src/services/api.ts - KESİN VE DOĞRU HALE GETİRİLDİ
import { Conversation, Message, Platform, User } from '../types';

const API_BASE_URL = 'http://localhost:3000/api'; // Backend sunucumuzun adresi

// Helper function to make API requests
const fetchApi = async <T>(
  url: string,
  method: string = 'GET',
  body?: object
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json(); // Hata JSON'ı ayrıştırmaya çalış
    throw new Error(errorData.message || 'API isteği başarısız oldu.');
  }

  // 204 No Content yanıtları için boş obje döndür
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

// Auth related calls
export const loginUser = async (email: string, password: string): Promise<{ user: User } | null> => {
  try {
    const data = await fetchApi<{ user: User }>('/auth/login', 'POST', { email, password });
    return data;
  } catch (error) {
    console.error('Login API çağrısı hatası:', error);
    return null;
  }
};

// Conversation related calls
export const getConversations = async (platform?: Platform): Promise<Conversation[]> => {
  try {
    const url = platform ? `/conversations?platform=${platform}` : '/conversations';
    return await fetchApi<Conversation[]>(url);
  } catch (error) {
    console.error('Konuşmaları getirme API çağrısı hatası:', error);
    throw error;
  }
};

export const getConversationCounts = async (): Promise<Record<Platform, number>> => {
    try {
        const counts = await fetchApi<{ platform: Platform; count: number }[]>('/conversations/counts');
        const formattedCounts: Record<Platform, number> = { instagram: 0, whatsapp: 0, messenger: 0 };
        counts.forEach(item => {
            formattedCounts[item.platform] = item.count;
        });
        return formattedCounts;
    } catch (error) {
        console.error('Konuşma sayılarını getirme API çağrısı hatası:', error);
        throw error;
    }
};

export const getMessages = async (user_id: string): Promise<Message[]> => {
  try {
    return await fetchApi<Message[]>(`/conversations/${user_id}/messages`);
  } catch (error) {
    console.error('Mesajları getirme API çağrısı hatası:', error);
    throw error;
  }
};

// sendMessage fonksiyon tanımı: Platform 5. sırada, MessageType 6. sırada
export const sendMessage = async (
  conversationId: string,
  content: string,
  isOutbound: boolean,
  senderName: string,
  platform: Platform,       // <--- 5. parametre: Platform
  messageType: string , // <--- 6. parametre: MessageType (varsayılan 'text')
  imageUrl?: string,
  audioUrl?: string
): Promise<{ id: string, conversation_id: string, sender_name: string, content: string, is_outbound: boolean, timestamp: string, platform: Platform, type: string, image_url?: string, audio_url?: string }> => {
  try {
    const response = await fetchApi<{ id: string, conversation_id: string, sender_name: string, content: string, is_outbound: boolean, timestamp: string, platform: Platform, type: string, image_url?: string, audio_url?: string }>(
      `/conversations/${conversationId}/messages`,
      'POST',
      { content, isOutbound, senderName, platform, type: messageType, imageUrl, audioUrl }
    );
    return response;
  } catch (error) {
    console.error('Mesaj gönderme API çağrısı hatası:', error);
    throw error;
  }
};

// AI Agent Status related calls
export const getAgentStatus = async (platform: Platform): Promise<{ status: boolean }> => {
  try {
    return await fetchApi<{ status: boolean }>(`/agent-status/${platform}`);
  } catch (error) {
    console.error('AI durumu getirme API çağrısı hatası:', error);
    throw error;
  }
};

// // export const updateAgentStatus = async (platform: Platform, status: boolean): Promise<boolean> => {
//   try {
//     const result = await fetchApi<"">(`/agent-status/${platform}`, 'POST', { status });
//     return result.message === 'AI durumu başarıyla güncellendi.';
//   } catch (error) {
//     console.error('AI durumu güncelleme API çağrısı hatası:', error);
//     throw error;
//   }
// };