"use client";

import { NavLink } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { clsx } from "clsx";

export function SidebarSection({
  items,
  title,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: React.ReactNode;
    disabled?: boolean;
  }[];
  title?: string;
} & React.ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup
      {...props}
      className={clsx("group-data-[collapsible=icon]:hidden", props.className)}
    >
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.disabled ? (
              <SidebarMenuButton disabled>
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            ) : (
              <NavLink to={item.url} end={item.url.startsWith("/")}>
                {({ isActive }) => (
                  <SidebarMenuButton asChild isActive={isActive}>
                    <span className="flex w-full items-center gap-2">
                      {item.icon}
                      <span>{item.title}</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
