import React from 'react';
import { Conversation, Platform } from '../types';

interface ChatListProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
  platform: Platform;
}

const ChatList: React.FC<ChatListProps> = ({
  conversations,
  activeConversation,
  onConversationSelect,
  platform
}) => {
  const platformColors = {
    instagram: 'bg-pink-500',
    whatsapp: 'bg-green-500',
    messenger: 'bg-blue-500'
  };

  const platformNames = {
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
    messenger: 'Messenger'
  };

  // Zaman damgasını kısa formata çeviren yardımcı fonksiyon
  const formatLastMessageTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Geçersiz Tarih"; // Hatalı tarih için dönüş
      }
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString('tr-TR', { hour: 'numeric', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Dün';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('tr-TR', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' });
      }
    } catch (e) {
      console.error("Tarih formatlama hatası:", e);
      return "Hata";
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Henüz konuşma yok</p>
          <p className="text-sm">{platformNames[platform]} konuşmalarınız burada görünecek</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {platformNames[platform]} Mesajları
        </h2>
      </div>
      
      <div className="space-y-1 px-2 pb-4">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onConversationSelect(conversation.id)}
            className={`
              w-full p-3 rounded-xl text-left transition-all duration-200 hover:bg-gray-50 group
              ${activeConversation === conversation.id ? 'bg-blue-50 border border-blue-200' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar kaldırıldı, yerine sadece renkli nokta kalabilir veya bu div de kaldırılabilir */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${platformColors[conversation.platform]}`}>
                  {conversation.contact_name ? conversation.contact_name.charAt(0).toUpperCase() : 'U'}
                </div>
                {/* Durum noktası veya platform ikonu istenirse burada kalabilir */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${platformColors[conversation.platform]} border-2 border-white`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.contact_name}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatLastMessageTimestamp(conversation.last_message_time)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.last_message_time}
                  </p>
                  {conversation.unread_count > 0 && (
                    <span className={`
                      ml-2 px-2 py-1 rounded-full text-xs font-medium text-white flex-shrink-0
                      ${platformColors[conversation.platform]}
                    `}>
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatList;