"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DeliveryService, type DeliveryChargeType } from "@/service/delivery.service"

export default function DeliverySettingsPage() {
  const [charges, setCharges] = useState<DeliveryChargeType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await DeliveryService.findAll()
      setCharges(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load delivery charges")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleChargeChange = (id: string, value: string) => {
    setCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, charge: parseFloat(value) || 0 } : c)),
    )
  }

  const handleMinOrderChange = (id: string, value: string) => {
    setCharges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, minOrder: value ? parseFloat(value) || 0 : null } : c,
      ),
    )
  }

  const handleSave = async (charge: DeliveryChargeType) => {
    setSaving(charge.id)
    setError(null)
    try {
      const updated = await DeliveryService.update(charge.id, {
        charge: charge.charge,
        minOrder: charge.minOrder,
      })
      setCharges((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update delivery charge")
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading delivery charges...
        </span>
      </div>
    )
  }

  const zoneLabels: Record<string, { label: string; desc: string; color: string }> = {
    INSIDE_DHAKA: {
      label: "Inside Dhaka",
      desc: "Delivery charge for orders within Dhaka city",
      color: "bg-green-100 text-green-700",
    },
    OUTSIDE_DHAKA: {
      label: "Outside Dhaka",
      desc: "Delivery charge for orders outside Dhaka city",
      color: "bg-orange-100 text-orange-700",
    },
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Delivery Charges</h1>
        <p className="text-sm text-muted-foreground">
          Configure shipping charges for inside and outside Dhaka.
        </p>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {charges.length === 0 && !loading && (
        <div className="rounded border border-border p-6 text-center text-sm text-muted-foreground">
          No delivery charges configured. Create one via the delivery API.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {charges.map((charge) => {
          const zone = zoneLabels[charge.zone] ?? { label: charge.zone, desc: "", color: "bg-muted text-muted-foreground" }
          return (
            <div key={charge.id} className="rounded border border-border">
              <div className="border-b border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${zone.color}`}>
                    {zone.label}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Delivery Charge (৳)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={charge.charge}
                    onChange={(e) => handleChargeChange(charge.id, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Minimum Order for Free Delivery (৳)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave empty for no free delivery"
                    value={charge.minOrder ?? ""}
                    onChange={(e) => handleMinOrderChange(charge.id, e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    If set, orders above this amount get free shipping in this zone.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  disabled={saving === charge.id}
                  onClick={() => handleSave(charge)}
                >
                  {saving === charge.id ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <SaveIcon className="size-3.5" />
                  )}
                  <span>Save</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
