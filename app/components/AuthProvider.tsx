"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SimplePool } from "nostr-tools/pool";
import { nip19 } from "nostr-tools";
import { isAdminPubkey } from "@/lib/admin";

export type NostrProfile = {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  banner?: string;
};

export type AuthState = {
  pubkey: string | null;
  npub: string | null;
  profile: NostrProfile | null;
  isAdmin: boolean;
};

type AuthContextValue = AuthState & {
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "wapufy:auth";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://relay.nostr.band",
];

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: {
        kind: number;
        created_at: number;
        tags: string[][];
        content: string;
      }) => Promise<{
        id: string;
        pubkey: string;
        kind: number;
        created_at: number;
        tags: string[][];
        content: string;
        sig: string;
      }>;
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    pubkey: null,
    npub: null,
    profile: null,
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AuthState;
      if (parsed.pubkey) {
        setState({
          pubkey: parsed.pubkey,
          npub: parsed.npub ?? nip19.npubEncode(parsed.pubkey),
          profile: parsed.profile ?? null,
          isAdmin: isAdminPubkey(parsed.pubkey),
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((s: AuthState) => {
    if (typeof window === "undefined") return;
    if (s.pubkey) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof window === "undefined" || !window.nostr) {
        throw new Error(
          "No se encontró extensión NIP-07. Instalá Alby, nos2x o Flamingo."
        );
      }
      const pk = await window.nostr.getPublicKey();
      await window.nostr.signEvent({
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["relay", "wapufy.app"],
          ["challenge", `wapufy-login-${Date.now()}`],
        ],
        content: "Wapufy login",
      });

      const npub = nip19.npubEncode(pk);
      let profile: NostrProfile | null = null;

      const pool = new SimplePool();
      try {
        const ev = await pool.get(RELAYS, { kinds: [0], authors: [pk] });
        if (ev?.content) {
          try {
            profile = JSON.parse(ev.content);
          } catch {
            // ignore malformed metadata
          }
        }
      } finally {
        pool.close(RELAYS);
      }

      const next: AuthState = {
        pubkey: pk,
        npub,
        profile,
        isAdmin: isAdminPubkey(pk),
      };
      setState(next);
      persist(next);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const logout = useCallback(() => {
    const next: AuthState = {
      pubkey: null,
      npub: null,
      profile: null,
      isAdmin: false,
    };
    setState(next);
    persist(next);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, loading, login, logout }),
    [state, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
