import React from 'react';
import { AlertCircle, Bot } from 'lucide-react';

interface AIStatusBannerProps {
  isAIEnabled: boolean;
  platform: string;
}

const AIStatusBanner: React.FC<AIStatusBannerProps> = ({ isAIEnabled }) => {
  if (isAIEnabled) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
        <Bot className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">
            AI Yanıt Sistemi Aktif
          </p>
          <p className="text-xs text-green-600">
            Gelen mesajlar otomatik olarak yanıtlanacak
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">
          Manuel Yanıt Modu
        </p>
        <p className="text-xs text-amber-600">
          Otomatik yanıt sistemi devre dışı. Mesajları manuel olarak yanıtlayabilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default AIStatusBanner;