// src/services/api.ts - KESİN VE DOĞRU HALE GETİRİLDİ
import { Conversation, Message, Platform, User } from '../types'; // 'User' tipinin doğru olduğundan emin ol

const API_BASE_URL = 'http://localhost:3001/api'; // Backend sunucumuzun adresi

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

// --- Auth related calls ---
export const loginUser = async (email: string, password: string): Promise<{ user: User } | null> => {
  try {
    const data = await fetchApi<{ user: User }>('/auth/login', 'POST', { email, password });
    return data;
  } catch (error) {
    console.error('Login API çağrısı hatası:', error);
    return null;
  }
};

// --- Conversation related calls ---

/**
 * Belirli bir kullanıcıya ait konuşmaları platforma göre filtreleyerek çeker.
 * @param userId API'den çekilecek konuşmaların ait olduğu kullanıcı ID'si.
 * @param platform (Opsiyonel) Konuşmaların filtreleneceği platform (örn: 'whatsapp', 'instagram').
 * @returns Konuşma listesi.
 */
export const getConversations = async (userId: string, platform?: Platform): Promise<Conversation[]> => {
  try {
    let url = `/conversations?userId=${userId}`; // userId parametresi ekleniyor
    if (platform) {
      url += `&platform=${platform}`; // Eğer platform da varsa, & ile ekleniyor
    }
    console.log(`[API Service] Konuşmalar çekiliyor URL: ${url}`);
    const conversations = await fetchApi<Conversation[]>(url);
    return conversations;
  } catch (error) {
    console.error('Konuşmaları getirme API çağrısı hatası:', error);
    throw error;
  }
};

/**
 * Belirli bir kullanıcıya ait platform bazında konuşma sayılarını çeker.
 * @param userId API'den çekilecek konuşma sayılarının ait olduğu kullanıcı ID'si.
 * @returns Her platform için konuşma sayısı içeren obje.
 */
export const getConversationCounts = async (userId: string): Promise<Record<Platform, number>> => {
  try {
    // userId parametresi ekleniyor
    const countsResponse = await fetchApi<{ platform: Platform; count: number }[]>(`/conversations/counts?userId=${userId}`);
    
    const formattedCounts: Record<Platform, number> = { instagram: 0, whatsapp: 0, messenger: 0 };
    countsResponse.forEach(item => {
      formattedCounts[item.platform] = item.count;
    });
    return formattedCounts;
  } catch (error) {
    console.error('Konuşma sayılarını getirme API çağrısı hatası:', error);
    throw error;
  }
};

/**
 * Belirli bir konuşmaya ait mesajları platforma göre çeker.
 * @param conversationId Mesajların ait olduğu konuşma ID'si.
 * @param platform Mesajların ait olduğu platform.
 * @returns Mesaj listesi.
 */
export const getMessages = async (conversationId: string, platform: Platform): Promise<Message[]> => {
  try {
    console.log(`[API Service] Mesajlar çekiliyor for conversationId: ${conversationId}, platform: ${platform}`);
    // Doğru template literal syntax'ı kullanıldı: `${variable}`
    const messages = await fetchApi<Message[]>(`/conversations/${platform}/${conversationId}/messages`);
    return messages;
  } catch (error) {
    console.error('Mesajları getirme API çağrısı hatası:', error);
    throw error;
  }
};

/**
 * Yeni bir mesaj gönderir.
 * @param conversationId Mesajın gönderileceği konuşma ID'si.
 * @param content Mesaj içeriği.
 * @param isOutbound Giden mesaj mı (true) yoksa gelen mesaj mı (false).
 * @param senderName Mesajı gönderenin adı (örn: 'Müşteri Temsilcisi' veya 'Müşteri Adı').
 * @param platform Mesajın gönderildiği platform.
 * @param messageType Mesaj tipi (örn: 'text', 'image', 'audio').
 * @param imageUrl (Opsiyonel) Eğer mesaj tipi 'image' ise resim URL'si.
 * @param audioUrl (Opsiyonel) Eğer mesaj tipi 'audio' ise ses URL'si.
 * @returns Gönderilen mesaj objesi.
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  isOutbound: boolean,
  senderName: string,
  platform: Platform, // Doğru parametre sırası
  messageType: string, // Doğru parametre sırası
  imageUrl?: string,
  audioUrl?: string
): Promise<{ id: string, conversation_id: string, sender_name: string, content: string, is_outbound: boolean, timestamp: string, platform: Platform, type: string, image_url?: string, audio_url?: string }> => {
  try {
    // Backend'de mesaj oluşturma endpoint'inin `/messages` veya `/conversations/:conversationId/messages` olduğunu kontrol et.
    // Eğer `/messages` ise:
    const response = await fetchApi<{ id: string, conversation_id: string, sender_name: string, content: string, is_outbound: boolean, timestamp: string, platform: Platform, type: string, image_url?: string, audio_url?: string }>(
      '/messages', // Backend endpoint'ine göre bu URL'i ayarla (örn: /api/messages)
      'POST',
      { conversationId, content, isOutbound, senderName, platform, type: messageType, imageUrl, audioUrl }
    );
    return response;
  } catch (error) {
    console.error('Mesaj gönderme API çağrısı hatası:', error);
    throw error;
  }
};

// --- AI Agent Status related calls ---

/**
 * Belirli bir platform için AI ajanının durumunu çeker.
 * @param platform AI durumunun çekileceği platform.
 * @returns AI ajanının durumunu içeren obje (status: true/false).
 */
export const getAgentStatus = async (platform: Platform): Promise<{ status: boolean }> => {
  try {
    return await fetchApi<{ status: boolean }>(`/agent-status/${platform}`);
  } catch (error) {
    console.error('AI durumu getirme API çağrısı hatası:', error);
    throw error;
  }
};

/**
 * Belirli bir platform için AI ajanının durumunu günceller.
 * @param platform AI durumunun güncelleneceği platform.
 * @param status Yeni durum (true/false).
 * @returns Güncelleme başarılıysa true, değilse false.
 */
export const updateAgentStatus = async (platform: Platform, status: boolean): Promise<boolean> => {
  try {
    const result = await fetchApi<{ success: boolean }>(`/agent-status/${platform}`, 'POST', { status });
    console.log('Agent status güncelleme sonucu:', result);
    return result.success === true; // true ya da false dön
  } catch (error) {
    console.error('AI durumu güncelleme API çağrısı hatası:', error);
    return false; // hata durumunda false dön
  }
};