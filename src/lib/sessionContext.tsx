import { createContext, useContext, type ReactNode } from "react";

const SessionContext = createContext<string>("");

export function SessionProvider({ token, children }: { token: string; children: ReactNode }) {
  return <SessionContext.Provider value={token}>{children}</SessionContext.Provider>;
}

export function useSession(): string {
  return useContext(SessionContext);
}
