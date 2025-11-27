import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-auction", (auctionId: string) => {
    socket.join(`auction:${auctionId}`);
    console.log(`Client ${socket.id} joined auction ${auctionId}`);
    io.to(`auction:${auctionId}`).emit("user-joined", {
      userId: socket.id,
      timestamp: new Date(),
    });
  });

  socket.on("leave-auction", (auctionId: string) => {
    socket.leave(`auction:${auctionId}`);
    console.log(`Client ${socket.id} left auction ${auctionId}`);
  });

  socket.on("place-bid", async (data: {
    auctionId: string;
    playerId: string;
    teamId: string;
    amount: number;
  }) => {
    console.log("Bid placed:", data);
    io.to(`auction:${data.auctionId}`).emit("bid-placed", {
      ...data,
      timestamp: new Date(),
    });
  });

  socket.on("next-player", (data: { auctionId: string; playerId: string }) => {
    console.log("Moving to next player:", data);
    io.to(`auction:${data.auctionId}`).emit("current-player-changed", data);
  });

  socket.on("pause-auction", (data: { auctionId: string }) => {
    console.log("Auction paused:", data);
    io.to(`auction:${data.auctionId}`).emit("auction-paused", data);
  });

  socket.on("resume-auction", (data: { auctionId: string }) => {
    console.log("Auction resumed:", data);
    io.to(`auction:${data.auctionId}`).emit("auction-resumed", data);
  });

  socket.on("player-sold", (data: {
    auctionId: string;
    player: {
      id: string;
      name: string;
      role: string;
    };
    team: {
      id: string;
      name: string;
      color: string | null;
    };
    soldPrice: number;
  }) => {
    console.log("Player sold:", data);
    io.to(`auction:${data.auctionId}`).emit("player-sold", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

export async function GET() {
  return new Response("Socket.IO server is running", { status: 200 });
}
