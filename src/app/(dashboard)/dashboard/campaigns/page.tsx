"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PlusIcon, PencilIcon, TrashIcon, Loader2Icon, ExternalLinkIcon, ClipboardListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CampaignService, type Campaign } from "@/service/campaign.service"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:  { label: "Draft",  color: "bg-slate-100 text-slate-600" },
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  ENDED:  { label: "Ended",  color: "bg-red-100 text-red-600" },
}

const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3001"

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCampaigns(await CampaignService.findAll())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (c: Campaign) => {
    if (!window.confirm(`Delete campaign "${c.title}"? This cannot be undone.`)) return
    try {
      await CampaignService.remove(c.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Create and manage landing page campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/campaigns/orders")}>
            <ClipboardListIcon className="size-3.5" />
            All Orders
          </Button>
          <Button size="sm" onClick={() => router.push("/dashboard/campaigns/new")}>
            <PlusIcon className="size-3.5" />
            New Campaign
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Campaign URL</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Loading campaigns...
                  </span>
                </td>
              </tr>
            )}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No campaigns yet. Create your first campaign to get started.
                </td>
              </tr>
            )}
            {!loading && campaigns.map((c) => {
              const status = STATUS_LABELS[c.status] ?? STATUS_LABELS.DRAFT
              const campaignUrl = `${CLIENT_URL}/campaign/${c.slug}`
              return (
                <tr key={c.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="rounded bg-muted px-2 py-0.5">{c.product.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                        /campaign/{c.slug}
                      </span>
                      <a
                        href={campaignUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => router.push(`/dashboard/campaigns/${c.id}/orders`)}
                        title="View orders"
                      >
                        <ClipboardListIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => router.push(`/dashboard/campaigns/${c.id}/edit`)}
                      >
                        <PencilIcon className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(c)}>
                        <TrashIcon className="size-3.5 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
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
