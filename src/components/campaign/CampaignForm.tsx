"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, TrashIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CampaignService,
  type Campaign,
  type CreateCampaignPayload,
} from "@/service/campaign.service"

type Product = { id: string; name: string; slug: string; price: number }

interface Props {
  initial?: Campaign
  products: Product[]
  mode: "new" | "edit"
}

type ReviewDraft = { name: string; videoUrl: string; description: string }

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"

export default function CampaignForm({ initial, products, mode }: Props) {
  const router = useRouter()

  // ── Basic Info ────────────────────────────────────────────────────
  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [productId, setProductId] = useState(initial?.productId ?? "")
  const [status, setStatus] = useState<Campaign["status"]>(initial?.status ?? "DRAFT")

  // ── Banner Image ──────────────────────────────────────────────────
  const [heroImages, setHeroImages] = useState<{ url: string; alt: string; sortOrder: number }[]>(
    initial?.heroImages?.map((img) => ({ url: img.url, alt: img.alt ?? "", sortOrder: img.sortOrder })) ?? []
  )
  const [uploadingImage, setUploadingImage] = useState(false)

  // ── Main Video URL ────────────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "")

  // ── Customer Reviews ──────────────────────────────────────────────
  const [reviews, setReviews] = useState<ReviewDraft[]>(
    initial?.customerReviews?.map((r) => ({
      name: r.name,
      videoUrl: r.videoUrl,
      description: r.videoDescription ?? "",
    })) ?? [{ name: "", videoUrl: "", description: "" }]
  )

  // ── BTRI Lab Report Images ────────────────────────────────────────
  const [labReportImages, setLabReportImages] = useState<string[]>(initial?.labReportImages ?? [])
  const [uploadingReport, setUploadingReport] = useState(false)

  // ── Campaign Pricing ──────────────────────────────────────────────
  const [campaignPrice, setCampaignPrice] = useState(String(initial?.campaignPrice ?? ""))
  const [comparePrice, setComparePrice] = useState(String(initial?.comparePrice ?? ""))

  // ── Form state ────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (mode === "new" && !slug) setSlug(slugify(v))
  }

  // ── BTRI report image upload (append) ────────────────────────────
  const handleReportUpload = useCallback(async (file: File) => {
    setUploadingReport(true)
    try {
      const { url } = await CampaignService.uploadImage(file)
      setLabReportImages((p) => [...p, url])
    } catch {
      setError("Report image upload failed")
    } finally {
      setUploadingReport(false)
    }
  }, [])

  // ── Banner image upload (replace, not append) ─────────────────────
  const handleImageUpload = useCallback(async (file: File) => {
    setUploadingImage(true)
    try {
      const { url } = await CampaignService.uploadImage(file)
      setHeroImages([{ url, alt: "", sortOrder: 0 }])
    } catch {
      setError("Image upload failed")
    } finally {
      setUploadingImage(false)
    }
  }, [])

  // ── Review helpers ────────────────────────────────────────────────
  const addReview = () => setReviews((p) => [...p, { name: "", videoUrl: "", description: "" }])
  const removeReview = (i: number) => setReviews((p) => p.filter((_, idx) => idx !== i))
  const updateReview = (i: number, field: keyof ReviewDraft, v: string) =>
    setReviews((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)))

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: CreateCampaignPayload = {
      title,
      slug: slug || slugify(title),
      productId,
      status,
      videoUrl: videoUrl || undefined,
      campaignPrice: campaignPrice ? Number(campaignPrice) : undefined,
      comparePrice: comparePrice ? Number(comparePrice) : undefined,
      labReportImages: labReportImages.length ? labReportImages : undefined,
      customerReviews: reviews
        .filter((r) => r.name && r.videoUrl)
        .map((r) => ({
          name: r.name,
          videoUrl: r.videoUrl,
          videoDescription: r.description || undefined,
        })),
      images: heroImages,
    }

    try {
      if (mode === "new") {
        await CampaignService.create(payload)
      } else if (initial) {
        await CampaignService.update(initial.id, payload)
      }
      router.push("/dashboard/campaigns")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Basic Info ──────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Basic Info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Dermoqore Spot Correcting Serum"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <Input
              id="slug"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="dermoqore-spot-correcting-serum"
            />
            <p className="text-xs text-muted-foreground">Page will be at /campaign/{slug || "..."}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="productId">Product *</Label>
            <select
              id="productId"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={selectCls}
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Campaign["status"])}
              className={selectCls}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Banner Image ─────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Banner Image</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Single image shown on the right side of the campaign hero. Uploading a new image replaces the current one.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {heroImages.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.url}
                alt={img.alt || "Banner"}
                className="h-28 w-28 rounded object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => setHeroImages((p) => p.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
          {heroImages.length === 0 && (
            <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-foreground/40 transition-colors">
              {uploadingImage ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <UploadIcon className="size-5" />
              )}
              <span className="mt-1 text-xs">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
            </label>
          )}
        </div>
      </section>

      {/* ── BTRI Lab Report Images ───────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">BTRI Lab Report Images</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload pages of the BTRI lab report. Shown on the campaign page with a lightbox viewer. If none uploaded, fallback images are used.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {labReportImages.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Report ${i + 1}`}
                className="h-28 w-20 rounded object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => setLabReportImages((p) => p.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
          <label className="flex h-28 w-20 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-foreground/40 transition-colors">
            {uploadingReport ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <UploadIcon className="size-5" />
            )}
            <span className="mt-1 text-xs">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleReportUpload(e.target.files[0])}
            />
          </label>
        </div>
      </section>

      {/* ── Campaign Pricing ──────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Campaign Pricing</h2>
        <p className="text-xs text-muted-foreground">
          Set the campaign offer price and the original compare-at price. Leave blank to use the product's default price.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="campaignPrice">Campaign Price (৳)</Label>
            <Input
              id="campaignPrice"
              type="number"
              min={0}
              value={campaignPrice}
              onChange={(e) => setCampaignPrice(e.target.value)}
              placeholder="890"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comparePrice">Compare-at Price (৳)</Label>
            <Input
              id="comparePrice"
              type="number"
              min={0}
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
              placeholder="1860"
            />
          </div>
        </div>
      </section>

      {/* ── Main Video URL ───────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Main Video</h2>
          <p className="text-xs text-muted-foreground mt-1">
            YouTube URL for the "Dermoqore কেন আলাদা?" video section on the campaign page.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="videoUrl">YouTube URL</Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
      </section>

      {/* ── Customer Reviews ──────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Customer Reviews</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Video reviews shown in the "গ্রাহকরা যা বলেছেন" section. Each review needs a name and YouTube video URL.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addReview}>
            <PlusIcon className="size-3.5" /> Add Review
          </Button>
        </div>

        {reviews.map((r, i) => (
          <div key={i} className="rounded border border-border p-4">
            <div className="flex items-start gap-2">
              <div className="grid gap-3 sm:grid-cols-2 flex-1">
                <div className="space-y-1.5">
                  <Label>Customer Name *</Label>
                  <Input
                    value={r.name}
                    onChange={(e) => updateReview(i, "name", e.target.value)}
                    placeholder="e.g. Fatema Begum"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>YouTube Video URL *</Label>
                  <Input
                    value={r.videoUrl}
                    onChange={(e) => updateReview(i, "videoUrl", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={r.description}
                    onChange={(e) => updateReview(i, "description", e.target.value)}
                    placeholder="Short review text shown below the video"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeReview(i)}
                className="mt-6"
              >
                <TrashIcon className="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/campaigns")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2Icon className="size-4 animate-spin" />}
          {mode === "new" ? "Create Campaign" : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
