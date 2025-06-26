import { EventSigner } from "@snort/system";

export interface LoginSession {
  type: "nip7" | "nsec" | "bunker";
  publicKey: string;
  privateKey?: string;
  bunkerUrl?: string;
}

export interface LoginStore {
  session: LoginSession | undefined;
  hasSession: boolean;
  publicKey: string | undefined;
  login: (session: LoginSession) => void;
  logout: () => void;
  updateSession: (session: LoginSession) => void;
  getSigner: () => Promise<EventSigner | undefined>;
}
