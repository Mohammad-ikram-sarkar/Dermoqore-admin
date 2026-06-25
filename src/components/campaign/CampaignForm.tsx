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
  type CampaignTheme,
  type WhySection,
  type Testimonial,
  type Feature,
  type Ingredient,
  type FaqItem,
  type CreateCampaignPayload,
} from "@/service/campaign.service"

type Product = { id: string; name: string; slug: string; price: number }

interface Props {
  initial?: Campaign
  products: Product[]
  mode: "new" | "edit"
}

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"

/* ── Icon keyword options (shared with client Features component) ─────── */
const ICON_OPTIONS: { keyword: string; label: string }[] = [
  { keyword: "spot", label: "Spot Reduction" },
  { keyword: "radiance", label: "Radiance / Brightness" },
  { keyword: "moisture", label: "Moisturize" },
  { keyword: "shield", label: "Protection / Shield" },
  { keyword: "leaf", label: "Natural / Herbal" },
  { keyword: "glow", label: "Glow" },
  { keyword: "sun", label: "Sun Care" },
  { keyword: "heart", label: "Self-Care / Love" },
  { keyword: "droplets", label: "Hydration" },
  { keyword: "sparkle", label: "Sparkle / Premium" },
]

/* ── Theme preset options ─────────────────────────────────────────────── */
const THEME_OPTIONS: { value: CampaignTheme; label: string; swatch: string }[] = [
  { value: "DEFAULT", label: "Default (Neutral)", swatch: "#171717" },
  { value: "EMERALD", label: "Emerald (Green)", swatch: "#059669" },
  { value: "ROSE", label: "Rose (Pink)", swatch: "#e11d48" },
  { value: "OCEAN", label: "Ocean (Blue)", swatch: "#0284c7" },
  { value: "AMBER", label: "Amber (Orange)", swatch: "#d97706" },
]

