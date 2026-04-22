"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
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
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { WalletCard } from "@/components/wallets/wallet-card";
import { WalletFormDialog } from "@/components/wallets/wallet-form-dialog";
import { WalletSectionFormDialog } from "@/components/wallets/wallet-section-form-dialog";
import { WalletSectionRenameDialog } from "@/components/wallets/wallet-section-rename-dialog";
import type { Wallet, WalletFormData, WalletSection } from "@/types/wallet";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const UNSECTIONED_ID = "__unsectioned__";
const WALLET_DRAG_ID_PREFIX = "wallet:";
const SECTION_DRAG_ID_PREFIX = "section-order:";

type SectionId = string | null;

function getDropZoneId(sectionId: SectionId) {
  return `section:${sectionId ?? UNSECTIONED_ID}`;
}

function getWalletDragId(walletId: string) {
  return `${WALLET_DRAG_ID_PREFIX}${walletId}`;
}

function getWalletIdFromDragId(dragId: string) {
  if (!dragId.startsWith(WALLET_DRAG_ID_PREFIX)) return null;
  return dragId.slice(WALLET_DRAG_ID_PREFIX.length);
}

function getSectionDragId(sectionId: string) {
  return `${SECTION_DRAG_ID_PREFIX}${sectionId}`;
}

function getSectionIdFromSortableId(sortableId: string) {
  if (!sortableId.startsWith(SECTION_DRAG_ID_PREFIX)) return null;
  return sortableId.slice(SECTION_DRAG_ID_PREFIX.length);
}

function getSectionIdFromDropZone(dropZoneId: string): SectionId | null {
  if (!dropZoneId.startsWith("section:")) return null;
  const rawSectionId = dropZoneId.slice("section:".length);
  return rawSectionId === UNSECTIONED_ID ? null : rawSectionId;
}

function normalizeWalletOrders(wallets: Wallet[]) {
  const nextOrderBySection = new Map<string, number>();
  return wallets.map((wallet) => {
    const sectionKey = wallet.sectionId ?? UNSECTIONED_ID;
    const nextOrder = nextOrderBySection.get(sectionKey) ?? 0;
    nextOrderBySection.set(sectionKey, nextOrder + 1);
    return { ...wallet, order: nextOrder };
  });
}

function moveWalletToTarget(
  wallets: Wallet[],
  activeWalletId: string,
  overId: string,
): Wallet[] {
  const activeIndex = wallets.findIndex((wallet) => wallet.id === activeWalletId);
  if (activeIndex === -1) return wallets;

  const activeWallet = wallets[activeIndex];
  const overWalletId = getWalletIdFromDragId(overId);
  const overSectionIdFromZone = getSectionIdFromDropZone(overId);
  const overSectionIdFromSortable = getSectionIdFromSortableId(overId);
  const overSectionId = overSectionIdFromZone ?? overSectionIdFromSortable;
  const overWallet = wallets.find((wallet) => wallet.id === overWalletId);
  const targetSectionId = overSectionId ?? overWallet?.sectionId ?? null;

  if (!overWallet && overSectionId === null) {
    return wallets;
  }

  const sourceSectionId = activeWallet.sectionId;
  const withoutActive = wallets.filter((wallet) => wallet.id !== activeWalletId);
  const movedWallet = { ...activeWallet, sectionId: targetSectionId };

  let insertionIndex = withoutActive.length;
  if (overWallet) {
    insertionIndex = withoutActive.findIndex((wallet) => wallet.id === overWallet.id);
    if (insertionIndex === -1) insertionIndex = withoutActive.length;
  } else if (sourceSectionId === targetSectionId) {
    const sectionWallets = withoutActive.filter(
      (wallet) => wallet.sectionId === targetSectionId,
    );
    const lastSectionWallet = sectionWallets[sectionWallets.length - 1];
    if (lastSectionWallet) {
      insertionIndex =
        withoutActive.findIndex((wallet) => wallet.id === lastSectionWallet.id) + 1;
    }
  }

  const nextWallets = [...withoutActive];
  nextWallets.splice(insertionIndex, 0, movedWallet);
  return normalizeWalletOrders(nextWallets);
}

