import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface ChatInputBoxProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInputBox: React.FC<ChatInputBoxProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              disabled={disabled}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed pr-20"
              rows={1}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <button
                type="button"
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                onClick={() => {}}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                onClick={() => {}}
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInputBox;