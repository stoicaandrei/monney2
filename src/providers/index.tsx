import { UIProvider } from '@/providers/ui-provider'
import { AppClerkProvider } from './clerk-provider'
import { AppConvexProvider } from './convex-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppClerkProvider>
      <UIProvider>
        <AppConvexProvider>{children}</AppConvexProvider>
      </UIProvider>
    </AppClerkProvider>
  )
}
