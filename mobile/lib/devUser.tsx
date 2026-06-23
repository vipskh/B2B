import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Dev-mode impersonation (auth temporarily off). The chosen seeded user's id is
// persisted and sent as `x-dev-user-id` on every API request.
const KEY = "devUserId";

// expo-secure-store has no web implementation, so fall back to localStorage on web
const ls = (globalThis as any)?.localStorage;
const store =
  Platform.OS === "web"
    ? {
        getItemAsync: async (k: string) => (ls ? ls.getItem(k) : null),
        setItemAsync: async (k: string, v: string) => {
          if (ls) ls.setItem(k, v);
        },
        deleteItemAsync: async (k: string) => {
          if (ls) ls.removeItem(k);
        },
      }
    : SecureStore;

// module-level cache so the axios interceptor can read it synchronously
let cached: string | null = null;
export const getDevUserIdSync = () => cached;

type Ctx = {
  userId: string | null;
  loaded: boolean;
  setUser: (id: string) => Promise<void>;
  clear: () => Promise<void>;
};

const DevUserContext = createContext<Ctx>({
  userId: null,
  loaded: false,
  setUser: async () => {},
  clear: async () => {},
});

export function DevUserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await store.getItemAsync(KEY);
        cached = stored;
        setUserId(stored);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setUser = async (id: string) => {
    cached = id;
    await store.setItemAsync(KEY, id);
    setUserId(id);
  };
  const clear = async () => {
    cached = null;
    await store.deleteItemAsync(KEY);
    setUserId(null);
  };

  return (
    <DevUserContext.Provider value={{ userId, loaded, setUser, clear }}>
      {children}
    </DevUserContext.Provider>
  );
}

export const useDevUser = () => useContext(DevUserContext);
