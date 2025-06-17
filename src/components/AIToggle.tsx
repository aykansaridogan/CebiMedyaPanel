// src/components/AIToggle.tsx (Güncellenmiş hali - Global Kontrole Uyumlu)
import React, { useState, useEffect } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { Platform } from '../types';
// getAgentStatus ve updateAgentStatus'u api servisinden import et
import { getAgentStatus, updateAgentStatus } from '../services/api'; // <<< updateAgentStatus eklendi

interface AIToggleProps {
  platform: Platform; // Bu prop hala var, API çağrısına platformu gönderecek
  onStatusChange?: (platform: Platform, status: boolean) => void;
  isSidebarCollapsed?: boolean;
}

const AIToggle: React.FC<AIToggleProps> = ({ platform, onStatusChange, isSidebarCollapsed = false }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // İlk durumu yükle
  useEffect(() => {
    const loadStatus = async () => {
      setIsLoading(true);
      try {
        // API çağrısı: Backend tarafında user_id=1 ve platform='whatsapp' sabitine bakılacak.
        // Bu nedenle AIToggle'a verilen 'platform' prop'u ne olursa olsun,
        // arka planda hep aynı global durum okunur.
        const { status } = await getAgentStatus(platform); 
        setIsEnabled(status);
      } catch (error) {
        console.error('AI durumu yüklenirken hata:', error);
        // Hata durumunda kullanıcıyı bilgilendir
        alert('AI durumu yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [platform]); // 'platform' değiştiğinde tekrar yükle (UI'da tek AIToggle kullanılacaksa genelde değişmez)

  const handleToggle = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const newStatus = !isEnabled;
      // API çağrısı: Backend tarafında user_id=1 ve platform='whatsapp' sabitine güncellenecek.
      const success = await updateAgentStatus(platform, newStatus); 

      if (success) {
        setIsEnabled(newStatus);
        onStatusChange?.(platform, newStatus);
      } else {
        // API'den success: false dönerse
        alert('AI durumu güncellenemedi.');
      }
    } catch (error) {
      console.error('AI durumu güncellenirken hata:', error);
      alert('AI durumu güncellenirken bir hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
        <Loader2 className={`w-5 h-5 animate-spin ${isSidebarCollapsed ? 'mx-auto' : ''}`} />
        {!isSidebarCollapsed && <p className="text-gray-600">Yükleniyor...</p>}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col text-center' : 'space-x-3 justify-between'}`}>
      <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col' : 'space-x-3'}`}>
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isEnabled ? 'bg-green-100' : 'bg-gray-100'}
        `}>
          {isEnabled ? (
            <Bot className={`w-5 h-5 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {!isSidebarCollapsed && (
          <div>
            <h3 className="font-medium text-gray-900">AI Yanıt Sistemi</h3>
            <p className="text-sm text-gray-600">
              {isEnabled ? 'Otomatik yanıtlar aktif' : 'Manuel yanıt modu'}
            </p>
          </div>
        )}
      </div>

      <div className={`flex items-center ${isSidebarCollapsed ? 'mt-3' : 'space-x-3'}`}>
        {!isSidebarCollapsed && (
          <span className={`text-sm font-medium ${isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
            {isEnabled ? 'Açık' : 'Kapalı'}
          </span>
        )}

        <button
          onClick={handleToggle}
          disabled={isUpdating}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
            ${isEnabled ? 'bg-green-600' : 'bg-gray-200'}
          `}
          title={isEnabled ? 'AI sistemini kapat' : 'AI sistemini aç'}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
          {isUpdating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIToggle;