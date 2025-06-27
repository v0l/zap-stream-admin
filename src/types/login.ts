export interface LoginSession {
  type: "nip7" | "nsec" | "bunker";
  publicKey: string;
  privateKey?: string;
  bunkerUrl?: string;
}