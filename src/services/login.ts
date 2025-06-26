import { LoginSession, LoginStore } from "../types/login";
import { EventSigner, Nip7Signer } from "@snort/system";
import { EventEmitter } from "eventemitter3";
import { useSyncExternalStore, useState, useCallback } from "react";
import { AdminAPI } from "./api";

class LoginStoreImpl extends EventEmitter implements LoginStore {
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

  async getSigner(): Promise<EventSigner | undefined> {
    if (!this._signer && this._session) {
      switch (this._session.type) {
        case "nip7":
          this._signer = new Nip7Signer();
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

  const isNip07Supported = typeof window !== "undefined" && !!window.nostr;
  const isAuthenticated = loginStore.hasSession;
  const publicKey = loginStore.publicKey;

  const getAdminAPI = useCallback(async (): Promise<AdminAPI | null> => {
    if (!session) return null;
    const signer = await loginStore.getSigner();
    return new AdminAPI(signer!);
  }, [session]);

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
  };
}
