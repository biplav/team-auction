const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
// Use Railway's environment variables, fallback to localhost for development
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Track active users per auction
  const activeUsers = new Map();

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("join-auction", (auctionId) => {
      socket.join(`auction:${auctionId}`);
      console.log(`✅ Client ${socket.id} joined auction ${auctionId}`);

      // Track active users
      if (!activeUsers.has(auctionId)) {
        activeUsers.set(auctionId, new Set());
      }
      activeUsers.get(auctionId).add(socket.id);

      // Broadcast updated count
      io.to(`auction:${auctionId}`).emit("active-users", {
        count: activeUsers.get(auctionId).size
      });

      io.to(`auction:${auctionId}`).emit("user-joined", {
        userId: socket.id,
        timestamp: new Date(),
      });
    });

    socket.on("leave-auction", (auctionId) => {
      socket.leave(`auction:${auctionId}`);
      console.log(`Client ${socket.id} left auction ${auctionId}`);

      // Remove from active users
      if (activeUsers.has(auctionId)) {
        activeUsers.get(auctionId).delete(socket.id);

        // Broadcast updated count
        io.to(`auction:${auctionId}`).emit("active-users", {
          count: activeUsers.get(auctionId).size
        });
      }
    });

    socket.on("place-bid", async (data) => {
      console.log("💰 Bid placed:", data);
      io.to(`auction:${data.auctionId}`).emit("bid-placed", {
        ...data,
        timestamp: new Date(),
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

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);

      // Clean up user from all auctions
      activeUsers.forEach((users, auctionId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          io.to(`auction:${auctionId}`).emit("active-users", {
            count: users.size
          });
        }
      });
    });
  });

  // Listen on all network interfaces (0.0.0.0) for Railway/Docker
  const listenHost = process.env.NODE_ENV === 'production' ? '0.0.0.0' : hostname;

  httpServer.listen(port, listenHost, (err) => {
    if (err) throw err;
    console.log(`🚀 Next.js ready on http://${listenHost}:${port}`);
    console.log(`🔌 Socket.IO server ready on path /api/socket`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
