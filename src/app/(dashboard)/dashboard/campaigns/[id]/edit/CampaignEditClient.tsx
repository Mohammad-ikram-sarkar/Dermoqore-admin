"use client"

import { useState, useEffect } from "react"
import { Loader2Icon } from "lucide-react"
import { CampaignService, type Campaign } from "@/service/campaign.service"
import { ProductService } from "@/service/product.service"
import CampaignForm from "@/components/campaign/CampaignForm"

interface Props {
  campaignId: string
}

export default function CampaignEditClient({ campaignId }: Props) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [products, setProducts] = useState<{ id: string; name: string; slug: string; price: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [c, p] = await Promise.all([
          CampaignService.findById(campaignId),
          ProductService.findAll(),
        ])
        setCampaign(c)
        setProducts(p)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load campaign")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [campaignId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error ?? "Campaign not found"}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-xl font-semibold tracking-wide">Edit Campaign</h1>
        <p className="text-sm text-muted-foreground">Update campaign: {campaign.title}</p>
      </div>
      <CampaignForm initial={campaign} products={products} mode="edit" />
    </div>
  )
}
