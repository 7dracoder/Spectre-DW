import { DbConnection } from "@/module_bindings";
import type { Identity } from "spacetimedb";

const TOKEN_KEY = "specter.spacetimedb.token";
const IDENTITY_KEY = "specter.spacetimedb.identity";

const uri = import.meta.env.VITE_SPACETIMEDB_URI?.trim();
const databaseName = import.meta.env.VITE_SPACETIMEDB_DATABASE?.trim();

export const spacetimeConfigured = Boolean(
  uri &&
    databaseName &&
    !uri.includes("your-spacetimedb") &&
    !databaseName.includes("your-database"),
);

export const demoMode =
  import.meta.env.VITE_DEMO_MODE !== "false" || !spacetimeConfigured;

export type SpacetimeSession = {
  connection: DbConnection;
  identity: Identity;
  token: string;
};

let activeSession: SpacetimeSession | null = null;
let pendingConnection: Promise<SpacetimeSession> | null = null;

const subscribe = (connection: DbConnection) =>
  new Promise<void>((resolve, reject) => {
    connection
      .subscriptionBuilder()
      .onApplied(() => resolve())
      .onError(() => reject(new Error("SpacetimeDB subscription failed.")))
      .subscribe([
        "SELECT * FROM investigations",
        "SELECT * FROM source_documents",
        "SELECT * FROM signals",
        "SELECT * FROM claims",
        "SELECT * FROM embeddings",
        "SELECT * FROM voice_sessions",
      ]);
  });

export const connectSpacetime = async (): Promise<SpacetimeSession> => {
  if (!spacetimeConfigured || !uri || !databaseName) {
    throw new Error(
      "SpacetimeDB is not configured. Set VITE_SPACETIMEDB_URI and VITE_SPACETIMEDB_DATABASE.",
    );
  }
  if (activeSession) return activeSession;
  if (pendingConnection) return pendingConnection;

  pendingConnection = new Promise<SpacetimeSession>((resolve, reject) => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY) || undefined;
    DbConnection.builder()
      .withUri(uri)
      .withDatabaseName(databaseName)
      .withToken(storedToken)
      .onConnect((connection, identity, token) => {
        window.localStorage.setItem(TOKEN_KEY, token);
        window.localStorage.setItem(IDENTITY_KEY, identity.toHexString());
        void subscribe(connection)
          .then(() => {
            activeSession = { connection, identity, token };
            resolve(activeSession);
          })
          .catch(reject);
      })
      .onConnectError((_ctx, error) => reject(error))
      .onDisconnect(() => {
        activeSession = null;
        pendingConnection = null;
      })
      .build();
  }).finally(() => {
    pendingConnection = null;
  });

  return pendingConnection;
};

export const getStoredIdentity = () =>
  typeof window === "undefined"
    ? null
    : window.localStorage.getItem(IDENTITY_KEY);

export const disconnectSpacetime = () => {
  activeSession?.connection.disconnect();
  activeSession = null;
  pendingConnection = null;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(IDENTITY_KEY);
};
