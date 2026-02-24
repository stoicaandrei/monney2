"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AppSidebar } from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { WalletCard } from "@/components/wallets/wallet-card";
import { WalletFormDialog } from "@/components/wallets/wallet-form-dialog";
import type { Wallet, WalletFormData } from "@/types/wallet";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export default function WalletsPage() {
  const wallets = useQuery(api.wallets.list) ?? [];
  const preferences = useQuery(api.userPreferences.get);
  const defaultCurrency = preferences?.defaultCurrency ?? 'EUR';
  const isPending = false;
  const error = null;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingWallet, setEditingWallet] = React.useState<Wallet | null>(null);

  const createWallet = useMutation(api.wallets.create);
  const updateWallet = useMutation(api.wallets.update);

  const handleCreate = () => {
    setEditingWallet(null);
    setDialogOpen(true);
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setDialogOpen(true);
  };

  const handleSubmit = (data: WalletFormData, existingId?: string) => {
    if (existingId) {
      updateWallet({ id: existingId as Id<"wallets">, ...data }).then(() => {
        setDialogOpen(false);
        setEditingWallet(null);
      });
    } else {
      createWallet(data).then(() => {
        setDialogOpen(false);
        setEditingWallet(null);
      });
    }
  };

  if (error) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Wallets" />
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-destructive">
              Failed to load wallets: {String(error)}
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Wallets" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                      Wallets
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Manage your accounts and track balances
                    </p>
                  </div>
                  <Button onClick={handleCreate} className="w-fit">
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    Add wallet
                  </Button>
                </div>

                {isPending ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      Loading wallets...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {wallets.map((wallet) => (
                      <WalletCard
                        key={wallet.id}
                        wallet={wallet}
                        onEdit={handleEdit}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={handleCreate}
                      className={cn(
                        "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed border-input",
                        "bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50",
                        "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <HugeiconsIcon
                        icon={Add01Icon}
                        strokeWidth={2}
                        className="size-8"
                      />
                      <span className="text-sm font-medium">Add wallet</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <WalletFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wallet={editingWallet}
        onSubmit={handleSubmit}
        defaultCurrency={defaultCurrency}
      />
    </SidebarProvider>
  );
}
