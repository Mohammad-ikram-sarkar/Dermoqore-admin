"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Package,
  ShoppingCart,
  CircleDollarSign,
  Clock,
  ImagePlay,
  FileText,
  Rocket,
  AlertTriangle,
  ArrowRight,
  Loader2Icon,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProductService, type ProductType } from "@/service/product.service"
import { OrderService, type OrderType } from "@/service/order.service"
import { BannerService } from "@/service/banner.service"
import { BlogService } from "@/service/blog.service"
import { CampaignService } from "@/service/campaign.service"

const LOW_STOCK_THRESHOLD = 10

const ORDER_STATUS: Record<
  OrderType["status"],
  { label: string; dot: string; text: string }
> = {
  PENDING: { label: "Pending", dot: "bg-amber-500", text: "text-amber-700" },
  CONFIRMED: { label: "Confirmed", dot: "bg-sky-500", text: "text-sky-700" },
  PROCESSING: { label: "Processing", dot: "bg-indigo-500", text: "text-indigo-700" },
  SHIPPED: { label: "Shipped", dot: "bg-violet-500", text: "text-violet-700" },
  DELIVERED: { label: "Delivered", dot: "bg-emerald-500", text: "text-emerald-700" },
  CANCELLED: { label: "Cancelled", dot: "bg-rose-500", text: "text-rose-700" },
  REFUNDED: { label: "Refunded", dot: "bg-slate-500", text: "text-slate-700" },
}

const formatTk = (n: number) => `৳${Number(n).toLocaleString("en-BD")}`

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-background", className)}>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [products, setProducts] = useState<ProductType[]>([])
  const [orders, setOrders] = useState<OrderType[]>([])
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [banners, setBanners] = useState(0)
  const [blogs, setBlogs] = useState(0)
  const [campaigns, setCampaigns] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pRes, oRes, bRes, blRes, cRes] = await Promise.allSettled([
        ProductService.findAll(),
        OrderService.findAll(1, 50),
        BannerService.findAll(),
        BlogService.findAll({ limit: 1 }),
        CampaignService.findAll(),
      ])

      if (pRes.status === "fulfilled") setProducts(pRes.value)
      if (oRes.status === "fulfilled") {
        setOrders(oRes.value.items)
        setOrdersTotal(oRes.value.total)
      }
      if (bRes.status === "fulfilled") setBanners(bRes.value.length)
      if (blRes.status === "fulfilled") setBlogs(blRes.value.meta.total)
      if (cRes.status === "fulfilled") setCampaigns(cRes.value.length)

      const allFailed =
        pRes.status === "rejected" &&
        oRes.status === "rejected" &&
        bRes.status === "rejected" &&
        blRes.status === "rejected" &&
        cRes.status === "rejected"
      if (allFailed) setError("Could not load dashboard data. Please re-login and try again.")
    } catch {
      setError("Something went wrong while loading the dashboard.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side data load (token lives in localStorage) — required for the guarded dashboard.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  // ── Derived metrics ──────────────────────────────────────────────
  const activeProducts = products.filter((p) => p.status === "ACTIVE").length
  const lowStock = products
    .filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
  const outOfStock = products.filter((p) => (p.stock ?? 0) === 0).length

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})
  const statusBreakdown = (Object.keys(ORDER_STATUS) as OrderType["status"][]).map((s) => ({
    status: s,
    count: statusCounts[s] ?? 0,
  }))
  const maxStatus = Math.max(1, ...statusBreakdown.map((s) => s.count))

  const recentOrders = orders.slice(0, 6)

  const kpis = [
    {
      label: "Products",
      value: String(products.length),
      hint: `${activeProducts} active · ${outOfStock} out of stock`,
      icon: Package,
      accent: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Orders",
      value: String(ordersTotal),
      hint: `${orders.length} loaded`,
      icon: ShoppingCart,
      accent: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Revenue",
      value: formatTk(revenue),
      hint: "From loaded orders",
      icon: CircleDollarSign,
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Pending Orders",
      value: String(pendingOrders),
      hint: "Awaiting action",
      icon: Clock,
      accent: "bg-amber-500/10 text-amber-600",
    },
  ]

  const secondary = [
    { label: "Banners", value: banners, icon: ImagePlay, href: "/dashboard/banner" },
    { label: "Blog Posts", value: blogs, icon: FileText, href: "/dashboard/blog" },
    { label: "Campaigns", value: campaigns, icon: Rocket, href: "/dashboard/campaigns" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-wide">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — here&apos;s what&apos;s happening across your store.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button variant="outline" size="sm" className="ml-3" render={<Link href="/login" />}>
            Go to login
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading dashboard…
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{kpi.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
                  </div>
                  <div className={cn("flex size-10 items-center justify-center rounded-md", kpi.accent)}>
                    <kpi.icon className="size-5" strokeWidth={1.6} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {secondary.map((s) => (
              <Card key={s.label} className="p-5">
                <Link href={s.href} className="flex items-center justify-between group">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                    <s.icon className="size-5" strokeWidth={1.6} />
                  </div>
                </Link>
              </Card>
            ))}
          </div>

          {/* Main + side */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Recent orders */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold tracking-wide">Recent Orders</h2>
                <Button variant="ghost" size="sm" render={<Link href="/dashboard/orders" />}>
                  <span>View all</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              {recentOrders.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No orders yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-medium">Order</th>
                        <th className="px-5 py-3 font-medium">Customer</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentOrders.map((o) => {
                        const meta = ORDER_STATUS[o.status]
                        const customer =
                          o.recipientName ?? o.user?.name ?? o.shippingAddress?.name ?? "Guest"
                        return (
                          <tr key={o.id} className="transition-colors hover:bg-muted/50">
                            <td className="px-5 py-3 font-medium">{o.orderNumber}</td>
                            <td className="px-5 py-3 text-muted-foreground">{customer}</td>
                            <td className="px-5 py-3">
                              <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.text)}>
                                <span className={cn("size-2 rounded-full", meta.dot)} />
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {formatDate(o.createdAt)}
                            </td>
                            <td className="px-5 py-3 text-right font-medium">
                              {formatTk(Number(o.total))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Side: low stock + status */}
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" strokeWidth={1.6} />
                  <h2 className="text-sm font-semibold tracking-wide">Low Stock</h2>
                  <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {lowStock.length}
                  </span>
                </div>
                {lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All products sufficiently stocked.</p>
                ) : (
                  <ul className="space-y-3">
                    {lowStock.slice(0, 5).map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{p.name}</span>
                        <span
                          className={cn(
                            "shrink-0 rounded px-2 py-0.5 text-xs font-medium",
                            (p.stock ?? 0) === 0
                              ? "bg-rose-500/10 text-rose-700"
                              : "bg-amber-500/10 text-amber-700",
                          )}
                        >
                          {p.stock ?? 0} left
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-foreground" strokeWidth={1.6} />
                  <h2 className="text-sm font-semibold tracking-wide">Orders by Status</h2>
                </div>
                <ul className="space-y-3">
                  {statusBreakdown.map((s) => {
                    const meta = ORDER_STATUS[s.status as OrderType["status"]]
                    return (
                      <li key={s.status}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className={cn("size-2 rounded-full", meta.dot)} />
                            {meta.label}
                          </span>
                          <span className="font-medium">{s.count}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", meta.dot)}
                            style={{ width: `${(s.count / maxStatus) * 100}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
