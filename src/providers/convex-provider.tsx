import { RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useStoreUserEffect } from "@/hooks/use-store-user";
import { api } from "../../convex/_generated/api";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Add your Convex URL to the .env file");
}

const convex = new ConvexReactClient(CONVEX_URL);

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  useStoreUserEffect();
  const user = useQuery(api.users.getMyUser);
  if (!user) return <div>Loading user...</div>;

  return <>{children}</>;
}

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
      <AuthLoading>
        <div>Loading auth...</div>
      </AuthLoading>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </Authenticated>
    </ConvexProviderWithClerk>
  );
}
