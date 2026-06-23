"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeftIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CampaignService, type CampaignOrder, type CampaignOrderStatus } from "@/service/campaign.service"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "Pending",    color: "bg-amber-100 text-amber-700" },
  CONFIRMED:  { label: "Confirmed",  color: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Processing", color: "bg-indigo-100 text-indigo-700" },
  SHIPPED:    { label: "Shipped",    color: "bg-purple-100 text-purple-700" },
  DELIVERED:  { label: "Delivered",  color: "bg-emerald-100 text-emerald-700" },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-100 text-red-600" },
}

export default function CampaignOrdersPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [orders, setOrders] = useState<CampaignOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await CampaignService.getOrders(id)
      setOrders(res.items)
      setTotal(res.meta.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (orderId: string, status: CampaignOrderStatus) => {
    try {
      await CampaignService.updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    } catch {
      setError("Failed to update status")
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-xs" onClick={() => router.push("/dashboard/campaigns")}>
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Campaign Orders</h1>
          <p className="text-sm text-muted-foreground">{total} orders from this campaign</p>
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Address</th>
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
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" /> Loading orders...
                  </span>
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  No orders yet for this campaign.
                </td>
              </tr>
            )}
            {!loading && orders.map((o) => {
              const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING
              return (
                <tr key={o.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3 font-medium">{o.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.customerPhone}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{o.customerAddress}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {o.deliveryZone === "INSIDE_DHAKA" ? "Dhaka" : "Outside Dhaka"}
                  </td>
                  <td className="px-4 py-3 text-center">{o.quantity}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(o.total).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value as CampaignOrderStatus)}
                      className="h-7 rounded border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
