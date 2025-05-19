// Type declarations for external modules
declare module 'https://esm.sh/@supabase/supabase-js@2.38.4' {
  export * from '@supabase/supabase-js';
}

declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  /**
   * Serves HTTP requests with the given handler.
   * 
   * @param handler The handler to use for each request.
   */
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: {
      port?: number;
      hostname?: string;
      signal?: AbortSignal;
      onListen?: (params: { hostname: string; port: number }) => void;
    },
  ): void;
}
