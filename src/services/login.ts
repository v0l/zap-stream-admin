import { LoginSession } from "../types/login";
import { EventSigner, Nip7Signer } from "@snort/system";
import { EventEmitter } from "eventemitter3";
import { useSyncExternalStore, useState, useCallback, useEffect } from "react";
import { AdminAPI } from "./api";

class LoginStoreImpl extends EventEmitter {
  private _session: LoginSession | undefined;
  private _signer: EventSigner | undefined;

  constructor() {
    super();
    this.loadSession();
  }

  get session(): LoginSession | undefined {
    return this._session;
  }

  get hasSession(): boolean {
    return this._session !== undefined;
  }

  get publicKey(): string | undefined {
    return this._session?.publicKey;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.on("change", listener);
    return () => this.off("change", listener);
  };

  getSnapshot = (): LoginSession | undefined => {
    return this._session;
  };

  private loadSession(): void {
    try {
      const stored = localStorage.getItem("admin_login_session");
      if (stored) {
        const session = JSON.parse(stored);
        this._session = session;
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      localStorage.removeItem("admin_login_session");
    }
  }

  private saveSession(): void {
    if (this._session) {
      localStorage.setItem(
        "admin_login_session",
        JSON.stringify(this._session),
      );
    } else {
      localStorage.removeItem("admin_login_session");
    }
  }

  login(session: LoginSession): void {
    this._session = session;
    this._signer = undefined;
    this.saveSession();
    this.emit("change");
  }

  logout(): void {
    this._session = undefined;
    this._signer = undefined;
    this.saveSession();
    this.emit("change");
  }

  updateSession(session: LoginSession): void {
    this._session = session;
    this._signer = undefined;
    this.saveSession();
    this.emit("change");
  }

  getSigner(): EventSigner | undefined {
    if (!this._signer && this._session) {
      switch (this._session.type) {
        case "nip7":
          // Only create signer if NIP-07 is available
          if (typeof window !== "undefined" && window.nostr) {
            this._signer = new Nip7Signer();
          } else {
            console.warn("NIP-07 extension not available yet");
            return undefined;
          }
          break;
        default:
          console.warn(`Unsupported login type: ${this._session.type}`);
      }
    }
    return this._signer;
  }
}

export const loginStore = new LoginStoreImpl();

export function useLoginStore(): LoginSession | undefined {
  return useSyncExternalStore(loginStore.subscribe, loginStore.getSnapshot);
}

export function useLogin() {
  const session = useLoginStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNip07Supported, setIsNip07Supported] = useState(false);

  // Check for NIP-07 support after window loads and periodically
  useEffect(() => {
    const checkNip07Support = () => {
      const supported = typeof window !== "undefined" && !!window.nostr;
      setIsNip07Supported(supported);
    };

    // Initial check
    checkNip07Support();

    // Check again after a short delay for late-loading extensions
    const timeoutId = setTimeout(checkNip07Support, 1000);

    // Also check on window load if not already loaded
    if (document.readyState === "loading") {
      window.addEventListener("load", checkNip07Support);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("load", checkNip07Support);
    };
  }, []);

  const isAuthenticated = loginStore.hasSession;
  const publicKey = loginStore.publicKey;
  const signer = loginStore.getSigner();

  const getAdminAPI = useCallback(async (): Promise<AdminAPI | null> => {
    // If signer is not available, wait a bit and try again
    let currentSigner = signer;
    if (!currentSigner && isAuthenticated) {
      // Wait for NIP-07 extension to load
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        currentSigner = loginStore.getSigner();
        if (currentSigner) break;
      }
    }

    if (!currentSigner) return null;
    return AdminAPI.current(currentSigner);
  }, [signer, isAuthenticated]);

  const loginWithNip07 = async () => {
    if (!isNip07Supported) {
      setError(
        "NIP-07 extension not found. Please install a Nostr browser extension.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const signer = new Nip7Signer();
      const publicKey = await signer.getPubKey();
      const session: LoginSession = {
        type: "nip7",
        publicKey,
      };

      loginStore.login(session);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to authenticate with NIP-07",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    loginStore.logout();
    localStorage.clear();
    setError(null);
  };

  return {
    session,
    isAuthenticated,
    publicKey,
    loginWithNip07,
    logout,
    isLoading,
    error,
    isNip07Supported,
    getAdminAPI,
    signer,
  };
}
