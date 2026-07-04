/**
 * Socket.io Client Configuration
 *
 * This module provides a centralized Socket.io client configuration
 * that can connect to either:
 * 1. Same server (development with server.js)
 * 2. Separate Socket.io server (production on Vercel)
 */

import { io, Socket } from 'socket.io-client';

type EventHandler = (payload?: unknown) => void;

class VercelWebSocketClientShim {
  public id?: string;
  public connected = false;
  private ws: WebSocket;
  private handlers = new Map<string, Set<EventHandler>>();
  private hasEmittedDisconnect = false;

  constructor(url: string) {
    this.ws = new WebSocket(url);

    this.ws.addEventListener("open", () => {
      this.connected = true;
      this.emitLocal("connect");
    });

    this.ws.addEventListener("message", (event) => {
      let parsed: { event?: string; payload?: unknown };
      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (!parsed.event) return;

      if (parsed.event === "__connected" && parsed.payload && typeof parsed.payload === "object") {
        const payload = parsed.payload as { id?: string };
        if (payload.id) this.id = payload.id;
        return;
      }

      this.emitLocal(parsed.event, parsed.payload);
    });

    this.ws.addEventListener("error", () => {
      this.emitLocal("connect_error", new Error("WebSocket connection error"));
    });

    this.ws.addEventListener("close", () => {
      this.connected = false;
      if (!this.hasEmittedDisconnect) {
        this.hasEmittedDisconnect = true;
        this.emitLocal("disconnect", "closed");
      }
    });
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)?.add(handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, payload?: unknown) {
    if (this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ event, payload }));
  }

  disconnect() {
    if (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) return;
    this.hasEmittedDisconnect = true;
    this.ws.close();
    this.connected = false;
    this.emitLocal("disconnect", "client disconnect");
  }

  private emitLocal(event: string, payload?: unknown) {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;
    eventHandlers.forEach((handler) => handler(payload));
  }
}

/**
 * Get Socket.io server URL
 * - In development: connects to same server (/api/socket path)
 * - In production: connects to separate Socket.io server (if NEXT_PUBLIC_SOCKET_URL is set)
 */
export function getSocketConfig() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const useVercelWebSockets = process.env.NEXT_PUBLIC_USE_VERCEL_WEBSOCKETS === "true";

  if (useVercelWebSockets) {
    return {
      provider: "vercel-websockets" as const,
      url: undefined,
      options: undefined,
    };
  }

  if (socketUrl) {
    // Production: Connect to separate Socket.io server
    return {
      provider: "socket-io" as const,
      url: socketUrl,
      options: {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
    };
  } else {
    // Development: Connect to same server
    return {
      provider: "socket-io" as const,
      url: undefined, // Same origin
      options: {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
    };
  }
}

/**
 * Create a Socket.io client instance
 */
export function createSocketClient(): Socket {
  const config = getSocketConfig();

  if (config.provider === "vercel-websockets") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    console.log('[Socket] Connecting via Vercel WebSockets beta:', wsUrl);
    return new VercelWebSocketClientShim(wsUrl) as unknown as Socket;
  }

  if (config.url) {
    console.log('[Socket] Connecting to external server:', config.url);
    return io(config.url, config.options);
  } else {
    console.log('[Socket] Connecting to same-origin server');
    return io(config.options);
  }
}
