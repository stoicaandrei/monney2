import { RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useStoreUserEffect } from "@/hooks/use-store-user";
import { LoadingScreen } from "@/components/loading-screen";
import { api } from "../../convex/_generated/api";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Add your Convex URL to the .env file");
}

const convex = new ConvexReactClient(CONVEX_URL);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  useStoreUserEffect();
  const user = useQuery(api.users.getMyUser);

  const isUserLoading = isAuthenticated && !user;

  if (isAuthLoading || isUserLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
      <AuthGate>{children}</AuthGate>
    </ConvexProviderWithClerk>
  );
}
