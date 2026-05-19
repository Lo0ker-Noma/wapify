"use client";

/**
 * Lightweight WebSocket-based Nostr event publisher.
 * Connects to a fixed set of public relays, sends ["EVENT", event] to each,
 * waits for the ["OK", id, true/false, msg] response, and resolves with how
 * many relays accepted the event.
 *
 * No nostr-tools relay-pool dependency — kept minimal so it can run in any
 * page bundle without dragging the relay-pool surface area.
 */

export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.primal.net",
];

export type SignedEvent = {
  id: string;
  pubkey: string;
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  sig: string;
};

export type PublishResult = {
  relay: string;
  ok: boolean;
  reason?: string;
};

/**
 * Publish a signed event to every relay in parallel.
 * Resolves when all relays have replied (or after the per-relay timeout).
 */
export async function publishEvent(
  event: SignedEvent,
  relays: string[] = DEFAULT_RELAYS,
  perRelayTimeoutMs = 5000
): Promise<PublishResult[]> {
  return Promise.all(
    relays.map((relay) => publishToRelay(relay, event, perRelayTimeoutMs))
  );
}

function publishToRelay(
  url: string,
  event: SignedEvent,
  timeoutMs: number
): Promise<PublishResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean, reason?: string) => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch { /* ignore */ }
      resolve({ relay: url, ok, reason });
    };

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e: any) {
      resolve({ relay: url, ok: false, reason: e?.message ?? "ws ctor fail" });
      return;
    }

    const t = setTimeout(() => finish(false, "timeout"), timeoutMs);

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify(["EVENT", event]));
      } catch (e: any) {
        clearTimeout(t);
        finish(false, e?.message ?? "send fail");
      }
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        if (data[0] === "OK" && data[1] === event.id) {
          clearTimeout(t);
          finish(Boolean(data[2]), data[3]);
        } else if (data[0] === "NOTICE") {
          // Some relays send NOTICE before OK; keep waiting.
        }
      } catch { /* ignore malformed */ }
    };

    ws.onerror = () => {
      clearTimeout(t);
      finish(false, "ws error");
    };

    ws.onclose = () => {
      // If we close before receiving OK, that's a failure.
      clearTimeout(t);
      if (!settled) finish(false, "closed before OK");
    };
  });
}
