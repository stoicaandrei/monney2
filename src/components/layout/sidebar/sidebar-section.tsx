'use client'

import { NavLink } from 'react-router-dom'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { clsx } from 'clsx'

export function SidebarSection({
  items,
  title,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
  title?: string
} & React.ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup
      {...props}
      className={clsx('group-data-[collapsible=icon]:hidden', props.className)}
    >
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
