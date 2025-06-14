import React from 'react';
import { Instagram, MessageCircle, Send } from 'lucide-react';
import { Platform } from '../types';

interface PlatformTabsProps {
  activePlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  conversationCounts: Record<Platform, number>;
}

const PlatformTabs: React.FC<PlatformTabsProps> = ({
  activePlatform,
  onPlatformChange,
  conversationCounts
}) => {
  const platforms = [
    {
      id: 'instagram' as Platform,
      name: 'Instagram',
      icon: Instagram,
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-gradient-to-r from-pink-500 to-purple-600',
      textColor: 'text-pink-600',
      activeColor: 'bg-pink-50 border-pink-200'
    },
    {
      id: 'whatsapp' as Platform,
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      activeColor: 'bg-green-50 border-green-200'
    },
    {
      id: 'messenger' as Platform,
      name: 'Messenger',
      icon: Send,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      activeColor: 'bg-blue-50 border-blue-200'
    }
  ];

  return (
    <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
      {platforms.map((platform) => {
        const isActive = activePlatform === platform.id;
        const count = conversationCounts[platform.id];
        
        return (
          <button
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            className={`
              flex items-center space-x-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200 flex-1 justify-center relative
              ${isActive 
                ? `bg-white shadow-sm border ${platform.activeColor}` 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }
            `}
          >
            <platform.icon className={`w-4 h-4 ${isActive ? platform.textColor : ''}`} />
            <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>
              {platform.name}
            </span>
            {count > 0 && (
              <span className={`
                absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center
                ${platform.bgColor}
              `}>
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PlatformTabs;