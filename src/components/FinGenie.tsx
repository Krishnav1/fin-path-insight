import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Bot, X, Send, Minimize2, ExternalLink } from "lucide-react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

// Define the message type
type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

// Fallback response for when the AI doesn't understand
const FALLBACK_RESPONSE = "I'm not sure how to answer that. Could you try asking something about finance or investing?";

// Sample suggested questions
const SUGGESTED_QUESTIONS = [
  "What is a P/E ratio?",
  "How do I start investing?",
  "What is dollar cost averaging?",
  "What is a bull market?",
  "How do dividends work?"
];

export default function FinGenie() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "👋 Hi! I'm FinGenie, your financial assistant. Ask me anything about finance, investing, or this website!",
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(() => `user-${Math.random().toString(36).substring(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    // Create a new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date()
    };
    
    // Add the user message to the chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    
    try {
      // Send the message to our Netlify function
      const response = await fetch('https://ydakwyplcqoshxcdllah.supabase.co/functions/v1/fingenie-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          message: userMessage.content
        })
      });
      
      let responseContent = FALLBACK_RESPONSE;
      
      // Check if we have a valid response
      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          responseContent = data.reply;
        }
      } else {
        console.error('Error communicating with FinGenie API:', await response.text());
      }
      
      // Create the AI response message
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: responseContent,
        role: "assistant",
        timestamp: new Date()
      };
      
      // Add the AI response to the chat
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error communicating with FinGenie API:', error);
      
      // Create an error message with the fallback response
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: FALLBACK_RESPONSE,
        role: "assistant",
        timestamp: new Date()
      };
      
      // Add the error message to the chat
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      
      // Scroll to bottom again
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const expandChat = () => {
    setIsMinimized(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        content: "👋 Hi! I'm FinGenie, your financial assistant. Ask me anything about finance, investing, or this website!",
        role: "assistant",
        timestamp: new Date()
      }
    ]);
  };

  // Use the suggested questions defined at the top of the file
  const suggestedQuestions = SUGGESTED_QUESTIONS;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full shadow-lg bg-fin-primary hover:bg-fin-secondary"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <Card className={`w-[350px] shadow-xl transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-[500px]'
        }`}>
          <CardHeader className="p-3 flex flex-row items-center justify-between bg-fin-primary text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span>FinGenie</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              {isMinimized ? (
                <Button variant="ghost" size="icon" onClick={expandChat} className="h-8 w-8 hover:bg-fin-secondary/20">
                  <Minimize2 className="h-4 w-4 text-white" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={minimizeChat} className="h-8 w-8 hover:bg-fin-secondary/20">
                  <Minimize2 className="h-4 w-4 text-white" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={toggleChat} className="h-8 w-8 hover:bg-fin-secondary/20">
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <>
              <ScrollArea className="h-[380px] p-4">
                <div className="flex flex-col gap-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-fin-primary text-white"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-slate-100 dark:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <p className="text-sm">Thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Suggested questions (show only if there are few messages) */}
                  {messages.length < 3 && !isLoading && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Try asking:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((question, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => {
                              setInputValue(question);
                              if (inputRef.current) {
                                inputRef.current.focus();
                              }
                            }}
                          >
                            {question}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <CardFooter className="p-3 pt-0">
                <form onSubmit={handleSubmit} className="flex w-full gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    ref={inputRef}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !inputValue.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
              
              <div className="px-3 pb-3 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearChat}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Clear chat
                </Button>
                <a 
                  href="https://www.investopedia.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-fin-teal hover:underline"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
} 