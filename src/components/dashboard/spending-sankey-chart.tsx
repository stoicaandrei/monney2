"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ResponsiveSankey } from "@nivo/sankey";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SpendingSankeyChartProps {
  days: number;
  formatCurrency: (value: number) => string;
}

export function SpendingSankeyChart({ days, formatCurrency }: SpendingSankeyChartProps) {
  const sankeyData = useQuery(api.dashboard.expensesBySubcategorySankey, {
    days,
  });

  const hasData = sankeyData && sankeyData.nodes.length > 0 && sankeyData.links.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Subcategory</CardTitle>
        <CardDescription>
          Flow of expenses from categories to subcategories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[400px] w-full">
            <ResponsiveSankey
              data={sankeyData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              label={(node) => (node as { label?: string; id: string }).label ?? node.id}
              nodeOpacity={0.9}
              nodeHoverOpacity={1}
              nodeThickness={18}
              nodeSpacing={24}
              nodeBorderWidth={0}
              nodeBorderRadius={4}
              linkOpacity={0.5}
              linkHoverOpacity={0.8}
              enableLinkGradient
              linkContract={0}
              colors={(node) => (node as { color?: string }).color ?? "#94a3b8"}
              labelTextColor={{
                from: "color",
                modifiers: [["darker", 1.2]],
              }}
              valueFormat={(value) => formatCurrency(value)}
              nodeTooltip={({ node }) => (
                <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                  <div className="font-medium">{node.id}</div>
                  <div className="text-muted-foreground">
                    {formatCurrency(node.value)}
                  </div>
                </div>
              )}
              linkTooltip={({ link }) => (
                <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                  <div className="text-muted-foreground">
                    {link.source.id} → {link.target.id}
                  </div>
                  <div className="font-medium">
                    {formatCurrency(link.value)}
                  </div>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground text-sm">
              No expenses in this period
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