export default function CampaignForm({ initial, products, mode }: Props) {
  const router = useRouter()

  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "")
  const [productId, setProductId] = useState(initial?.productId ?? "")
  const [status, setStatus] = useState<Campaign["status"]>(initial?.status ?? "DRAFT")

  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "")
  const [videoTitle, setVideoTitle] = useState(initial?.videoTitle ?? "")

  const [campaignPrice, setCampaignPrice] = useState(String(initial?.campaignPrice ?? ""))
  const [comparePrice, setComparePrice] = useState(String(initial?.comparePrice ?? ""))

  const [offerBadge, setOfferBadge] = useState(initial?.offerBadge ?? "")
  const [ctaText, setCtaText] = useState(initial?.ctaText ?? "অর্ডার করুন")
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "")
  const [formTitle, setFormTitle] = useState(initial?.formTitle ?? "")

  const [whySections, setWhySections] = useState<WhySection[]>(
    initial?.whySections ?? [{ heading: "", items: [""] }]
  )
  const [benefits, setBenefits] = useState<string[]>(initial?.benefits ?? [""])
  const [included, setIncluded] = useState<string[]>(initial?.included ?? [""])
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    initial?.testimonials ?? [{ name: "", location: "", text: "" }]
  )

  /* ── New: Theme ── */
  const [theme, setTheme] = useState<CampaignTheme>(initial?.theme ?? "DEFAULT")

  /* ── New: Features ── */
  const [features, setFeatures] = useState<Feature[]>(
    initial?.features ?? [{ title: "", description: "", icon: "glow" }]
  )

  /* ── New: Ingredients ── */
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients ?? [{ name: "", image: "", description: "" }]
  )

  /* ── New: FAQs ── */
  const [faqs, setFaqs] = useState<FaqItem[]>(
    initial?.faqs ?? [{ question: "", answer: "" }]
  )

  const [heroImages, setHeroImages] = useState<{ url: string; alt: string; sortOrder: number }[]>(
    initial?.heroImages?.map((img) => ({ url: img.url, alt: img.alt ?? "", sortOrder: img.sortOrder })) ?? []
  )
  const [uploadingImage, setUploadingImage] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (mode === "new" && !slug) setSlug(slugify(v))
  }

  const handleImageUpload = useCallback(async (file: File) => {
    setUploadingImage(true)
    try {
      const { url } = await CampaignService.uploadImage(file)
      setHeroImages((prev) => [...prev, { url, alt: "", sortOrder: prev.length }])
    } catch {
      setError("Image upload failed")
    } finally {
      setUploadingImage(false)
    }
  }, [])

  const addWhySection = () => setWhySections((p) => [...p, { heading: "", items: [""] }])
  const removeWhySection = (i: number) => setWhySections((p) => p.filter((_, idx) => idx !== i))
  const updateWhySectionHeading = (i: number, v: string) =>
    setWhySections((p) => p.map((s, idx) => (idx === i ? { ...s, heading: v } : s)))
  const addWhyItem = (si: number) =>
    setWhySections((p) => p.map((s, idx) => (idx === si ? { ...s, items: [...s.items, ""] } : s)))
  const removeWhyItem = (si: number, ii: number) =>
    setWhySections((p) =>
      p.map((s, idx) => (idx === si ? { ...s, items: s.items.filter((_, i) => i !== ii) } : s))
    )
  const updateWhyItem = (si: number, ii: number, v: string) =>
    setWhySections((p) =>
      p.map((s, idx) => (idx === si ? { ...s, items: s.items.map((item, i) => (i === ii ? v : item)) } : s))
    )

  /* ── Features helpers ── */
  const addFeature = () => setFeatures((p) => [...p, { title: "", description: "", icon: "glow" }])
  const removeFeature = (i: number) => setFeatures((p) => p.filter((_, idx) => idx !== i))
  const updateFeature = (i: number, field: keyof Feature, v: string) =>
    setFeatures((p) => p.map((f, idx) => (idx === i ? { ...f, [field]: v } : f)))

  /* ── Ingredients helpers ── */
  const [uploadingIngredient, setUploadingIngredient] = useState(false)
  const addIngredient = () => setIngredients((p) => [...p, { name: "", image: "", description: "" }])
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, idx) => idx !== i))
  const updateIngredient = (i: number, field: keyof Ingredient, v: string) =>
    setIngredients((p) => p.map((ig, idx) => (idx === i ? { ...ig, [field]: v } : ig)))
  const handleIngredientImageUpload = useCallback(async (index: number, file: File) => {
    setUploadingIngredient(true)
    try {
      const { url } = await CampaignService.uploadImage(file)
      updateIngredient(index, "image", url)
    } catch {
      setError("Ingredient image upload failed")
    } finally {
      setUploadingIngredient(false)
    }
  }, [])

  /* ── FAQ helpers ── */
  const addFaq = () => setFaqs((p) => [...p, { question: "", answer: "" }])
  const removeFaq = (i: number) => setFaqs((p) => p.filter((_, idx) => idx !== i))
  const updateFaq = (i: number, field: keyof FaqItem, v: string) =>
    setFaqs((p) => p.map((faq, idx) => (idx === i ? { ...faq, [field]: v } : faq)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: CreateCampaignPayload = {
      title,
      slug: slug || slugify(title),
      subtitle: subtitle || undefined,
      productId,
      videoUrl: videoUrl || undefined,
      videoTitle: videoTitle || undefined,
      campaignPrice: campaignPrice ? Number(campaignPrice) : undefined,
      comparePrice: comparePrice ? Number(comparePrice) : undefined,
      whySections: whySections.filter((s) => s.heading || s.items.some(Boolean)),
      benefits: benefits.filter(Boolean),
      testimonials: testimonials.filter((t) => t.name || t.text),
      included: included.filter(Boolean),
      features: features.filter((f) => f.title),
      ingredients: ingredients.filter((ig) => ig.name && ig.image),
      faqs: faqs.filter((faq) => faq.question && faq.answer).map((faq, i) => ({ ...faq, sortOrder: i })),
      theme,
      offerBadge: offerBadge || undefined,
      ctaText: ctaText || undefined,
      phoneNumber: phoneNumber || undefined,
      formTitle: formTitle || undefined,
      status,
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

      {/* ── Basic Info ─────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Basic Info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input id="title" required value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. GlowPure Summer Sale" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <Input id="slug" required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="glowpure-summer-sale" />
            <p className="text-xs text-muted-foreground">Page will be at /campaign/{slug || "..."}</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Short campaign tagline" />
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

      {/* ── Theme ─────────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Theme</h2>
        <p className="text-xs text-muted-foreground">Choose the color palette for the campaign landing page.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {THEME_OPTIONS.map((t) => {
            const active = theme === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  active ? "border-foreground bg-muted/40 shadow-sm" : "border-border hover:border-foreground/30"
                }`}
              >
                <div
                  className={`size-8 rounded-full ring-2 ring-offset-2 ring-offset-card ${active ? "" : "ring-transparent"}`}
                  style={{ background: t.swatch }}
                />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Hero Images ─────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Hero Images</h2>
        <div className="flex flex-wrap gap-3">
          {heroImages.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img.url} alt={img.alt || "Hero"} className="h-24 w-24 rounded object-cover border border-border" />
              <button
                type="button"
                onClick={() => setHeroImages((p) => p.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-foreground/40 transition-colors">
            {uploadingImage ? <Loader2Icon className="size-5 animate-spin" /> : <UploadIcon className="size-5" />}
            <span className="mt-1 text-xs">Upload</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
          </label>
        </div>
      </section>

      {/* ── Video ─────────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Video Section</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="videoUrl">YouTube URL</Label>
            <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="videoTitle">Video Section Title</Label>
            <Input id="videoTitle" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="e.g. দেখুন কিভাবে কাজ করে" />
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Campaign Pricing</h2>
        <p className="text-xs text-muted-foreground">Override the product's regular price for this campaign. Leave blank to use the product's price.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="campaignPrice">Campaign Price (৳)</Label>
            <Input id="campaignPrice" type="number" min={0} value={campaignPrice} onChange={(e) => setCampaignPrice(e.target.value)} placeholder="890" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comparePrice">Compare-at Price (৳)</Label>
            <Input id="comparePrice" type="number" min={0} value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="1860" />
          </div>
        </div>
      </section>

      {/* ── CTA & Offer ─────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">CTA & Offer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="offerBadge">Offer Badge Text</Label>
            <Input id="offerBadge" value={offerBadge} onChange={(e) => setOfferBadge(e.target.value)} placeholder="সীমিত সময়ের অফার" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaText">CTA Button Text</Label>
            <Input id="ctaText" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="অর্ডার করুন" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="01700000000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="formTitle">Order Form Title</Label>
            <Input id="formTitle" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="এখনই অর্ডার করুন" />
          </div>
        </div>
      </section>

      {/* ── Features (icon cards) ─────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Feature Cards</h2>
            <p className="text-xs text-muted-foreground mt-1">Icon cards displayed on the campaign landing page (e.g. Reduces Spots, Boosts Radiance).</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <PlusIcon className="size-3.5" /> Add Feature
          </Button>
        </div>
        {features.map((f, i) => (
          <div key={i} className="rounded border border-border p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="grid gap-3 sm:grid-cols-3 flex-1">
                <Input
                  value={f.title}
                  onChange={(e) => updateFeature(i, "title", e.target.value)}
                  placeholder="Feature title (e.g. Reduces Spots)"
                />
                <select
                  value={f.icon}
                  onChange={(e) => updateFeature(i, "icon", e.target.value)}
                  className={selectCls}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.keyword} value={opt.keyword}>{opt.label}</option>
                  ))}
                </select>
                <Input
                  value={f.description}
                  onChange={(e) => updateFeature(i, "description", e.target.value)}
                  placeholder="Short description"
                />
              </div>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeFeature(i)}>
                <TrashIcon className="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* ── Ingredients ────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Ingredients</h2>
            <p className="text-xs text-muted-foreground mt-1">Ingredient cards with images shown on the campaign page.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
            <PlusIcon className="size-3.5" /> Add Ingredient
          </Button>
        </div>
        {ingredients.map((ig, i) => (
          <div key={i} className="rounded border border-border p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr] flex-1">
                <Input
                  value={ig.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  placeholder="Ingredient name (e.g. Aloe Vera)"
                />
                <Input
                  value={ig.description}
                  onChange={(e) => updateIngredient(i, "description", e.target.value)}
                  placeholder="Short description"
                />
                <div className="sm:col-span-2 flex items-center gap-3">
                  {ig.image && (
                    <img src={ig.image} alt={ig.name || "Ingredient"} className="size-12 rounded-lg object-cover border border-border" />
                  )}
                  <label className="flex h-12 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-muted-foreground hover:border-foreground/40 transition-colors">
                    {uploadingIngredient ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
                    <span className="ml-2 text-xs">{ig.image ? "Change" : "Upload Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => e.target.files?.[0] && handleIngredientImageUpload(i, e.target.files[0])}
                    />
                  </label>
                  {!ig.image && (
                    <span className="text-xs text-muted-foreground">or paste URL:</span>
                  )}
                  {!ig.image && (
                    <Input
                      value={ig.image}
                      onChange={(e) => updateIngredient(i, "image", e.target.value)}
                      placeholder="https://res.cloudinary.com/..."
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeIngredient(i)}>
                <TrashIcon className="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">FAQ</h2>
            <p className="text-xs text-muted-foreground mt-1">Frequently asked questions shown in the accordion on the campaign page.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addFaq}>
            <PlusIcon className="size-3.5" /> Add FAQ
          </Button>
        </div>
        {faqs.map((faq, i) => (
          <div key={i} className="rounded border border-border p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  placeholder={`Question ${i + 1}`}
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  placeholder="Answer..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeFaq(i)}>
                <TrashIcon className="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* ── Why Sections ─────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Why Choose (Sections)</h2>
          <Button type="button" variant="outline" size="sm" onClick={addWhySection}>
            <PlusIcon className="size-3.5" /> Add Section
          </Button>
        </div>
        {whySections.map((section, si) => (
          <div key={si} className="rounded border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={section.heading}
                onChange={(e) => updateWhySectionHeading(si, e.target.value)}
                placeholder="Section heading"
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeWhySection(si)}>
                <TrashIcon className="size-3.5 text-destructive" />
              </Button>
            </div>
            <div className="space-y-2 pl-3">
              {section.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateWhyItem(si, ii, e.target.value)}
                    placeholder={`Bullet point ${ii + 1}`}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeWhyItem(si, ii)}>
                    <XIcon className="size-3" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => addWhyItem(si)}>
                <PlusIcon className="size-3" /> Add Point
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Key Benefits</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setBenefits((p) => [...p, ""])}>
            <PlusIcon className="size-3.5" /> Add
          </Button>
        </div>
        {benefits.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={b} onChange={(e) => setBenefits((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder={`Benefit ${i + 1}`} className="flex-1" />
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => setBenefits((p) => p.filter((_, idx) => idx !== i))}>
              <XIcon className="size-3" />
            </Button>
          </div>
        ))}
      </section>

      {/* ── What's Included ──────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">What's Included</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setIncluded((p) => [...p, ""])}>
            <PlusIcon className="size-3.5" /> Add
          </Button>
        </div>
        {included.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item} onChange={(e) => setIncluded((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder={`Item ${i + 1}`} className="flex-1" />
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => setIncluded((p) => p.filter((_, idx) => idx !== i))}>
              <XIcon className="size-3" />
            </Button>
          </div>
        ))}
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="rounded border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Customer Testimonials</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setTestimonials((p) => [...p, { name: "", location: "", text: "" }])}>
            <PlusIcon className="size-3.5" /> Add
          </Button>
        </div>
        {testimonials.map((t, i) => (
          <div key={i} className="rounded border border-border p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="grid gap-3 sm:grid-cols-2 flex-1">
                <Input
                  value={t.name}
                  onChange={(e) => setTestimonials((p) => p.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Customer name"
                />
                <Input
                  value={t.location ?? ""}
                  onChange={(e) => setTestimonials((p) => p.map((x, idx) => (idx === i ? { ...x, location: e.target.value } : x)))}
                  placeholder="Location (optional)"
                />
                <textarea
                  value={t.text}
                  onChange={(e) => setTestimonials((p) => p.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))}
                  placeholder="Review text..."
                  rows={2}
                  className="sm:col-span-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => setTestimonials((p) => p.filter((_, idx) => idx !== i))}>
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
