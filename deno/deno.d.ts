// Type definitions for Deno global namespace
// We're only declaring the types we need, not redefining the entire Deno namespace
// to avoid conflicts with built-in Deno types

// Define the Deno namespace for TypeScript type checking
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }

  export const env: Env;
  
  export function exit(code: number): never;
  
  export function readTextFile(path: string): Promise<string>;
  
  export function upgradeWebSocket(request: Request): {
    socket: WebSocket;
    response: Response;
  };
  
  export const args: string[];
  
  export class Command {
    constructor(name: string, options?: {
      args?: string[];
      env?: Record<string, string>;
      cwd?: string;
      stdout?: 'piped' | 'inherit' | 'null';
      stderr?: 'piped' | 'inherit' | 'null';
    });
    option(flag: string, description: string, options?: { default?: any; required?: boolean; }): Command;
    arguments(args: string): Command;
    description(desc: string): Command;
    action(callback: (...args: any[]) => void | Promise<void>): Command;
    parse(args?: string[]): Promise<any>;
    spawn(): {
      status: Promise<{ success: boolean; code: number }>;
      output(): Promise<Uint8Array>;
      stderrOutput(): Promise<Uint8Array>;
    };
  }
}

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
