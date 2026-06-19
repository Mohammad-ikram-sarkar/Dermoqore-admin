"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { PlusIcon, PencilIcon, TrashIcon, Loader2Icon, ExternalLinkIcon, GripVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AnnouncementBarService,
  type AnnouncementBarType,
  type CreateAnnouncementBarPayload,
  type UpdateAnnouncementBarPayload,
} from "@/service/announcement-bar.service"

export default function Page() {
  const [items, setItems] = useState<AnnouncementBarType[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementBarType | null>(null)
  const [message, setMessage] = useState("")
  const [link, setLink] = useState("")
  const [order, setOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await AnnouncementBarService.findAll()
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load announcement bars")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setEditing(null)
    setMessage("")
    setLink("")
    setOrder(0)
    setIsActive(true)
    setError(null)
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (item: AnnouncementBarType) => {
    setEditing(item)
    setMessage(item.message)
    setLink(item.link ?? "")
    setOrder(item.order)
    setIsActive(item.isActive)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (!message.trim()) {
        setError("Message is required")
        setSaving(false)
        return
      }
      if (editing) {
        const payload: UpdateAnnouncementBarPayload = {
          message: message.trim(),
          link: link.trim() || undefined,
          order,
          isActive,
        }
        await AnnouncementBarService.update(editing.id, payload)
      } else {
        const payload: CreateAnnouncementBarPayload = {
          message: message.trim(),
          link: link.trim() || undefined,
          order,
          isActive,
        }
        await AnnouncementBarService.create(payload)
      }
      setOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save announcement bar")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: AnnouncementBarType) => {
    const confirmed = window.confirm(`Delete this announcement bar? This cannot be undone.`)
    if (!confirmed) return
    setError(null)
    try {
      await AnnouncementBarService.remove(item.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete announcement bar")
    }
  }

  const toggleActive = async (item: AnnouncementBarType) => {
    try {
      await AnnouncementBarService.update(item.id, { isActive: !item.isActive })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status")
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Announcement Bar</h1>
          <p className="text-sm text-muted-foreground">Manage announcement bar messages</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <Button variant="default" size="sm" onClick={openCreate}>
            <PlusIcon className="size-3.5" />
            <span>Create</span>
          </Button>
          <SheetContent side="right" showCloseButton>
            <form onSubmit={handleSubmit} className="space-y-5">
              <SheetHeader>
                <SheetTitle>{editing ? "Edit Announcement Bar" : "New Announcement Bar"}</SheetTitle>
                <SheetDescription>
                  {editing ? "Update announcement bar details below." : "Create a new announcement bar message."}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message *</label>
                  <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Free shipping on all orders!" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Link (optional)</label>
                  <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="e.g. /promotions" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Order</label>
                  <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Active
                  </label>
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
              <th className="w-12 px-4 py-3 text-center font-medium">#</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="w-20 px-4 py-3 text-center font-medium">Status</th>
              <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Loading...
                  </span>
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No announcement bars yet. Create one to get started.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 text-center text-muted-foreground">{item.order}</td>
                  <td className="max-w-xs truncate px-4 py-3 font-medium">{item.message}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:text-foreground">
                        {item.link}
                        <ExternalLinkIcon className="size-3" />
                      </a>
                    ) : (
                      <span className="text-xs italic text-muted-foreground/60">none</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${
                        item.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                        <PencilIcon className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(item)}>
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
