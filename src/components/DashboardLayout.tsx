// src/components/DashboardLayout.tsx - KESİN VE DOĞRU HALE GETİRİLDİ
import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, MessageSquare, Menu, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Platform, Conversation, Message } from '../types';
import { getConversations, getMessages, getAgentStatus, sendMessage, getConversationCounts } from '../services/api';
import PlatformTabs from './PlatformTabs';
import ChatList from './ChatList';
import ChatThread from './ChatThread';
import ChatInputBox from './ChatInputBox';
import AIStatusBanner from './AIStatusBanner';
import AIToggle from './AIToggle';
import MobileMenu from './MobileMenu';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth(); // AuthContext'ten user ve logout alıyoruz
  const [activePlatform, setActivePlatform] = useState<Platform>('instagram'); // Varsayılan olarak Instagram seçili
  const [activeConversation, setActiveConversation] = useState<string | null>(null); // Aktif konuşmanın ID'si
  const [conversations, setConversations] = useState<Conversation[]>([]); // Konuşma listesi
  const [messages, setMessages] = useState<Message[]>([]); // Aktif konuşmaya ait mesajlar
  const [conversationCounts, setConversationCounts] = useState<Record<Platform, number>>({ // Platformlara göre konuşma sayıları
    instagram: 0,
    whatsapp: 0,
    messenger: 0,
  });
  const [aiStatus, setAiStatus] = useState<Record<Platform, boolean>>({ // AI ajan durumları
    instagram: false,
    whatsapp: false,
    messenger: false,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobil menü açık mı?
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Sidebar gizli mi?
  const [isLoadingConversations, setIsLoadingConversations] = useState(true); // Konuşmalar yükleniyor mu?
  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // Mesajlar yükleniyor mu?

  // --- Konuşmaları Yükleme Fonksiyonu ---
  const loadConversations = useCallback(async (platform: Platform) => {
    // Kullanıcı ID'sini user objesinden alıyoruz. Eğer yoksa varsayılan bir değer kullanıyoruz.
    // Backend'de userId'yi Auth middleware'ı olmadan query'den aldığımız için burada göndermemiz önemli.
    const currentUserId = user?.id || 'your_default_user_id'; // Kendi varsayılan user ID'nizi veya kullanıcı objesinden geleni kullanın
    
    setIsLoadingConversations(true);
    try {
      // getConversations API çağrısına userId'yi ekledik
      const fetchedConversations = await getConversations(currentUserId, platform); 
      console.log(`[DashboardLayout] Fetched conversations for ${platform}:`, fetchedConversations);
      setConversations(fetchedConversations);

      // Eğer aktif bir konuşma seçili değilse ve yeni konuşmalar varsa, ilkini otomatik seç
      if (!activeConversation && fetchedConversations.length > 0) {
        setActiveConversation(fetchedConversations[0].id);
      }
    } catch (error) {
      console.error(`[DashboardLayout] Konuşmalar yüklenemedi (${platform}):`, error);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, activeConversation]); // user ve activeConversation bağımlılık olarak eklendi

  // --- Konuşma Sayılarını Yükleme Fonksiyonu ---
  const loadAllConversationCounts = useCallback(async () => {
    // Kullanıcı ID'sini burada da gönderiyoruz
    const currentUserId = user?.id || 'your_default_user_id';
    try {
      // getConversationCounts API çağrısına userId'yi ekledik
      const counts = await getConversationCounts(currentUserId);
      console.log('[DashboardLayout] Fetched conversation counts:', counts);
      setConversationCounts(counts);
    } catch (error) {
      console.error('[DashboardLayout] Konuşma sayıları yüklenemedi:', error);
      setConversationCounts({ instagram: 0, whatsapp: 0, messenger: 0 });
    }
  }, [user]); // user bağımlılık olarak eklendi

  // --- Mesajları Yükleme Fonksiyonu ---
  const loadMessages = useCallback(async (convId: string, currentPlatform: Platform) => { // Platform parametresi eklendi
    setIsLoadingMessages(true);
    console.log(`[DashboardLayout] Loading messages for conversationId: ${convId} on platform: ${currentPlatform}`);

    try {
      // getMessages API çağrısına platformu da gönderiyoruz
      const fetchedMessages = await getMessages(convId, currentPlatform); 
      console.log(`[DashboardLayout] Fetched messages for ${convId} (${currentPlatform}):`, fetchedMessages);

      // Backend'den gelen veri dizi değilse (örn: tek bir obje), bunu düzeltiyoruz
      if (!Array.isArray(fetchedMessages)) {
        console.warn("Beklenen mesaj listesi bir dizi değildi, düzeltildi:", fetchedMessages);
        setMessages([]); // Hata durumunda boş dizi set etmek daha güvenli
      } else {
        setMessages(fetchedMessages);
      }
    } catch (error) {
      console.error(`[DashboardLayout] Mesajlar yüklenemedi (${convId}):`, error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []); // Bağımlılıklar: [] (çünkü convId ve currentPlatform dışarıdan geliyor)

  // --- AI Ajan Durumunu Yükleme Fonksiyonu ---
  const loadAIStatus = useCallback(async () => {
    const newStatus: Record<Platform, boolean> = { instagram: false, whatsapp: false, messenger: false };
    for (const p of Object.keys(newStatus) as Platform[]) {
      try {
        const { status } = await getAgentStatus(p);
        newStatus[p] = status;
      } catch {
        newStatus[p] = false;
      }
    }
    setAiStatus(newStatus);
  }, []);

  // --- useEffect Hook'ları ---
  useEffect(() => {
    // Kullanıcı objesi yüklendiğinde veya aktif platform değiştiğinde çalışır
    if (user) {
      loadConversations(activePlatform); // Aktif platforma göre konuşmaları yükle
      loadAllConversationCounts(); // Konuşma sayılarını yükle
      loadAIStatus(); // AI ajan durumlarını yükle
    }
  }, [user, activePlatform, loadConversations, loadAllConversationCounts, loadAIStatus]);

  useEffect(() => {
    // Aktif konuşma veya aktif platform değiştiğinde mesajları yükle
    console.log('[DashboardLayout] activeConversation or activePlatform changed. Recalculating loadMessages call.');
    if (activeConversation && activePlatform) {
      loadMessages(activeConversation, activePlatform); // İki parametreyi de gönderiyoruz
    } else {
      setMessages([]); // Hiçbiri seçili değilse mesajları sıfırla
    }
  }, [activeConversation, activePlatform, loadMessages]);

  // --- Mesaj Gönderme Fonksiyonu ---
  const handleSendMessage = async (content: string) => {
    if (!activeConversation || !user || !currentConversation) return;

    try {
      const sentMessage = await sendMessage(
        activeConversation,
        content,
        true, // isOutbound: true (giden mesaj)
        user.email, // Gönderen adı (kullanıcının email'i)
        activePlatform, // Mesajın gönderildiği platform
        'text' // Mesaj tipi (şimdilik sadece text)
      );

      // Gönderilen mesajı doğrudan messages state'ine ekleyelim
      setMessages(prevMessages => [...prevMessages, {
        id: sentMessage.id,
        conversation_id: sentMessage.conversation_id,
        sender_name: sentMessage.sender_name,
        content: sentMessage.content,
        message_type: sentMessage.type,
        platform: sentMessage.platform,
        timestamp: sentMessage.timestamp,
        is_outbound: sentMessage.is_outbound,
        // message_text, image_url, audio_url varsayılan değerlerle eklendi
        message_text: sentMessage.content,
        image_url: sentMessage.image_url ?? '',
        audio_url: sentMessage.audio_url ?? '',
      }]);
      
      // Mesaj gönderildikten sonra konuşma listesini ve sayılarını güncelle
      await loadConversations(activePlatform);
      await loadAllConversationCounts();

      // Sohbet ekranını aşağı kaydır
      setTimeout(() => {
        const chatThreadElement = document.querySelector('.flex-1.overflow-y-auto');
        if (chatThreadElement) {
          chatThreadElement.scrollTop = chatThreadElement.scrollHeight;
        }
      }, 100);

    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      alert('Mesaj gönderilirken bir hata oluştu.');
    }
  };

  // --- AI Ajan Durumu Değişikliği Fonksiyonu ---
  const handleAIStatusChange = useCallback((platform: Platform, status: boolean) => {
    setAiStatus(prev => ({ ...prev, [platform]: status }));
  }, []);

  // --- Konuşma Seçimi Fonksiyonu ---
  const handleConversationSelect = (conversationId: string) => {
    setActiveConversation(conversationId);
    // Seçilen konuşmanın platformunu bulup aktif platformu da güncelle
    const selectedConv = conversations.find(c => c.id === conversationId);
    if (selectedConv) {
      setActivePlatform(selectedConv.platform);
    }
  };

  // Aktif konuşma objesini bul
  const currentConversation = conversations.find(conv => conv.id === activeConversation);

  // --- Eğer kullanıcı yüklenmediyse yükleniyor göster ---
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="ml-3 text-gray-700">Kullanıcı verileri yükleniyor...</p>
      </div>
    );
  }

  // --- Ana Render Kısmı ---
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 lg:px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              className="hidden lg:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Mesajlaşma Paneli</h1>
                <p className="text-sm text-gray-600">Çok platformlu müşteri iletişimi</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="hidden sm:flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </header>

      {/* Platform Tabs */}
      <div className="px-4 py-3 bg-white border-b">
        <PlatformTabs
          activePlatform={activePlatform}
          onPlatformChange={platform => {
            setActivePlatform(platform);
            setActiveConversation(null); // Platform değişince aktif konuşmayı sıfırla
          }}
          conversationCounts={conversationCounts}
        />
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarCollapsed ? 'w-0' : 'w-80'} hidden lg:block bg-white border-r transition-all duration-300 overflow-hidden`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <AIToggle
                platform={activePlatform}
                onStatusChange={handleAIStatusChange}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-3" />
                  <p>Konuşmalar yükleniyor...</p>
                </div>
              ) : (
                <ChatList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onConversationSelect={handleConversationSelect} // Buraya handleConversationSelect bağladık
                  platform={activePlatform}
                />
              )}
            </div>
          </div>
        </div>

        {/* Chat Alanı */}
        <div className="flex-1 flex flex-col">
          <AIStatusBanner isAIEnabled={aiStatus[activePlatform]} platform={activePlatform} />
          {activeConversation && currentConversation ? (
            <>
              <div className="flex-1 overflow-y-auto">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mb-3" />
                    <p>Mesajlar yükleniyor...</p>
                  </div>
                ) : (
                  <ChatThread
                    messages={messages}
                    contactName={currentConversation.contact_name}
                  />
                )}
              </div>
              <ChatInputBox onSendMessage={handleSendMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Bir konuşma seçin</h3>
                <p className="text-gray-600">
                  Mesajları görüntülemek için sol panelden bir konuşma seçin veya {activePlatform} sekmesinden yeni bir konuşma başlatın.
                </p>
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Konuşmaları Görüntüle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobil Menü */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activePlatform={activePlatform}
        onPlatformChange={platform => {
          setActivePlatform(platform);
          setActiveConversation(null);
        }}
        conversationCounts={conversationCounts}
        userEmail={user?.email || ''}
        onLogout={logout}
      />
    </div>
  );
};

export default DashboardLayout;