function SortableWalletCard({
  wallet,
  onEdit,
  onDelete,
}: {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: getWalletDragId(wallet.id) });

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
        isDragging && "z-50 cursor-grabbing opacity-80",
      )}
      {...attributes}
      {...listeners}
    >
      <WalletCard wallet={wallet} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function WalletSectionColumn({
  section,
  wallets,
  walletIds,
  onEdit,
  onDelete,
  onCreateWallet,
  onRenameSection,
  dragHandleAttributes,
  dragHandleListeners,
  setDragHandleRef,
  isSectionDragging,
}: {
  section: { id: string | null; name: string; isSystem?: boolean };
  wallets: Wallet[];
  walletIds: UniqueIdentifier[];
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  onCreateWallet: () => void;
  onRenameSection?: (section: WalletSection) => void;
  dragHandleAttributes?: ReturnType<typeof useSortable>["attributes"];
  dragHandleListeners?: ReturnType<typeof useSortable>["listeners"];
  setDragHandleRef?: ReturnType<typeof useSortable>["setActivatorNodeRef"];
  isSectionDragging?: boolean;
}) {
  const dropZoneId = getDropZoneId(section.id);
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-none border p-4 transition-colors",
        isOver && "border-primary bg-primary/5",
        isSectionDragging && "opacity-70",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">{section.name}</h2>
          {!section.isSystem && onRenameSection && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onRenameSection(section as WalletSection)}
            >
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
              <span className="sr-only">Rename section</span>
            </Button>
          )}
          {setDragHandleRef && (
            <button
              ref={setDragHandleRef}
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-grab text-xs"
              aria-label={`Reorder section ${section.name}`}
              {...dragHandleAttributes}
              {...dragHandleListeners}
            >
              Drag
            </button>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
        </span>
      </div>
      <SortableContext items={walletIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => (
            <SortableWalletCard
              key={wallet.id}
              wallet={wallet}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          <button
            type="button"
            onClick={onCreateWallet}
            className={cn(
              "flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed border-input",
              "bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50",
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-7" />
            <span className="text-sm font-medium">Add wallet</span>
          </button>
        </div>
      </SortableContext>
    </div>
  );
}

function SortableWalletSectionColumn({
  section,
  wallets,
  walletIds,
  onEdit,
  onDelete,
  onCreateWallet,
  onRenameSection,
}: {
  section: WalletSection;
  wallets: Wallet[];
  walletIds: UniqueIdentifier[];
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  onCreateWallet: () => void;
  onRenameSection: (section: WalletSection) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: getSectionDragId(section.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <WalletSectionColumn
        section={section}
        wallets={wallets}
        walletIds={walletIds}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateWallet={onCreateWallet}
        onRenameSection={onRenameSection}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        setDragHandleRef={setActivatorNodeRef}
        isSectionDragging={isDragging}
      />
    </div>
  );
}

export default function WalletsPage() {
  const walletsQuery = useQuery(api.wallets.list);
  const sectionsQuery = useQuery(api.wallets.listSections);
  const walletsFromQuery = React.useMemo(
    () => (walletsQuery ?? []) as Wallet[],
    [walletsQuery],
  );
  const sectionsFromQuery = React.useMemo(
    () => (sectionsQuery ?? []) as WalletSection[],
    [sectionsQuery],
  );
  const preferences = useQuery(api.userPreferences.get);
  const defaultCurrency = preferences?.defaultCurrency ?? "EUR";
  const isPending = walletsQuery === undefined || sectionsQuery === undefined;
  const error = null;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = React.useState(false);
  const [renameSectionDialogOpen, setRenameSectionDialogOpen] = React.useState(false);
  const [editingWallet, setEditingWallet] = React.useState<Wallet | null>(null);
  const [editingSection, setEditingSection] = React.useState<WalletSection | null>(null);
  const [activeWalletId, setActiveWalletId] = React.useState<string | null>(null);
  const [optimisticSections, setOptimisticSections] = React.useState<
    WalletSection[] | null
  >(null);
  const [optimisticWallets, setOptimisticWallets] = React.useState<
    typeof walletsFromQuery | null
  >(null);

  const wallets = optimisticWallets ?? walletsFromQuery;
  const sections = optimisticSections ?? sectionsFromQuery;

  const createWallet = useMutation(api.wallets.create);
  const updateWallet = useMutation(api.wallets.update);
  const removeWallet = useMutation(api.wallets.remove);
  const reorderWallets = useMutation(api.wallets.reorder);
  const createSection = useMutation(api.wallets.createSection);
  const renameSection = useMutation(api.wallets.renameSection);
  const reorderSections = useMutation(api.wallets.reorderSections);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const sectionOrder = React.useMemo(
    () => [{ id: null, name: "Unsectioned", isSystem: true }, ...sections],
    [sections],
  );

  const walletsBySection = React.useMemo(() => {
    const groups = new Map<string, Wallet[]>();
    for (const section of sectionOrder) {
      groups.set(section.id ?? UNSECTIONED_ID, []);
    }
    for (const wallet of wallets) {
      const sectionKey = wallet.sectionId ?? UNSECTIONED_ID;
      if (!groups.has(sectionKey)) groups.set(sectionKey, []);
      groups.get(sectionKey)!.push(wallet);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
    }
    return groups;
  }, [wallets, sectionOrder]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    setActiveWalletId(getWalletIdFromDragId(activeId));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const activeWalletId = getWalletIdFromDragId(activeId);
    if (!activeWalletId) return;
    const overId = String(over.id);
    if (activeId === overId) return;

    setOptimisticWallets((current) => {
      const source = current ?? wallets;
      return moveWalletToTarget(source, activeWalletId, overId);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWalletId(null);
    if (!over) {
      setOptimisticWallets(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeSectionId = getSectionIdFromSortableId(activeId);
    if (activeSectionId) {
      const overSectionFromSortable = getSectionIdFromSortableId(overId);
      const overSectionFromDropZone = getSectionIdFromDropZone(overId);
      const overWalletId = getWalletIdFromDragId(overId);
      const overWalletSectionId = overWalletId
        ? wallets.find((wallet) => wallet.id === overWalletId)?.sectionId ?? null
        : null;
      const targetSectionId =
        overSectionFromSortable ?? overSectionFromDropZone ?? overWalletSectionId;

      if (!targetSectionId) return;

      const oldIndex = sections.findIndex((section) => section.id === activeSectionId);
      const newIndex = sections.findIndex((section) => section.id === targetSectionId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          order: index,
        }),
      );
      setOptimisticSections(reorderedSections);
      reorderSections({
        updates: reorderedSections.map((section, index) => ({
          id: section.id as Id<"walletSections">,
          order: index,
        })),
      })
        .catch((mutationError: unknown) => {
          toast.error(
            `Could not reorder sections: ${mutationError instanceof Error ? mutationError.message : "Unknown error"}`,
          );
        })
        .finally(() => {
          setOptimisticSections(null);
        });
      return;
    }

    const activeWalletId = getWalletIdFromDragId(activeId);
    if (!activeWalletId) {
      setOptimisticWallets(null);
      return;
    }
    const baseWallets = optimisticWallets ?? wallets;
    const reordered = moveWalletToTarget(baseWallets, activeWalletId, overId);

    setOptimisticWallets(reordered);
    reorderWallets({
      updates: reordered.map((wallet) => ({
        id: wallet.id as Id<"wallets">,
        sectionId: (wallet.sectionId as Id<"walletSections"> | null) ?? null,
        order: wallet.order ?? 0,
      })),
    })
      .catch((mutationError: unknown) => {
        toast.error(
          `Could not move wallet: ${mutationError instanceof Error ? mutationError.message : "Unknown error"}`,
        );
      })
      .finally(() => {
        setOptimisticWallets(null);
      });
  };

  const handleCreate = () => {
    setEditingWallet(null);
    setDialogOpen(true);
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setDialogOpen(true);
  };

  const handleDelete = (wallet: Wallet) => {
    const shouldDelete = window.confirm(
      `Delete "${wallet.name}" wallet? This will also delete all transactions in this wallet.`,
    );
    if (!shouldDelete) return;

    removeWallet({ id: wallet.id as Id<"wallets"> })
      .then(() => {
        toast.success("Wallet deleted");
      })
      .catch((mutationError: unknown) => {
        toast.error(
          `Could not delete wallet: ${mutationError instanceof Error ? mutationError.message : "Unknown error"}`,
        );
      });
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

  const handleCreateSection = (name: string) => {
    createSection({ name })
      .then(() => {
        toast.success("Section created");
      })
      .catch((mutationError: unknown) => {
        toast.error(
          `Could not create section: ${mutationError instanceof Error ? mutationError.message : "Unknown error"}`,
        );
      });
  };

  const handleOpenRenameSection = (section: WalletSection) => {
    setEditingSection(section);
    setRenameSectionDialogOpen(true);
  };

  const handleRenameSection = (name: string) => {
    if (!editingSection) return;
    renameSection({ id: editingSection.id as Id<"walletSections">, name })
      .then(() => {
        toast.success("Section renamed");
        setRenameSectionDialogOpen(false);
        setEditingSection(null);
      })
      .catch((mutationError: unknown) => {
        toast.error(
          `Could not rename section: ${mutationError instanceof Error ? mutationError.message : "Unknown error"}`,
        );
      });
  };

  const activeWallet = wallets.find((wallet) => wallet.id === activeWalletId) ?? null;

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
                      Create wallet sections and drag wallets between them
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSectionDialogOpen(true)}>
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add section
                    </Button>
                    <Button onClick={handleCreate} className="w-fit">
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add wallet
                    </Button>
                  </div>
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
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <WalletSectionColumn
                        section={{ id: null, name: "Unsectioned", isSystem: true }}
                        wallets={walletsBySection.get(UNSECTIONED_ID) ?? []}
                        walletIds={(walletsBySection.get(UNSECTIONED_ID) ?? []).map(
                          (wallet) => getWalletDragId(wallet.id),
                        )}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCreateWallet={handleCreate}
                      />
                      <SortableContext
                        items={sections.map((section) => getSectionDragId(section.id))}
                        strategy={rectSortingStrategy}
                      >
                        {sections.map((section) => {
                          const sectionWallets =
                            walletsBySection.get(section.id ?? UNSECTIONED_ID) ?? [];
                          const sectionWalletIds = sectionWallets.map((wallet) =>
                            getWalletDragId(wallet.id),
                          );

                          return (
                            <SortableWalletSectionColumn
                              key={section.id}
                              section={section}
                              wallets={sectionWallets}
                              walletIds={sectionWalletIds}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onCreateWallet={handleCreate}
                              onRenameSection={handleOpenRenameSection}
                            />
                          );
                        })}
                      </SortableContext>
                    </div>
                    <DragOverlay>
                      {activeWallet ? (
                        <WalletCard wallet={activeWallet} onEdit={handleEdit} />
                      ) : null}
                    </DragOverlay>
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
      <WalletSectionFormDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        onSubmit={handleCreateSection}
      />
      <WalletSectionRenameDialog
        open={renameSectionDialogOpen}
        onOpenChange={(open) => {
          setRenameSectionDialogOpen(open);
          if (!open) setEditingSection(null);
        }}
        section={editingSection}
        onSubmit={handleRenameSection}
      />
    </SidebarProvider>
  );
}
