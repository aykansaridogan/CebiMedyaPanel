export interface User {
  id: string;
  email: string;
  password: string;
  database_name: string;
}

export interface Message {
  message_type: string;
  message_text: string;
  image_url: string;
  audio_url: string;
  id: string;
  sender_name: string;
  
  content: string;
  timestamp: string;
  is_outbound: boolean;
  platform: 'instagram' | 'whatsapp' | 'messenger';
}

export interface Conversation {
  id: string;
  contact_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  platform: 'instagram' | 'whatsapp' | 'messenger';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface AgentStatus {
  user_id: string;
  platform: Platform;
  status: boolean;
}

export type Platform = 'instagram' | 'whatsapp' | 'messenger';