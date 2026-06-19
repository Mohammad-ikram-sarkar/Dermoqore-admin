"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2Icon, ArrowLeftIcon, ChevronDownIcon } from "lucide-react"
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

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<OrderType | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await OrderService.findOne(id)
      setOrder(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load order")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    setSaving(true)
    setError(null)
    try {
      const updated = await OrderService.updateStatus(order.id, newStatus)
      setOrder(updated)
      setStatusOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading order...
        </span>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="space-y-4 p-1">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="size-3.5" />
          Back
        </Button>
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  if (!order) return null

  const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-xs" onClick={() => router.push("/dashboard/orders")}>
            <ArrowLeftIcon className="size-3.5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-wide font-mono text-sm">{order.orderNumber}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <Button variant="outline" size="sm" disabled={saving} onClick={() => setStatusOpen(!statusOpen)}>
            {saving && <Loader2Icon className="size-3.5 animate-spin" />}
            <span>Update Status</span>
            <ChevronDownIcon className="size-3.5" />
          </Button>
          {statusOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded border border-border bg-background shadow-lg">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`flex w-full items-center px-3 py-2 text-left text-xs font-medium uppercase tracking-wider hover:bg-muted transition-colors ${
                    order.status === s ? "bg-muted" : ""
                  }`}
                >
                  {STATUS_LABELS[s]?.label ?? s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Customer & Shipping */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded border border-border">
            <div className="border-b border-border bg-muted/20 px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</h2>
            </div>
            <div className="p-4 text-sm space-y-1">
              <p className="font-medium">{order.user?.name ?? "N/A"}</p>
              <p className="text-muted-foreground">{order.user?.email}</p>
            </div>
          </div>

          {order.shippingAddress && (
            <div className="rounded border border-border">
              <div className="border-b border-border bg-muted/20 px-4 py-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</h2>
              </div>
              <div className="p-4 text-sm space-y-0.5">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                <p className="text-muted-foreground">{order.shippingAddress.address}</p>
                {order.shippingAddress.area && (
                  <p className="text-muted-foreground">{order.shippingAddress.area}</p>
                )}
                <p className="text-muted-foreground">{order.shippingAddress.city}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${
                  order.shippingAddress.zone === "INSIDE_DHAKA"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {order.shippingAddress.zone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="rounded border border-border">
            <div className="border-b border-border bg-muted/20 px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</h2>
            </div>
            <div className="p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{Number(order.subtotal).toLocaleString("en-BD")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>৳{Number(order.shippingCharge).toLocaleString("en-BD")}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">-৳{Number(order.discount).toLocaleString("en-BD")}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>৳{Number(order.total).toLocaleString("en-BD")}</span>
              </div>
            </div>
          </div>

          <div className="rounded border border-border">
            <div className="border-b border-border bg-muted/20 px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Zone</h2>
            </div>
            <div className="p-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                order.deliveryZone === "INSIDE_DHAKA"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}>
                {order.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="rounded border border-border">
              <div className="border-b border-border bg-muted/20 px-4 py-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
              </div>
              <div className="p-4 text-sm text-muted-foreground">{order.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded border border-border">
        <div className="border-b border-border bg-muted/20 px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Items ({order.items.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {order.items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt="" className="size-10 rounded object-cover bg-muted" />
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  ৳{Number(item.unitPrice).toLocaleString("en-BD")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-muted-foreground font-medium">
                  ৳{Number(item.totalPrice).toLocaleString("en-BD")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
