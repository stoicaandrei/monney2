"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/types/wallet";
import type { WalletFormData } from "@/types/wallet";
import { toast } from "sonner";

const DEFAULT_CURRENCY = "EUR" as const;

export default function SettingsPage() {
  const preferences = useQuery(api.userPreferences.get);
  const updateDefaultCurrency = useMutation(
    api.userPreferences.updateDefaultCurrency,
  );

  const defaultCurrency = preferences?.defaultCurrency ?? DEFAULT_CURRENCY;

  const handleCurrencyChange = (value: string) => {
    updateDefaultCurrency({
      defaultCurrency: value as WalletFormData["currency"],
    }).then(() => {
      toast.success("Default currency updated");
    });
  };

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
        <SiteHeader title="Settings" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col gap-4 px-4 lg:px-6">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Settings
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Manage your account preferences
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>
                      Default currency for new wallets and display
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Default currency</FieldLabel>
                        <Select
                          value={defaultCurrency}
                          onValueChange={handleCurrencyChange}
                        >
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.symbol} — {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
