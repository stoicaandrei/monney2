'use client'

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
              <a href={item.url}>
                {item.icon}
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
