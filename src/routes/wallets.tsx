import { createFileRoute } from '@tanstack/react-router'
import WalletsPage from '@/pages/wallets'

export const Route = createFileRoute('/wallets')({
  component: WalletsPage,
})
