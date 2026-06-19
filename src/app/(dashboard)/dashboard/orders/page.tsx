"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderService, type OrderType } from "@/service/order.service"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Pending",    color: "bg-amber-100 text-amber-700" },
  CONFIRMED:  { label: "Confirmed",  color: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Processing", color: "bg-indigo-100 text-indigo-700" },
  SHIPPED:    { label: "Shipped",    color: "bg-purple-100 text-purple-700" },
  DELIVERED:  { label: "Delivered",  color: "bg-emerald-100 text-emerald-700" },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-100 text-red-600" },
  REFUNDED:   { label: "Refunded",   color: "bg-slate-100 text-slate-600" },
}

type ZoneTab = "all" | "INSIDE_DHAKA" | "OUTSIDE_DHAKA"

const ZONE_TABS: { key: ZoneTab; label: string }[] = [
  { key: "all",           label: "All" },
  { key: "INSIDE_DHAKA",  label: "Inside Dhaka" },
  { key: "OUTSIDE_DHAKA", label: "Outside Dhaka" },
]

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zone, setZone] = useState<ZoneTab>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (zone === "all") {
        data = await OrderService.findAll(page, limit)
      } else {
        data = await OrderService.findByZone(zone, page, limit)
      }
      setOrders(data.items)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [zone, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [zone])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4 p-1">
      <div>
        <h1 className="text-xl font-semibold tracking-wide">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage customer orders</p>
      </div>

      {/* Zone tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/20 p-0.5 w-fit">
        {ZONE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setZone(t.key)}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
              zone === t.key
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
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Loading orders...
                  </span>
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}
            {!loading &&
              orders.map((order) => {
                const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING
                return (
                  <tr key={order.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium font-mono text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.user?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">
                      ৳{Number(order.total).toLocaleString("en-BD")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.deliveryZone === "INSIDE_DHAKA"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {order.deliveryZone === "INSIDE_DHAKA" ? "Inside" : "Outside"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        >
                          <EyeIcon className="size-3.5" />
                          <span className="sr-only">View</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="size-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
