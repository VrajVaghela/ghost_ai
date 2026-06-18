import { LiveList, LiveObject, LiveMap } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
      status?: string;
    };

    Storage: {
      flow?: LiveObject<{
        nodes: LiveMap<string, LiveObject<any>>;
        edges: LiveMap<string, LiveObject<any>>;
      }>;
      "ai-status-feed"?: LiveList<
        LiveObject<{
          id: string;
          message: string;
          timestamp: number;
          type: "info" | "success" | "error";
          text?: string;
        }>
      >;
      "ai-chat"?: LiveList<
        LiveObject<{
          id: string;
          sender: string;
          role: "user" | "assistant";
          content: string;
          timestamp: number;
        }>
      >;
      statusFeed?: LiveList<
        LiveObject<{
          id: string;
          message: string;
          timestamp: number;
          type: "info" | "success" | "error";
        }>
      >;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: {};

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};
