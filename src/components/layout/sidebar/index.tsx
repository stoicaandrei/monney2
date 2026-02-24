import * as React from 'react'
import { Link } from 'react-router-dom'

import { NavUser } from '@/components/layout/sidebar/nav-user'
import { SidebarAction } from '@/components/layout/sidebar/sidebar-action'
import { SidebarSection } from '@/components/layout/sidebar/sidebar-section'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  Menu01Icon,
  Wallet01Icon,
  PieChart01Icon,
  ChartHistogramIcon,
  RepeatIcon,
  Folder01Icon,
  Tag01Icon,
  Settings05Icon,
  HelpCircleIcon,
  CommandIcon,
} from '@hugeicons/core-free-icons'

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    },
    {
      title: 'Transactions',
      url: '#',
      icon: <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />,
    },
    {
      title: 'Wallets',
      url: '/wallets',
      icon: <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />,
    },
    {
      title: 'Budgets',
      url: '#',
      icon: <HugeiconsIcon icon={PieChart01Icon} strokeWidth={2} />,
    },
    {
      title: 'Reports',
      url: '#',
      icon: <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />,
    },
    {
      title: 'Recurring',
      url: '#',
      icon: <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} />,
    },
  ],
  navConfigs: [
    {
      title: 'Categories',
      url: '#',
      icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />,
    },
    {
      title: 'Tags',
      url: '#',
      icon: <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} />,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#',
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/">
                <HugeiconsIcon
                  icon={CommandIcon}
                  strokeWidth={2}
                  className="size-5!"
                />
                <span className="text-base font-semibold">Moneymaxxer</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarAction />
        <SidebarSection
          items={data.navMain}
          className="group-data-[collapsible=icon]:hidden"
        />
        <SidebarSection
          items={data.navConfigs}
          title="Configuration"
          className="group-data-[collapsible=icon]:hidden"
        />
        <SidebarSection items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
