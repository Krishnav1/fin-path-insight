import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useFinGenie } from '../contexts/FinGenieContext';

const FinGenieOracle = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Import API configuration
      const API = await import("../config/api").then(module => module.default);
      
      // Call the Deno Deploy API
      const response = await fetch(API.endpoints.finGenieOracle, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Set the response data
      setResponse(data);
    } catch (err) {
      console.error('Error fetching response:', err);
      setError(err.message || 'Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Fin Genie Oracle</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ask any financial question - from stock analysis to market trends, definitions, and more.
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10">AI Powered</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          {error && (
            <div className="p-3 my-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              <p>Error: {error}</p>
            </div>
          )}
          
          {response && !loading && (
            <div className="p-4 my-3 bg-card rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Fin Genie's Analysis</h3>
              <div className="border-t pt-2 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{response.answer}</ReactMarkdown>
              </div>
              
              {response.dataFetched && (
                <p className="text-xs text-muted-foreground mt-3">
                  Data sources: yfinance and/or EODHD API
                </p>
              )}
              
              {response.dataErrors && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Some data could not be retrieved. Fin Genie has provided the best analysis with available information.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Ask about P/E ratios, stock analysis, market trends, or financial definitions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default FinGenieOracle;
