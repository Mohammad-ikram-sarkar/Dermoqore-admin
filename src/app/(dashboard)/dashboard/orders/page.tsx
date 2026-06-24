"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, ChevronsLeftIcon, ChevronsRightIcon, SearchIcon, XIcon } from "lucide-react"
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

const STATUS_OPTIONS = ["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]

type Tab = "all" | "website" | "campaign"

const TABS: { key: Tab; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "website",  label: "Website" },
  { key: "campaign", label: "Campaign" },
]

const LIMIT = 15

function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  const tp = Math.max(1, totalPages)
  const pages: (number | "...")[] = []
  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(tp - 1, page + 1); i++) pages.push(i)
    if (page < tp - 2) pages.push("...")
    pages.push(tp)
  }
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p className="text-xs">{total} total &mdash; page {page} of {tp}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-xs" disabled={page <= 1} onClick={() => onPage(1)}><ChevronsLeftIcon className="size-3.5" /></Button>
        <Button variant="outline" size="icon-xs" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeftIcon className="size-3.5" /></Button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)}
              className={`h-7 min-w-[28px] px-2 text-xs font-semibold rounded border transition-colors ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border bg-transparent hover:bg-muted text-foreground"}`}>
              {p}
            </button>
          )
        )}
        <Button variant="outline" size="icon-xs" disabled={page >= tp} onClick={() => onPage(page + 1)}><ChevronRightIcon className="size-3.5" /></Button>
        <Button variant="outline" size="icon-xs" disabled={page >= tp} onClick={() => onPage(tp)}><ChevronsRightIcon className="size-3.5" /></Button>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("all")

  const [phone, setPhone]   = useState("")
  const [status, setStatus] = useState("")
  const phoneRef = useRef<HTMLInputElement>(null)

  const [webPage, setWebPage]     = useState(1)
  const [orders, setOrders]       = useState<OrderType[]>([])
  const [webTotal, setWebTotal]   = useState(0)

  const [campPage, setCampPage]       = useState(1)
  const [campOrders, setCampOrders]   = useState<CampaignOrder[]>([])
  const [campTotal, setCampTotal]     = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // debounced phone
  const [debouncedPhone, setDebouncedPhone] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPhone(phone), 400)
    return () => clearTimeout(t)
  }, [phone])

  // reset pages when filters change
  useEffect(() => { setWebPage(1); setCampPage(1) }, [debouncedPhone, status, tab])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const run = async () => {
      try {
        const s = status || undefined
        const p = debouncedPhone || undefined

        if (tab === "all") {
          const [webData, camData] = await Promise.all([
            OrderService.findAll(webPage, LIMIT, s, p),
            CampaignService.getAllOrders(campPage, s, p),
          ])
          if (cancelled) return
          setOrders(webData.items)
          setWebTotal(webData.total)
          setCampOrders(camData.items)
          setCampTotal(camData.meta.total)
        } else if (tab === "website") {
          const data = await OrderService.findAll(webPage, LIMIT, s, p)
          if (cancelled) return
          setOrders(data.items)
          setWebTotal(data.total)
        } else {
          const data = await CampaignService.getAllOrders(campPage, s, p)
          if (cancelled) return
          setCampOrders(data.items)
          setCampTotal(data.meta.total)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load orders")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [tab, webPage, campPage, debouncedPhone, status])

  const handleCampStatusChange = async (orderId: string, s: CampaignOrderStatus) => {
    try {
      await CampaignService.updateOrderStatus(orderId, s)
      setCampOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: s } : o))
    } catch {
      setError("Failed to update status")
    }
  }

  const webTotalPages  = Math.ceil(webTotal / LIMIT)
  const campTotalPages = Math.ceil(campTotal / LIMIT)

  const mergedAll = tab === "all"
    ? [
        ...orders.map((d) => ({ type: "website" as const, data: d })),
        ...campOrders.map((d) => ({ type: "campaign" as const, data: d })),
      ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime())
    : []

  const hasFilters = phone || status

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage all customer orders</p>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Phone search */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={phoneRef}
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Search by phone..."
              className="h-8 w-48 rounded border border-border bg-background pl-8 pr-7 text-xs outline-none focus:ring-2 focus:ring-ring"
            />
            {phone && (
              <button onClick={() => setPhone("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="xs" onClick={() => { setPhone(""); setStatus("") }}>
              <XIcon className="size-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/20 p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setWebPage(1); setCampPage(1) }}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
              tab === t.key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* ── All tab ─────────────────────────────────────────── */}
      {tab === "all" && (
        <>
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Zone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {loading && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><Loader2Icon className="size-4 animate-spin" /> Loading...</span></td></tr>}
                {!loading && mergedAll.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No orders found.</td></tr>}
                {!loading && mergedAll.map((row) => {
                  if (row.type === "website") {
                    const o = row.data
                    const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING
                    const address = o.shippingAddress ? [o.shippingAddress.address, o.shippingAddress.area, o.shippingAddress.city].filter(Boolean).join(", ") : o.recipientAddress ?? "—"
                    return (
                      <tr key={`w-${o.id}`} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5 text-xs font-medium">Website</span></td>
                        <td className="px-4 py-3"><p className="font-medium">{o.user?.name ?? o.recipientName ?? "Guest"}</p><p className="text-xs text-muted-foreground">{o.user?.email ?? o.recipientPhone ?? "—"}</p></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{address}</td>
                        <td className="px-4 py-3 font-medium">৳{Number(o.total).toLocaleString("en-BD")}</td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${o.deliveryZone === "INSIDE_DHAKA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{o.deliveryZone === "INSIDE_DHAKA" ? "Inside" : "Outside"}</span></td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon-xs" onClick={() => router.push(`/dashboard/orders/${o.id}`)}><EyeIcon className="size-3.5" /></Button></td>
                      </tr>
                    )
                  }
                  const o = row.data
                  const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING
                  return (
                    <tr key={`c-${o.id}`} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-xs font-medium">Campaign</span></td>
                      <td className="px-4 py-3"><p className="font-medium">{o.customerName}</p><p className="text-xs text-muted-foreground">{o.customerPhone}</p></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{o.customerAddress}</td>
                      <td className="px-4 py-3 font-medium">৳{Number(o.total).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${o.deliveryZone === "INSIDE_DHAKA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{o.deliveryZone === "INSIDE_DHAKA" ? "Inside" : "Outside"}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon-xs" onClick={() => router.push(`/dashboard/orders/${o.id}?type=campaign`)}><EyeIcon className="size-3.5" /></Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Website</span>
              <div className="flex-1"><Pagination page={webPage} totalPages={webTotalPages} total={webTotal} onPage={setWebPage} /></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Campaign</span>
              <div className="flex-1"><Pagination page={campPage} totalPages={campTotalPages} total={campTotal} onPage={setCampPage} /></div>
            </div>
          </div>
        </>
      )}

      {/* ── Website tab ────────────────────────────────────── */}
      {tab === "website" && (
        <>
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Zone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {loading && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><Loader2Icon className="size-4 animate-spin" /> Loading...</span></td></tr>}
                {!loading && orders.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No orders found.</td></tr>}
                {!loading && orders.map((o) => {
                  const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING
                  const address = o.shippingAddress ? [o.shippingAddress.address, o.shippingAddress.area, o.shippingAddress.city].filter(Boolean).join(", ") : o.recipientAddress ?? "—"
                  return (
                    <tr key={o.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                      <td className="px-4 py-3"><p className="font-medium">{o.user?.name ?? o.recipientName ?? "Guest"}</p><p className="text-xs text-muted-foreground">{o.user?.email ?? o.recipientPhone ?? "—"}</p></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{address}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                      <td className="px-4 py-3 font-medium">৳{Number(o.total).toLocaleString("en-BD")}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${o.deliveryZone === "INSIDE_DHAKA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{o.deliveryZone === "INSIDE_DHAKA" ? "Inside" : "Outside"}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon-xs" onClick={() => router.push(`/dashboard/orders/${o.id}`)}><EyeIcon className="size-3.5" /></Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={webPage} totalPages={webTotalPages} total={webTotal} onPage={setWebPage} />
        </>
      )}

      {/* ── Campaign tab ───────────────────────────────────── */}
      {tab === "campaign" && (
        <>
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order #</th>
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Zone</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {loading && <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><Loader2Icon className="size-4 animate-spin" /> Loading...</span></td></tr>}
                {!loading && campOrders.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No campaign orders yet.</td></tr>}
                {!loading && campOrders.map((o) => {
                  const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING
                  return (
                    <tr key={o.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{o.campaign?.title ?? "—"}</td>
                      <td className="px-4 py-3"><p className="font-medium">{o.customerName}</p><p className="text-xs text-muted-foreground">{o.customerPhone}</p></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{o.customerAddress}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${o.deliveryZone === "INSIDE_DHAKA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{o.deliveryZone === "INSIDE_DHAKA" ? "Inside" : "Outside"}</span></td>
                      <td className="px-4 py-3 text-center">{o.quantity}</td>
                      <td className="px-4 py-3 font-medium">৳{Number(o.total).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={(e) => handleCampStatusChange(o.id, e.target.value as CampaignOrderStatus)} className="h-7 rounded border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring">
                          {Object.entries(STATUS_LABELS).filter(([k]) => k !== "REFUNDED").map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon-xs" onClick={() => router.push(`/dashboard/orders/${o.id}?type=campaign`)}><EyeIcon className="size-3.5" /></Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={campPage} totalPages={campTotalPages} total={campTotal} onPage={setCampPage} />
        </>
      )}
    </div>
  )
}
