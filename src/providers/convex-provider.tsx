import { RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useStoreUserEffect } from "@/hooks/use-store-user";
import { LoadingScreen } from "@/components/loading-screen";
import { Paywall } from "@/components/paywall";
import { api } from "../../convex/_generated/api";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Add your Convex URL to the .env file");
}

const convex = new ConvexReactClient(CONVEX_URL);

// Change the plan slug below to match the plan you created in the Clerk Dashboard.
// https://dashboard.clerk.com/~/billing/plans
const PLAN_SLUG = "basic_plan";

function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { has, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingScreen />;

  if (!has?.({ plan: PLAN_SLUG })) return <Paywall />;

  return <>{children}</>;
}

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

  return (
    <SubscriptionGate>
      {children}
    </SubscriptionGate>
  );
}

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
      <AuthGate>{children}</AuthGate>
    </ConvexProviderWithClerk>
  );
}
