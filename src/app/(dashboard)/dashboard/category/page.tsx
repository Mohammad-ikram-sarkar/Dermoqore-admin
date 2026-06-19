"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CategoryService, type CategoryTree, type CreateCategoryPayload, type UpdateCategoryPayload } from "@/service/category.service"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function findById(categories: CategoryTree[], id: string): CategoryTree | undefined {
  for (const category of categories) {
    if (category.id === id) return category
    if (category.children) {
      const found = findById(category.children, id)
      if (found) return found
    }
  }
  return undefined
}

export default function page() {
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryTree | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [parentId, setParentId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [parentOptions, setParentOptions] = useState<CategoryTree[]>([])
  const slugManuallyEdited = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await CategoryService.findAll()
      setCategories(data)
      setParentOptions(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories")
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
    setParentId("")
    setError(null)
    slugManuallyEdited.current = false
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (category: CategoryTree) => {
    setEditing(category)
    setName(category.name)
    setSlug(category.slug)
    setParentId(category.parentId ?? "")
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
      const payload: CreateCategoryPayload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        parentId: parentId || undefined,
      }
      if (editing) {
        const updatePayload: UpdateCategoryPayload = {
          name: name.trim(),
          slug: slug.trim() || undefined,
          parentId: parentId || undefined,
        }
        await CategoryService.update(editing.id, updatePayload)
      } else {
        await CategoryService.create(payload)
      }
      setOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: CategoryTree) => {
    const confirmed = window.confirm(`Delete "${category.name}"? This cannot be undone.`)
    if (!confirmed) return
    setError(null)
    try {
      await CategoryService.remove(category.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category")
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage product category hierarchy</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <Button variant="default" size="sm" onClick={openCreate}>
            <PlusIcon className="size-3.5" />
            <span>Create</span>
          </Button>
          <SheetContent side="right" showCloseButton>
            <form onSubmit={handleSubmit} className="space-y-5">
              <SheetHeader>
                <SheetTitle>{editing ? "Edit Category" : "New Category"}</SheetTitle>
                <SheetDescription>
                  {editing ? "Update category details below." : "Create a new product category."}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Slug</label>
                  <Input value={slug} onChange={(e) => { setSlug(e.target.value); slugManuallyEdited.current = true }} placeholder="e.g. skin-care" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Parent</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="h-10 w-full border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-b-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive md:text-sm"
                  >
                    <option value="">None</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
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
              <th className="px-4 py-3 font-medium">Parent</th>
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
                    Loading categories...
                  </span>
                </td>
              </tr>
            )}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No categories yet. Create one to get started.
                </td>
              </tr>
            )}
            {!loading &&
              categories.map((category) => {
                const parent = category.parentId ? findById(categories, category.parentId) : undefined
                return (
                  <tr key={category.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {parent ? <span className="rounded bg-muted px-2 py-0.5">{parent.name}</span> : <span className="text-muted-foreground/70">None</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(category.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(category)}>
                          <PencilIcon className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(category)}>
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
