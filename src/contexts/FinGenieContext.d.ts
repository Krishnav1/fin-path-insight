import { ReactNode } from 'react';

// Define the conversation interface
interface Conversation {
  id: number;
  userMessage: string;
  botResponse: string;
  timestamp: Date;
}

// Define the context value interface
interface FinGenieContextValue {
  sessionId: string | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<string | null>;
  clearConversations: () => void;
}

// Declare the context
declare const FinGenieContext: React.Context<FinGenieContextValue | undefined>;

// Declare the hook
export function useFinGenie(): FinGenieContextValue;

// Declare the provider
export function FinGenieProvider(props: { children: ReactNode }): JSX.Element;

// Default export
export default FinGenieContext;
