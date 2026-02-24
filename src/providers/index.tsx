import { UIProvider } from "@/providers/ui-provider";
import { AppClerkProvider } from "./clerk-provider";
import { AppConvexProvider } from "./convex-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppClerkProvider>
      <AppConvexProvider>
        <UIProvider>{children}</UIProvider>
      </AppConvexProvider>
    </AppClerkProvider>
  );
}
