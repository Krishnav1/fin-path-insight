/**
 * Voice Input Service using Web Speech API
 * Provides voice-to-text functionality for FinGenie
 */

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface VoiceInputConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceInputCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

class VoiceInputService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private callbacks: VoiceInputCallbacks | null = null;

  constructor() {
    // Check for browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
    }
  }

  /**
   * Check if browser supports speech recognition
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Initialize voice recognition with config and callbacks
   */
  initialize(config: VoiceInputConfig, callbacks: VoiceInputCallbacks): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser');
      return;
    }

    this.callbacks = callbacks;

    // Configure recognition
    this.recognition.lang = config.language || 'en-US';
    this.recognition.continuous = config.continuous || false;
    this.recognition.interimResults = config.interimResults || true;
    this.recognition.maxAlternatives = config.maxAlternatives || 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks?.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      this.callbacks?.onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'An error occurred during speech recognition';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please check your microphone settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission was denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      this.callbacks?.onError?.(errorMessage);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks?.onEnd?.();
    };
  }

  /**
   * Start listening for voice input
   */
  start(): void {
    if (!this.recognition) {
      this.callbacks?.onError?.('Speech recognition is not initialized');
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.callbacks?.onError?.('Failed to start speech recognition');
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Abort current recognition
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  /**
   * Get current listening status
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.abort();
    this.callbacks = null;
  }
}

// Export singleton instance
export const voiceInputService = new VoiceInputService();
