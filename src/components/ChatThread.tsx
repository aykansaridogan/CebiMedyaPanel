import React from 'react';
import { Message } from '../types';

interface ChatThreadProps {
  messages: Message[];
  contactName: string;
  // contactAvatar: string; // KALDIRILDI
}

const ChatThread: React.FC<ChatThreadProps> = ({ messages, contactName }) => { // contactAvatar prop'tan kaldırıldı
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Geçersiz Zaman"; // Hatalı tarih için dönüş
      }
      return date.toLocaleTimeString('tr-TR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      console.error("Zaman formatlama hatası:", e);
      return "Hata";
    }
  };

  // Mesaj içeriğini tipine göre render eden yardımcı bileşen
  const renderMessageContent = (message: Message) => {
    switch (message.message_type) {
      case 'text':
        return <p className="text-sm leading-relaxed">{message.content}</p>;
      case 'image':
        return (
          <div>
            {message.image_url && (
              <img
                src={message.image_url}
                alt={message.content || "Resim"}
                className="max-w-full h-auto rounded-lg mb-2"
                style={{ maxHeight: '200px' }}
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x150/e0e0e0/505050?text=Resim+Y%C3%BCklenemedi'; }}
              />
            )}
            {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
          </div>
        );
      case 'audio':
        return (
          <div>
            <p className="text-sm leading-relaxed mb-2">{message.content || 'Ses Kaydı'}</p>
            {message.audio_url && (
              <audio controls src={message.audio_url} className="w-full">
                Tarayıcınız ses öğesini desteklemiyor.
              </audio>
            )}
          </div>
        );
      default:
        return <p className="text-sm leading-relaxed">{message.content || `[${message.message_type} Mesajı]`}</p>;
    }
  };


  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Konuşmaya başlayın</p>
          <p className="text-sm">Konuşmayı başlatmak için bir mesaj gönderin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header - Avatar kaldırıldı */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        {/* Avatar img tag'i KALDIRILDI, yerine baş harfi gösteren div konuldu */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold text-lg mr-3">
            {contactName ? contactName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">{contactName}</h2>
          <p className="text-sm text-green-600">Çevrimiçi</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.is_outbound ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md xl:max-w-lg ${message.is_outbound ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Sadece gelen mesajlar için karşı tarafın avatarı kaldırıldı, yerine baş harfi gösteren div konuldu */}
              {!message.is_outbound && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold flex-shrink-0">
                    {contactName ? contactName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              
              <div
                className={`
                  px-4 py-2 rounded-2xl relative group
                  ${message.is_outbound
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }
                `}
              >
                {renderMessageContent(message)} 

                <div className={`
                  text-xs mt-1 opacity-70
                  ${message.is_outbound ? 'text-blue-100' : 'text-gray-500'}
                `}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatThread;