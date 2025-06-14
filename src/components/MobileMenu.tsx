import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { Platform } from '../types';
import PlatformTabs from './PlatformTabs';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activePlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  conversationCounts: Record<Platform, number>;
  userEmail: string;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  activePlatform,
  onPlatformChange,
  conversationCounts,
  userEmail,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg w-8 h-8 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Mesajlaşma Paneli</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Aktif Kullanıcı</p>
            <p className="font-medium text-gray-900">{userEmail}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Platform Seçin</p>
            <PlatformTabs
              activePlatform={activePlatform}
              onPlatformChange={(platform) => {
                onPlatformChange(platform);
                onClose();
              }}
              conversationCounts={conversationCounts}
            />
          </div>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;