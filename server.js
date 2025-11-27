const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

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

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("join-auction", (auctionId) => {
      socket.join(`auction:${auctionId}`);
      console.log(`✅ Client ${socket.id} joined auction ${auctionId}`);
      io.to(`auction:${auctionId}`).emit("user-joined", {
        userId: socket.id,
        timestamp: new Date(),
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
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Next.js ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.IO server ready on path /api/socket`);
  });
});
