import * as vercelFunctions from "@vercel/functions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpgradeSocket = {
  send: (data: string) => void;
  on: (event: "message" | "close" | "error", listener: (data?: unknown) => void) => void;
};

type UpgradeFn = (handler: (ws: UpgradeSocket) => void) => Response;
const experimentalUpgradeWebSocket = (vercelFunctions as unknown as {
  experimental_upgradeWebSocket?: UpgradeFn;
}).experimental_upgradeWebSocket;

type ClientState = {
  id: string;
  auctionId?: string;
};

type IncomingEnvelope = {
  event?: string;
  payload?: unknown;
};

type WsHub = {
  sockets: Map<UpgradeSocket, ClientState>;
  rooms: Map<string, Set<UpgradeSocket>>;
};

const globalWsHub = globalThis as typeof globalThis & {
  __cricAuctionWsHub?: WsHub;
};

function getHub(): WsHub {
  if (!globalWsHub.__cricAuctionWsHub) {
    globalWsHub.__cricAuctionWsHub = {
      sockets: new Map(),
      rooms: new Map(),
    };
  }
  return globalWsHub.__cricAuctionWsHub;
}

function sendEvent(ws: UpgradeSocket, event: string, payload?: unknown) {
  ws.send(JSON.stringify({ event, payload }));
}

function broadcastToAuction(hub: WsHub, auctionId: string, event: string, payload?: unknown) {
  const room = hub.rooms.get(auctionId);
  if (!room) return;
  room.forEach((socket) => {
    sendEvent(socket, event, payload);
  });
}

function broadcastActiveUsers(hub: WsHub, auctionId: string) {
  const count = hub.rooms.get(auctionId)?.size ?? 0;
  broadcastToAuction(hub, auctionId, "active-users", { count });
}

function leaveAuction(hub: WsHub, ws: UpgradeSocket) {
  const state = hub.sockets.get(ws);
  if (!state?.auctionId) return;

  const room = hub.rooms.get(state.auctionId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      hub.rooms.delete(state.auctionId);
    }
  }

  const previousAuctionId = state.auctionId;
  state.auctionId = undefined;
  broadcastActiveUsers(hub, previousAuctionId);
}

function joinAuction(hub: WsHub, ws: UpgradeSocket, auctionId: string) {
  const state = hub.sockets.get(ws);
  if (!state) return;

  leaveAuction(hub, ws);

  if (!hub.rooms.has(auctionId)) {
    hub.rooms.set(auctionId, new Set());
  }
  hub.rooms.get(auctionId)?.add(ws);
  state.auctionId = auctionId;

  broadcastActiveUsers(hub, auctionId);
  broadcastToAuction(hub, auctionId, "user-joined", {
    userId: state.id,
    timestamp: new Date().toISOString(),
  });
}

function handleEvent(hub: WsHub, ws: UpgradeSocket, envelope: IncomingEnvelope) {
  const event = envelope.event;
  const payload = envelope.payload as Record<string, unknown> | undefined;
  if (!event) return;

  switch (event) {
    case "join-auction": {
      const auctionId = String(payload ?? "");
      if (!auctionId) return;
      joinAuction(hub, ws, auctionId);
      return;
    }
    case "leave-auction": {
      leaveAuction(hub, ws);
      return;
    }
    case "place-bid":
    case "next-player":
    case "pause-auction":
    case "resume-auction":
    case "player-sold":
    case "bids-discarded": {
      const auctionId = payload?.auctionId ? String(payload.auctionId) : hub.sockets.get(ws)?.auctionId;
      if (!auctionId) return;
      broadcastToAuction(hub, auctionId, event === "place-bid" ? "bid-placed" : event, {
        ...(payload ?? {}),
        timestamp: new Date().toISOString(),
      });
      return;
    }
    default:
      return;
  }
}

export function GET() {
  if (!experimentalUpgradeWebSocket) {
    return new Response(
      JSON.stringify({
        error: "Vercel WebSocket beta API is not available in this build runtime.",
      }),
      {
        status: 501,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return experimentalUpgradeWebSocket((ws) => {
    const hub = getHub();
    const id = crypto.randomUUID();
    hub.sockets.set(ws as UpgradeSocket, { id });
    sendEvent(ws as UpgradeSocket, "__connected", { id });

    (ws as UpgradeSocket).on("message", (data?: unknown) => {
      if (!data) return;
      let envelope: IncomingEnvelope;
      try {
        envelope = JSON.parse(String(data));
      } catch {
        return;
      }
      handleEvent(hub, ws as UpgradeSocket, envelope);
    });

    const close = () => {
      leaveAuction(hub, ws as UpgradeSocket);
      hub.sockets.delete(ws as UpgradeSocket);
    };

    (ws as UpgradeSocket).on("close", close);
    (ws as UpgradeSocket).on("error", close);
  });
}
