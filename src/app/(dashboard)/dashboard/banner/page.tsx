'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Eye,
  Edit3,
  Trash2,
  Plus,
  Upload,
  Check,
  Globe,
  Smartphone,
  Monitor,
  MoreVertical,
  ArrowUpRight,
  Tag,
  AlignLeft,
  Image,
  ToggleLeft,
  ToggleRight,
  X,
  RefreshCw,
  Users,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BannerService, ClientService } from "@/service/banner.service"
import type { BannerType, ClientType } from "@/service/banner.type"

const imageTypes = [
  { id: "hero",        label: "Hero Product",  icon: "🧴", desc: "Full product showcase" },
  { id: "lifestyle",   label: "Lifestyle",     icon: "✨", desc: "In-context usage"      },
  { id: "ingredient",  label: "Ingredient",    icon: "🌿", desc: "Key ingredient focus"  },
  { id: "before-after",label: "Before / After",icon: "🔁", desc: "Results split view"    },
]

export default function BannerAdmin() {
  const [clients,            setClients]            = useState<ClientType[]>([])
  const [banners,            setBanners]            = useState<BannerType[]>([])
  const [selectedClient,     setSelectedClient]     = useState<string | null>(null)
  const [selectedImageType,  setSelectedImageType]  = useState("hero")
  const [selectedDevice,     setSelectedDevice]     = useState("desktop")
  const [activeBanner,       setActiveBanner]       = useState<BannerType | null>(null)
  const [editMode,           setEditMode]           = useState(false)
  const [loading,            setLoading]            = useState(true)
  const [saving,             setSaving]             = useState(false)
  const [uploadedImage,      setUploadedImage]      = useState<string | null>(null)
  const [uploadFile,         setUploadFile]         = useState<File | null>(null)
  const [error,              setError]              = useState<string | null>(null)
  const [showClientForm,     setShowClientForm]     = useState(false)
  const [newClientName,      setNewClientName]      = useState("")
  const [newClientSegment,   setNewClientSegment]   = useState("")
  const [creatingClient,     setCreatingClient]     = useState(false)
  const [pendingBannerAfterClient, setPendingBannerAfterClient] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editTag, setEditTag] = useState("")
  const [editClientId, setEditClientId] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [clientsData, bannersData] = await Promise.all([
        ClientService.findAll(),
        BannerService.findAll(),
      ])
      setClients(clientsData)
      setBanners(bannersData)
      if (!activeBanner && bannersData.length > 0) {
        setActiveBanner(bannersData[0])
        setSelectedImageType(bannersData[0].imageType)
        setEditTitle(bannersData[0].title)
        setEditTag(bannersData[0].tag)
        setEditClientId(bannersData[0].clientId)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [activeBanner])

  useEffect(() => { loadData() }, [loadData])

  const filteredBanners = selectedClient
    ? banners.filter((b) => b.clientId === selectedClient)
    : banners
  const selectedClientObj = clients.find((c) => c.id === selectedClient)

  const totalBanners = banners.length
  const liveBanners = banners.filter((b) => b.status === "Live").length

  function selectBanner(banner: BannerType) {
    setActiveBanner(banner)
    setSelectedImageType(banner.imageType)
    setUploadedImage(null)
    setUploadFile(null)
    setEditMode(false)
    setEditTitle(banner.title)
    setEditTag(banner.tag)
    setEditClientId(banner.clientId)
  }

  async function handleCreateClient() {
    setError(null)
    if (!newClientName.trim() || !newClientSegment.trim()) {
      setError("Client name and segment are required")
      return
    }
    setCreatingClient(true)
    try {
      const client = await ClientService.create({
        name: newClientName.trim(),
        segment: newClientSegment.trim(),
        avatar: newClientName.slice(0, 2).toUpperCase(),
        color: "bg-amber-100 text-amber-800",
      })
      setClients((prev) => [...prev, client])
      setNewClientName("")
      setNewClientSegment("")
      setShowClientForm(false)
      setSelectedClient(client.id)

      // If "New Banner" triggered this flow, auto-create the banner now
      if (pendingBannerAfterClient) {
        setPendingBannerAfterClient(false)
        await doCreateBanner(client.id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create client")
    } finally {
      setCreatingClient(false)
    }
  }

  async function handleCreate() {
    setError(null)
    if (!clients.length) {
      // No clients yet — open the inline client form instead of showing an error
      setShowClientForm(true)
      setPendingBannerAfterClient(true)
      return
    }
    await doCreateBanner(clients[0].id)
  }

  async function doCreateBanner(clientId: string) {
    try {
      const banner = await BannerService.create({
        title: "New Banner",
        tag: "NEW BANNER",
        imageType: "hero",
        clientId,
      })
      setBanners((prev) => [banner, ...prev])
      selectBanner(banner)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create banner")
    }
  }

  async function handleSave() {
    if (!activeBanner) return
    setSaving(true)
    try {
      const updated = await BannerService.update(activeBanner.id, {
        title: editTitle,
        tag: editTag,
        imageType: selectedImageType,
        clientId: editClientId,
      })
      setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setActiveBanner(updated)
      setEditMode(false)
      if (uploadFile) {
        await BannerService.uploadImage(updated.id, uploadFile)
        await loadData()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update banner")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!activeBanner) return
    try {
      await BannerService.remove(activeBanner.id)
      const remaining = banners.filter((b) => b.id !== activeBanner.id)
      setBanners(remaining)
      if (remaining.length > 0) {
        selectBanner(remaining[0])
      } else {
        setActiveBanner(null)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete banner")
    }
  }

  async function handleToggleActive() {
    if (!activeBanner) return
    try {
      const updated = await BannerService.update(activeBanner.id, {
        isActive: !activeBanner.isActive,
      })
      setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setActiveBanner(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle banner")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setUploadedImage(URL.createObjectURL(file))
  }

  function handleRemoveImage() {
    setUploadedImage(null)
    setUploadFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading banners…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-background overflow-hidden relative">

      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 px-5 py-2 flex items-center justify-between">
          <span className="text-[13px] text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Client panel ─────────────────────────────────────────────────── */}
      <aside className="w-[200px] border-r border-border flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Clients</p>
          <button
            onClick={() => { setShowClientForm(!showClientForm); setError(null); setPendingBannerAfterClient(false) }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {showClientForm && (
          <div className="p-3 border-b border-border space-y-2 bg-accent/20">
            {pendingBannerAfterClient && (
              <p className="text-[11px] text-muted-foreground leading-snug">
                No clients yet. Create one to continue.
              </p>
            )}
            <Input
              placeholder="Client name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="text-[12px] h-8"
            />
            <Input
              placeholder="Segment (e.g. Premium Skincare)"
              value={newClientSegment}
              onChange={(e) => setNewClientSegment(e.target.value)}
              className="text-[12px] h-8"
            />
            <div className="flex gap-1.5">
              <Button size="xs" variant="default" onClick={handleCreateClient} disabled={creatingClient} className="flex-1">
                {creatingClient ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Add
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setShowClientForm(false)}>
                <X size={12} />
              </Button>
            </div>
          </div>
        )}

        <nav className="p-2 space-y-0.5 flex-1">
          <button
            onClick={() => setSelectedClient(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-[13px] transition-colors ${
              selectedClient === null ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            <Globe size={13} />
            All Clients
          </button>

          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClient(c.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-[13px] transition-colors ${
                selectedClient === c.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <span className={`w-5 h-5 rounded text-[9px] flex items-center justify-center shrink-0 font-medium ${c.color}`}>
                {c.avatar}
              </span>
              <span className="truncate">{c.name}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{c._count?.banners ?? 0}</span>
            </button>
          ))}
        </nav>

        {selectedClientObj && (
          <div className="p-3 border-t border-border">
            <div className={`rounded px-3 py-2 ${selectedClientObj.color}`}>
              <p className="text-[11px] uppercase tracking-widest">{selectedClientObj.segment}</p>
              <p className="text-[12px] mt-0.5">{selectedClientObj._count?.banners ?? 0} banners</p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-14 bg-background border-b border-border px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-wide">Banner Management</h1>
            <span className="text-muted-foreground text-[13px]">/</span>
            <span className="text-muted-foreground text-xs">Sections</span>
          </div>
          <Button size="sm" variant="default" onClick={handleCreate}>
            <Plus />
            New Banner
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Stats ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Banners", value: String(totalBanners), change: `${totalBanners} total` },
              { label: "Live Banners",  value: String(liveBanners),  change: `${totalBanners ? Math.round(liveBanners / totalBanners * 100) : 0}% active` },
              { label: "Clients",       value: String(clients.length),  change: "Registered clients"},
            ].map((s) => (
              <div key={s.label} className="rounded border border-border bg-background p-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-semibold mt-1">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight size={10} className="text-emerald-500" />
                  {s.change}
                </p>
              </div>
            ))}
          </div>

          {/* ── Banner list ────────────────────────────────────────────── */}
          <div className="rounded border border-border bg-background overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-medium">
                {selectedClientObj ? selectedClientObj.name : "All"} — Banners
              </p>
              <span className="text-[11px] text-muted-foreground">{filteredBanners.length} results</span>
            </div>

            <div className="divide-y divide-border">
              {filteredBanners.length === 0 && (
                <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  No banners found
                </div>
              )}
              {filteredBanners.map((banner) => (
                <button
                  key={banner.id}
                  onClick={() => selectBanner(banner)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent/40 ${
                    activeBanner?.id === banner.id ? "bg-accent/60" : ""
                  }`}
                >
                  <img
                    src={banner.imageUrl ?? "https://placehold.co/120x60?text=No+Image"}
                    alt={banner.title}
                    className="w-20 h-10 object-cover rounded border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{banner.tag}</p>
                    <p className="text-[13px] font-medium truncate">{banner.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{banner.client.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">{new Date(banner.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${
                      banner.status === "Live" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {banner.status}
                    </span>
                    <MoreVertical size={13} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Banner Editor ──────────────────────────────────────────── */}
          {activeBanner && (
          <div className="rounded border border-border bg-background overflow-hidden">

            {/* Editor header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit3 size={13} className="text-muted-foreground" />
                <p className="text-sm font-medium">Banner Editor — {activeBanner.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleActive}
                  className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {activeBanner.isActive
                    ? <ToggleRight size={16} className="text-emerald-500" />
                    : <ToggleLeft  size={16} />}
                  {activeBanner.isActive ? "Active" : "Inactive"}
                </button>
                <Button
                  size="xs"
                  variant={editMode ? "default" : "outline"}
                  onClick={() => {
                    if (editMode) {
                      handleSave()
                    } else {
                      setEditMode(true)
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? (
                    <><Loader2 size={12} className="animate-spin mr-1" /> Saving</>
                  ) : editMode ? (
                    "Save Changes"
                  ) : (
                    "Edit Banner"
                  )}
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center mb-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Preview</p>
                <div className="flex items-center gap-1 ml-auto">
                  {[{ id: "desktop", icon: Monitor }, { id: "mobile", icon: Smartphone }].map(({ id, icon: Icon }) => (
                    <Button
                      key={id}
                      size="icon-xs"
                      variant={selectedDevice === id ? "secondary" : "ghost"}
                      onClick={() => setSelectedDevice(id)}
                    >
                      <Icon />
                    </Button>
                  ))}
                </div>
              </div>

              <div
                className={`relative overflow-hidden rounded border border-border bg-[#F5EDE3] transition-all ${
                  selectedDevice === "mobile" ? "max-w-[320px] mx-auto" : "w-full"
                }`}
                style={{ minHeight: selectedDevice === "mobile" ? 180 : 220 }}
              >
                <img
                  src={uploadedImage ?? activeBanner.imageUrl ?? "https://placehold.co/600x260?text=No+Image"}
                  alt={activeBanner.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div
                  className="relative z-10 p-6 flex flex-col justify-between h-full"
                  style={{ minHeight: selectedDevice === "mobile" ? 180 : 220 }}
                >
                  <div className="flex justify-between items-start">
                    <div className={selectedDevice === "mobile" ? "max-w-[180px]" : "max-w-xs"}>
                      <p className="text-[9px] tracking-[0.2em] text-stone-500 uppercase mb-2">{activeBanner.tag}</p>
                      <p className={`text-stone-800 leading-tight ${selectedDevice === "mobile" ? "text-[18px]" : "text-[24px]"}`}>
                        {activeBanner.title}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-2">
                        {activeBanner.description ?? "Target dark spots, uneven tone and repair your skin barrier."}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button className="bg-stone-900 text-white text-[10px] px-3 py-1.5 rounded-sm tracking-wider">SHOP NOW</button>
                        <button className="border border-stone-400 text-stone-700 text-[10px] px-3 py-1.5 rounded-sm tracking-wider">FIND YOUR SERUM</button>
                      </div>
                    </div>
                    {selectedDevice !== "mobile" && (
                      <div className="text-right">
                        <p className="text-[8px] tracking-[0.15em] text-stone-400 uppercase">Clinical Formulas</p>
                        <p className="text-[8px] tracking-[0.15em] text-stone-400 uppercase">Visible Results</p>
                      </div>
                    )}
                  </div>
                  {selectedDevice !== "mobile" && (
                    <div className="flex gap-4 mt-4">
                      {["Dermatologically Inspired", "Transparent Ingredients", "Alcohol Free"].map((f) => (
                        <div key={f} className="flex items-center gap-1">
                          <Check size={9} className="text-stone-500" />
                          <span className="text-[9px] text-stone-500">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Editor controls */}
            <div className="grid grid-cols-2 divide-x divide-border">

              {/* ── Left: Client / content ── */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Client Section</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Client</Label>
                  <select
                    className="h-9 w-full border border-border bg-background rounded px-3 text-[13px] outline-none focus:border-ring transition-colors disabled:opacity-60"
                    value={editClientId}
                    disabled={!editMode}
                    onChange={(e) => setEditClientId(e.target.value)}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Segment Tag</Label>
                  <div className="relative">
                    <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      disabled={!editMode}
                      className="pl-8 text-[13px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Headline</Label>
                  <div className="relative">
                    <AlignLeft size={12} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                    <textarea
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={!editMode}
                      rows={2}
                      className="w-full pl-8 pr-3 py-2 text-[13px] border border-border rounded bg-background outline-none resize-none focus:border-ring transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${
                    activeBanner.status === "Live" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {activeBanner.status}
                  </span>
                </div>
              </div>

              {/* ── Right: Image type + upload ── */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Image size={13} className="text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Image Type</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {imageTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedImageType(type.id)}
                      disabled={!editMode}
                      className={`relative flex flex-col items-start gap-1 p-3 rounded border text-left transition-all ${
                        selectedImageType === type.id
                          ? "border-foreground bg-foreground/5"
                          : "border-border bg-muted/30 hover:border-foreground/30"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <span className="text-base">{type.icon}</span>
                      <span className="text-[12px] font-medium">{type.label}</span>
                      <span className="text-[10px] text-muted-foreground">{type.desc}</span>
                      {selectedImageType === type.id && (
                        <span className="absolute top-2 right-2">
                          <Check size={10} className="text-foreground" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Upload zone */}
                <div
                  className={`relative border-2 border-dashed border-border rounded overflow-hidden bg-muted/30 hover:border-foreground/30 transition-colors group ${
                    editMode ? "cursor-pointer" : "cursor-default"
                  }`}
                  style={{ minHeight: 130 }}
                  onClick={() => editMode && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={!editMode}
                  />

                  {uploadedImage ? (
                    <>
                      <img
                        src={uploadedImage}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                        style={{ minHeight: 130 }}
                      />
                      {editMode && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                          >
                            <RefreshCw />
                            Replace
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage() }}
                          >
                            <X />
                            Remove
                          </Button>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white backdrop-blur-sm">
                        Custom image
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={activeBanner.imageUrl ?? "https://placehold.co/600x260?text=No+Image"}
                        alt="Current banner"
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                      />
                      <div className="relative z-10 flex flex-col items-center justify-center gap-2 py-8">
                        <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                          <Upload size={14} className="text-muted-foreground" />
                        </div>
                        <p className="text-[12px] font-medium">Upload banner image</p>
                        <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP · max 4MB</p>
                        {editMode && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                          >
                            Browse Files
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Visible on */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={12} className="text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">Visible on</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[{ id: "desktop", icon: Monitor, label: "Desktop" }, { id: "mobile", icon: Smartphone, label: "Mobile" }].map(
                      ({ id, icon: Icon, label }) => (
                        <Button
                          key={id}
                          size="xs"
                          variant={selectedDevice === id ? "default" : "outline"}
                          onClick={() => setSelectedDevice(id)}
                        >
                          <Icon />
                          {label}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-t border-border">
              <Button size="xs" variant="destructive" onClick={handleDelete}>
                <Trash2 />
                Delete Banner
              </Button>
              <div className="flex items-center gap-2">
                <Button size="xs" variant="outline" onClick={() => { setEditMode(false); if (activeBanner) { setEditTitle(activeBanner.title); setEditTag(activeBanner.tag); setEditClientId(activeBanner.clientId); setUploadedImage(null); setUploadFile(null) } }}>Discard</Button>
                <Button size="xs" variant="default" onClick={async () => {
                  setError(null)
                  if (!activeBanner) return
                  try {
                    const updated = await BannerService.update(activeBanner.id, {
                      title: editTitle, tag: editTag, imageType: selectedImageType, clientId: editClientId, status: "Live",
                    })
                    setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
                    setActiveBanner(updated)
                    setEditMode(false)
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : "Failed to publish banner")
                  }
                }}>Publish Banner</Button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
