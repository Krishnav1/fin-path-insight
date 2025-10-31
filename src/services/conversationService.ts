/**
 * Conversation Persistence Service
 * Manages FinGenie conversation history in Supabase
 */

import { supabase } from '@/lib/supabase';

export interface Conversation {
  id: string;
  user_id: string;
  session_id: string;
  user_message: string;
  bot_response: string;
  context_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationInput {
  session_id: string;
  user_message: string;
  bot_response: string;
  context_data?: Record<string, any>;
}

class ConversationService {
  /**
   * Save a conversation to Supabase
   */
  async saveConversation(input: ConversationInput): Promise<Conversation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('fingenie_conversations')
        .insert({
          user_id: user.id,
          session_id: input.session_id,
          user_message: input.user_message,
          bot_response: input.bot_response,
          context_data: input.context_data || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in saveConversation:', error);
      return null;
    }
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(limit: number = 50): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('fingenie_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  }

  /**
   * Get conversations by session ID
   */
  async getConversationsBySession(sessionId: string): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('fingenie_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversationsBySession:', error);
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fingenie_conversations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return false;
    }
  }

  /**
   * Delete all conversations for current user
   */
  async deleteAllConversations(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('fingenie_conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting all conversations:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAllConversations:', error);
      return false;
    }
  }

  /**
   * Search conversations by keyword
   */
  async searchConversations(keyword: string): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('fingenie_conversations')
        .select('*')
        .eq('user_id', user.id)
        .or(`user_message.ilike.%${keyword}%,bot_response.ilike.%${keyword}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchConversations:', error);
      return [];
    }
  }

  /**
   * Get conversation context (last N messages for context-aware responses)
   */
  async getConversationContext(sessionId: string, limit: number = 5): Promise<string> {
    try {
      const conversations = await this.getConversationsBySession(sessionId);
      const recentConversations = conversations.slice(-limit);

      return recentConversations
        .map(conv => `User: ${conv.user_message}\nAssistant: ${conv.bot_response}`)
        .join('\n\n');
    } catch (error) {
      console.error('Error in getConversationContext:', error);
      return '';
    }
  }
}

export const conversationService = new ConversationService();
