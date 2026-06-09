import React, { createContext, useContext, useEffect, useState } from "react";
import {
  connectSpacetime,
  demoMode,
  disconnectSpacetime,
  getStoredIdentity,
} from "@/integrations/spacetimedb/client";

type SpecterUser = {
  id: string;
  email?: string;
  user_metadata: {
    display_name?: string;
  };
};

type SpecterSession = {
  token: string;
} | null;

interface AuthContextType {
  user: SpecterUser | null;
  session: SpecterSession;
  loading: boolean;
  demoMode: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const demoUser = {
  id: "demo-user",
  email: "demo@spectre.local",
  user_metadata: { display_name: "Demo Investigator" },
} satisfies SpecterUser;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SpecterUser | null>(
    demoMode ? demoUser : null,
  );
  const [session, setSession] = useState<SpecterSession>(null);
  const [loading, setLoading] = useState(!demoMode);

  useEffect(() => {
    if (demoMode) return;
    if (!getStoredIdentity()) {
      setLoading(false);
      return;
    }

    connectSpacetime()
      .then(({ identity, token }) => {
        setSession({ token });
        setUser({
          id: identity.toHexString(),
          user_metadata: { display_name: "Investigator" },
        });
      })
      .catch(() => {
        setSession(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async () => {
    const { identity, token } = await connectSpacetime();
    setSession({ token });
    setUser({
      id: identity.toHexString(),
      user_metadata: { display_name: "Investigator" },
    });
  };

  const signOut = async () => {
    if (demoMode) {
      setUser(demoUser);
      return;
    }
    disconnectSpacetime();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, demoMode, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
