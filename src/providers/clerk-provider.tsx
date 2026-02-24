import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  ClerkLoading,
  SignedOut,
} from '@clerk/tanstack-react-start'

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>{children}</SignedIn>
      <ClerkLoading>
        <div>Loading auth...</div>
      </ClerkLoading>
    </ClerkProvider>
  )
}
