/**
 * Standalone Socket.io Server
 *
 * This server can be deployed separately from the Next.js application
 * to platforms like Railway, Render, or any Node.js hosting.
 *
 * Required for Vercel deployments since Vercel doesn't support WebSockets.
 */

const { createServer } = require('http');
const { Server } = require('socket.io');

const port = process.env.PORT || 3001;

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'cricket-auction-socket-server',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Initialize Socket.io server
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Connection settings
  pingTimeout: 60000,
  pingInterval: 25000,
  // Transports
  transports: ['websocket', 'polling'],
});

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id, {
    timestamp: new Date().toISOString()
  });

  socket.on("join-auction", (auctionId) => {
    socket.join(`auction:${auctionId}`);
    console.log(`✅ Client ${socket.id} joined auction ${auctionId}`);
    io.to(`auction:${auctionId}`).emit("user-joined", {
      userId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("leave-auction", (auctionId) => {
    socket.leave(`auction:${auctionId}`);
    console.log(`Client ${socket.id} left auction ${auctionId}`);
  });

  socket.on("place-bid", async (data) => {
    console.log("💰 Bid placed:", data);
    io.to(`auction:${data.auctionId}`).emit("bid-placed", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("next-player", (data) => {
    console.log("⏭️  Moving to next player:", data);
    io.to(`auction:${data.auctionId}`).emit("current-player-changed", data);
  });

  socket.on("pause-auction", (data) => {
    console.log("⏸️  Auction paused:", data);
    io.to(`auction:${data.auctionId}`).emit("auction-paused", data);
  });

  socket.on("resume-auction", (data) => {
    console.log("▶️  Auction resumed:", data);
    io.to(`auction:${data.auctionId}`).emit("auction-resumed", data);
  });

  socket.on("player-sold", (data) => {
    console.log("🎉 Player sold:", data);
    io.to(`auction:${data.auctionId}`).emit("player-sold", data);
  });

  socket.on("bids-discarded", (data) => {
    console.log("🗑️  Bids discarded:", data);
    io.to(`auction:${data.auctionId}`).emit("bids-discarded", data);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Client disconnected:", socket.id, {
      reason,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("error", (error) => {
    console.error("❌ Socket error:", socket.id, error);
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`🚀 Socket.IO server running on port ${port}`);
  console.log(`🔌 Path: /socket.io`);
  console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN || "*"}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});
