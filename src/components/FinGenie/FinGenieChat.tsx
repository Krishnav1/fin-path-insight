import { useState, useRef, useEffect } from "react";
import { Send, Loader2, RefreshCw, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function FinGenieChat() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm FinGenie, your personal finance assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Import API configuration
      const API = await import("@/config/api").then(module => module.default);
      
      // Determine if this is an Oracle-style query (financial analysis, stock info, etc.)
      const isOracleQuery = /stock|market|p\/e ratio|dividend|invest|finance|economy|etf|fund|crypto|bitcoin|portfolio|nasdaq|dow|s&p|price|trend/i.test(input);
      
      // Choose the appropriate endpoint based on query type
      const endpoint = isOracleQuery ? API.endpoints.finGenieOracle : API.endpoints.fingenieChat;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          query: input, // For Oracle compatibility
          userId: user?.id || "anonymous",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Error with chat API:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to communicate with FinGenie. Please try again later."
      );
      toast.error("Failed to get response from FinGenie", {
        description: "Our AI assistant is currently unavailable. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
    }
  };

  const exportChat = () => {
    const chatContent = messages
      .map((msg) => `${msg.role === "user" ? "You" : "FinGenie"}: ${msg.content}`)
      .join("\n\n");
    
    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fingenie-chat-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Chat exported successfully");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarImage src="/assets/fingenie-avatar.png" alt="FinGenie" />
              <AvatarFallback className="bg-primary text-primary-foreground">FG</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">FinGenie Assistant</CardTitle>
              <p className="text-sm text-muted-foreground">Your personal finance advisor</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10">AI Powered</Badge>
        </div>
      </CardHeader>
      
      {/* Updated layout: Input at top, messages below */}
      <CardContent className="p-4 pt-6 pb-0">
        {error && (
          <div className="w-full mb-4 p-2 text-sm bg-destructive/10 text-destructive rounded border border-destructive/20">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2 h-7" 
              onClick={handleRetry}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex w-full gap-2 mb-6">
          <Input
            placeholder="Ask FinGenie about investments, financial planning, or market trends..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" onClick={exportChat} title="Export chat">
            <Download className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      
      {/* Messages appear below the input */}
      <ScrollArea className="h-[450px] md:h-[500px] px-4 pb-4">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className="w-full animate-fadeIn"
            >
              <div className="flex items-start gap-3">
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mt-1 bg-primary">
                    <AvatarFallback>FG</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`flex-1 rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary/10 ml-12 border border-primary/20"
                      : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 text-muted-foreground flex justify-end`}>
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </div>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 mt-1 bg-secondary">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="w-full">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-1 bg-primary">
                  <AvatarFallback>FG</AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-lg p-4 bg-muted">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                    <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                    <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>
      
      <CardFooter className="border-t p-3 flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => setMessages([{
          role: "assistant",
          content: "Hello! I'm FinGenie, your personal finance assistant. How can I help you today?",
          timestamp: new Date(),
        }])}>
          Clear Chat
        </Button>
        <span className="text-xs text-muted-foreground">Powered by AI</span>
      </CardFooter>
    </Card>
  );
}
