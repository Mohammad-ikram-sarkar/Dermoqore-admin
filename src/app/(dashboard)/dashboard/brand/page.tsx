"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { PlusIcon, PencilIcon, TrashIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { BrandService, type BrandType, type CreateBrandPayload, type UpdateBrandPayload } from "@/service/brand.service"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function page() {
  const [brands, setBrands] = useState<BrandType[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BrandType | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState<string | null>(null)
  const slugManuallyEdited = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await BrandService.findAll()
      setBrands(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brands")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!slugManuallyEdited.current) {
      setSlug(slugify(name))
    }
  }, [name])

  const resetForm = () => {
    setEditing(null)
    setName("")
    setSlug("")
    setError(null)
    slugManuallyEdited.current = false
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (brand: BrandType) => {
    setEditing(brand)
    setName(brand.name)
    setSlug(brand.slug)
    slugManuallyEdited.current = true
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (!name.trim()) {
        setError("Name is required")
        setSaving(false)
        return
      }
      if (editing) {
        const payload: UpdateBrandPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
        }
        await BrandService.update(editing.id, payload)
      } else {
        const payload: CreateBrandPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
        }
        await BrandService.create(payload)
      }
      setOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save brand")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (brand: BrandType) => {
    const confirmed = window.confirm(`Delete "${brand.name}"? This cannot be undone.`)
    if (!confirmed) return
    setError(null)
    try {
      await BrandService.remove(brand.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete brand")
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Brands</h1>
          <p className="text-sm text-muted-foreground">Manage product brands</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <Button variant="default" size="sm" onClick={openCreate}>
            <PlusIcon className="size-3.5" />
            <span>Create</span>
          </Button>
          <SheetContent side="right" showCloseButton>
            <form onSubmit={handleSubmit} className="space-y-5">
              <SheetHeader>
                <SheetTitle>{editing ? "Edit Brand" : "New Brand"}</SheetTitle>
                <SheetDescription>
                  {editing ? "Update brand details below." : "Create a new product brand."}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Slug</label>
                  <Input value={slug} onChange={(e) => { setSlug(e.target.value); slugManuallyEdited.current = true }} placeholder="e.g. my-brand" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" type="button" disabled={saving} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="default" type="submit" disabled={saving}>
                  {saving && <Loader2Icon className="size-3.5 animate-spin" />}
                  <span>{editing ? "Save changes" : "Create"}</span>
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Loading brands...
                  </span>
                </td>
              </tr>
            )}
            {!loading && brands.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No brands yet. Create one to get started.
                </td>
              </tr>
            )}
            {!loading &&
              brands.map((brand) => (
                <tr key={brand.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{brand.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{brand.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{brand.products?.length ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(brand.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(brand)}>
                        <PencilIcon className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(brand)}>
                        <TrashIcon className="size-3.5 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
