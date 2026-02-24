import { ConvexProvider, ConvexReactClient } from "convex/react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Add your Convex URL to the .env file");
}

const convex = new ConvexReactClient(CONVEX_URL);

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
