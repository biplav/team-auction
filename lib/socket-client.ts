/**
 * Socket.io Client Configuration
 *
 * This module provides a centralized Socket.io client configuration
 * that can connect to either:
 * 1. Same server (development with server.js)
 * 2. Separate Socket.io server (production on Vercel)
 */

import { io, Socket } from 'socket.io-client';

/**
 * Get Socket.io server URL
 * - In development: connects to same server (/api/socket path)
 * - In production: connects to separate Socket.io server (if NEXT_PUBLIC_SOCKET_URL is set)
 */
export function getSocketConfig() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  if (socketUrl) {
    // Production: Connect to separate Socket.io server
    return {
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

  if (config.url) {
    console.log('[Socket] Connecting to external server:', config.url);
    return io(config.url, config.options);
  } else {
    console.log('[Socket] Connecting to same-origin server');
    return io(config.options);
  }
}
