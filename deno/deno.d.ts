// Type definitions for Deno global namespace
// We're only declaring the types we need, not redefining the entire Deno namespace
// to avoid conflicts with built-in Deno types

// The Deno namespace is already defined in the runtime, so we don't need to redeclare it

// Type declarations for Deno standard library modules
declare module "https://deno.land/std@0.221.0/http/server.ts" {
  export interface ServeInit {
    port?: number;
    hostname?: string;
    handler?: (request: Request) => Response | Promise<Response>;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
    signal?: AbortSignal;
  }

  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: ServeInit
  ): void;
}

declare module "https://deno.land/std@0.220.1/http/server.ts" {
  export interface ServeInit {
    port?: number;
    hostname?: string;
    handler?: (request: Request) => Response | Promise<Response>;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
    signal?: AbortSignal;
  }

  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: ServeInit
  ): void;
}
