"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Sparkles,
  FileText,
  ImagePlay,
  Warehouse,
  TicketPercent,
  ShoppingCart,
  Settings,
  ChevronRight,
  Megaphone,
  Rocket,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// ─── Nav structure ─────────────────────────────────────────────────────────────

type FlatItem = {
  title: string
  url: string
  icon: React.ElementType
}

type GroupItem = {
  title: string
  icon: React.ElementType
  children: { title: string; url: string }[]
}

type NavItem = FlatItem | GroupItem

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { title: "Products",   url: "/dashboard/products", icon: ShoppingBag  },
      { title: "Categories", url: "/dashboard/category", icon: Tag          },
      { title: "Brands",     url: "/dashboard/brand",    icon: Sparkles     },
      { title: "Stock",      url: "/dashboard/stock",    icon: Warehouse    },
    ],
  },
  {
    label: "Orders",
    items: [
      { title: "Orders",     url: "/dashboard/orders",    icon: ShoppingCart },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Blog",             url: "/dashboard/blog",             icon: FileText      },
      { title: "Banners",          url: "/dashboard/banner",           icon: ImagePlay     },
      { title: "Announcement Bar", url: "/dashboard/announcement-bar", icon: Megaphone    },
      { title: "Campaigns",        url: "/dashboard/campaigns",        icon: Rocket        },
      { title: "Offers",           url: "/dashboard/offer",            icon: TicketPercent },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Settings",
        icon: Settings,
        children: [
          { title: "General", url: "/dashboard/settings/general"  },
          { title: "Footer",  url: "/dashboard/settings/footer"   },
          { title: "Delivery", url: "/dashboard/settings/delivery" },
        ],
      },
    ],
  },
]

const user = {
  name: "Admin",
  email: "admin@dermoqore.com",
  avatar: "",
}

function isGroupItem(item: NavItem): item is GroupItem {
  return "children" in item
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>

      {/* Brand header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded bg-foreground text-background text-[10px] font-bold tracking-widest shrink-0">
                DQ
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">DermoQore</span>
                <span className="text-[11px] text-muted-foreground">Admin Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {

                if (isGroupItem(item)) {
                  const isParentActive = item.children.some((c) =>
                    pathname.startsWith(c.url)
                  )
                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen={isParentActive}
                      className="group/collapsible"
                      render={<SidebarMenuItem />}
                    >
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isParentActive}
                          />
                        }
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton
                                isActive={pathname === child.url}
                                render={<Link href={child.url} />}
                              >
                                <span>{child.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                }

                // Flat item
                const isActive =
                  item.url === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      render={<Link href={item.url} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* User */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
