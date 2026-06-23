"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderService, type OrderType } from "@/service/order.service"
import { CampaignService, type CampaignOrder, type CampaignOrderStatus } from "@/service/campaign.service"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Pending",    color: "bg-amber-100 text-amber-700" },
  CONFIRMED:  { label: "Confirmed",  color: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Processing", color: "bg-indigo-100 text-indigo-700" },
  SHIPPED:    { label: "Shipped",    color: "bg-purple-100 text-purple-700" },
  DELIVERED:  { label: "Delivered",  color: "bg-emerald-100 text-emerald-700" },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-100 text-red-600" },
  REFUNDED:   { label: "Refunded",   color: "bg-slate-100 text-slate-600" },
}

type Tab = "all" | "INSIDE_DHAKA" | "OUTSIDE_DHAKA" | "campaign"

const TABS: { key: Tab; label: string }[] = [
  { key: "all",           label: "All" },
  { key: "INSIDE_DHAKA",  label: "Inside Dhaka" },
  { key: "OUTSIDE_DHAKA", label: "Outside Dhaka" },
  { key: "campaign",      label: "Campaign" },
]

export default function OrdersPage() {
  const router = useRouter()

  const [tab, setTab] = useState<Tab>("all")
  const [page, setPage] = useState(1)

  // Regular orders state
  const [orders, setOrders] = useState<OrderType[]>([])
  const [total, setTotal] = useState(0)

  // Campaign orders state
  const [campOrders, setCampOrders] = useState<CampaignOrder[]>([])
  const [campTotal, setCampTotal] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const limit = 15

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (tab === "campaign") {
        const data = await CampaignService.getAllOrders(page)
        setCampOrders(data.items)
        setCampTotal(data.meta.total)
      } else {
        const data = tab === "all"
          ? await OrderService.findAll(page, limit)
          : await OrderService.findByZone(tab as "INSIDE_DHAKA" | "OUTSIDE_DHAKA", page, limit)
        setOrders(data.items)
        setTotal(data.total)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [tab, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [tab])

  const handleCampStatusChange = async (orderId: string, status: CampaignOrderStatus) => {
    try {
      await CampaignService.updateOrderStatus(orderId, status)
      setCampOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    } catch {
      setError("Failed to update status")
    }
  }

  const isCampaign = tab === "campaign"
  const activeList = isCampaign ? campOrders : orders
  const activeTotal = isCampaign ? campTotal : total
  const totalPages = Math.ceil(activeTotal / limit)

  return (
    <div className="space-y-4 p-1">
      <div>
        <h1 className="text-xl font-semibold tracking-wide">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage all customer orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/20 p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* ── Regular orders table ─────────────────────────────────── */}
      {!isCampaign && (
        <div className="overflow-hidden rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><Loader2Icon className="size-4 animate-spin" /> Loading...</span>
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No orders found.</td></tr>
              )}
              {!loading && orders.map((order) => {
                const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING
                return (
                  <tr key={order.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.user?.name ?? order.recipientName ?? "Guest"}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.email ?? order.recipientPhone ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="px-4 py-3 font-medium">৳{Number(order.total).toLocaleString("en-BD")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${order.deliveryZone === "INSIDE_DHAKA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {order.deliveryZone === "INSIDE_DHAKA" ? "Inside" : "Outside"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon-xs" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                        <EyeIcon className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Campaign orders table ────────────────────────────────── */}
      {isCampaign && (
        <div className="overflow-hidden rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><Loader2Icon className="size-4 animate-spin" /> Loading...</span>
                  </td>
                </tr>
              )}
              {!loading && campOrders.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No campaign orders yet.</td></tr>
              )}
              {!loading && campOrders.map((o) => {
                const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING
                return (
                  <tr key={o.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{o.campaign?.title ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{o.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.customerPhone}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${o.deliveryZone === "INSIDE_DHAKA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {o.deliveryZone === "INSIDE_DHAKA" ? "Inside" : "Outside"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{o.quantity}</td>
                    <td className="px-4 py-3 font-medium">৳{Number(o.total).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => handleCampStatusChange(o.id, e.target.value as CampaignOrderStatus)}
                        className="h-7 rounded border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        {Object.entries(STATUS_LABELS).filter(([k]) => k !== "REFUNDED").map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Page {page} of {totalPages} ({activeTotal} total)</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeftIcon className="size-3.5" /> Previous
            </Button>
            <Button variant="outline" size="xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
