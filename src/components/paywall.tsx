import { PricingTable, SignOutButton } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Paywall() {
  const { user } = useUser();

  const fullName = user?.fullName ?? user?.firstName ?? "User";
  const avatarUrl = user?.imageUrl;
  const initials = getInitials(fullName);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-lg font-semibold">Monney</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{fullName}</span>
          <SignOutButton>
            <Button variant="ghost" size="sm">
              Sign out
            </Button>
          </SignOutButton>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center py-12 px-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Choose your plan
            </h1>
            <p className="text-muted-foreground max-w-md">
              Subscribe to Monney to start tracking your finances and take
              control of your money.
            </p>
          </div>
          <PricingTable />
        </div>
      </div>
    </div>
  );
}
