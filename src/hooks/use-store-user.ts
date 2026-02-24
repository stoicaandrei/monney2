import { useConvexAuth, useMutation } from 'convex/react'
import { useEffect } from 'react'
import { api } from '../../convex/_generated/api'

/**
 * Syncs the current Clerk user to the Convex users table on login.
 * Call this inside your app so the Convex user row exists before
 * any user-scoped queries/mutations run.
 */
export function useStoreUserEffect() {
  const { isAuthenticated } = useConvexAuth()
  const storeUser = useMutation(api.users.store)

  useEffect(() => {
    if (isAuthenticated) {
      storeUser()
    }
  }, [isAuthenticated, storeUser])
}
