import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export function initializeSocket(res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");

    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
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
      });

      socket.on("leave-auction", (auctionId: string) => {
        socket.leave(`auction:${auctionId}`);
        console.log(`Client ${socket.id} left auction ${auctionId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  return res.socket.server.io;
}
