"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

function SortableWalletCard({
  wallet,
  onEdit,
}: {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wallet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "z-50 cursor-grabbing opacity-80"
      )}
      {...attributes}
      {...listeners}
    >
      <WalletCard wallet={wallet} onEdit={onEdit} />
    </div>
  );
}

export default function WalletsPage() {
  const walletsFromQuery = useQuery(api.wallets.list) ?? [];
  const preferences = useQuery(api.userPreferences.get);
  const defaultCurrency = preferences?.defaultCurrency ?? 'EUR';
  const isPending = false;
  const error = null;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingWallet, setEditingWallet] = React.useState<Wallet | null>(null);
  const [optimisticWallets, setOptimisticWallets] = React.useState<
    typeof walletsFromQuery | null
  >(null);

  const wallets = optimisticWallets ?? walletsFromQuery;

  const createWallet = useMutation(api.wallets.create);
  const updateWallet = useMutation(api.wallets.update);
  const reorderWallets = useMutation(api.wallets.reorder);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const walletIds = React.useMemo<UniqueIdentifier[]>(
    () => wallets.map((w) => w.id),
    [wallets]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = walletIds.indexOf(active.id);
    const newIndex = walletIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(wallets, oldIndex, newIndex);
    setOptimisticWallets(reordered);
    reorderWallets({
      updates: reordered.map((w, i) => ({ id: w.id as Id<"wallets">, order: i })),
    }).finally(() => setOptimisticWallets(null));
  };

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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <SortableContext
                        items={walletIds}
                        strategy={rectSortingStrategy}
                      >
                        {wallets.map((wallet) => (
                          <SortableWalletCard
                            key={wallet.id}
                            wallet={wallet}
                            onEdit={handleEdit}
                          />
                        ))}
                      </SortableContext>
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
                  </DndContext>
                )}
              </div>
            </div>
          </div>
          <footer className="border-t px-4 py-3 lg:px-6">
            <p className="text-muted-foreground text-xs">
              TODO: Add unit link investment accounts functionality
            </p>
          </footer>
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
