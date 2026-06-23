"use client"

import { useState, useEffect } from "react"
import { Loader2Icon } from "lucide-react"
import { ProductService } from "@/service/product.service"
import CampaignForm from "@/components/campaign/CampaignForm"

export default function CampaignNewClient() {
  const [products, setProducts] = useState<{ id: string; name: string; slug: string; price: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ProductService.findAll()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-xl font-semibold tracking-wide">New Campaign</h1>
        <p className="text-sm text-muted-foreground">Create a dynamic landing page for a product campaign</p>
      </div>
      <CampaignForm products={products} mode="new" />
    </div>
  )
}
