import { TooltipProvider } from '@/components/ui/tooltip'

export function UIProvider({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>
}
