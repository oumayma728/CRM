export interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name: string;
  content: string;
  is_read: boolean;
  is_urgent: boolean;
  is_broadcast?: boolean;
  created_at: string;
  read_at?: string;
}

export interface Conversation {
  user_id: number;
  user_name: string;
  user_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online?: boolean;
  avatar_url?: string;
}

export interface TypingIndicator {
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface WsMessage {
  type: 'new_message' | 'typing' | 'user_online' | 'user_offline' | 'message_read' | 'broadcast';
  data: any;
}