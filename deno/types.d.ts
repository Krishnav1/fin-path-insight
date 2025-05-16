// Type definitions for Google Generative AI
declare module "npm:@google/generative-ai@*" {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: { model: string }): GenerativeModel;
  }

  export interface GenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    candidateCount?: number;
  }

  export interface ChatSession {
    history: Array<{ role: string; parts: Array<{ text: string }> }>;
    sendMessage(message: string): Promise<{ response: { text: () => string } }>;
  }

  export interface GenerativeModel {
    startChat(options: {
      history?: Array<{ role: string; parts: Array<{ text: string }> }>;
      generationConfig?: GenerationConfig;
    }): ChatSession;
    generateContent(prompt: string | Array<{ text: string }>): Promise<{ response: { text: () => string } }>;
  }

  // Deno namespace is already declared in the global scope
}
