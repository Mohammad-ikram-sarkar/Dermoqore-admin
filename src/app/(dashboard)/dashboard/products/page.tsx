"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, PencilIcon, TrashIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductService, type ProductType } from "@/service/product.service"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:        { label: "Draft",        color: "bg-slate-100 text-slate-600" },
  ACTIVE:       { label: "Active",       color: "bg-emerald-100 text-emerald-700" },
  OUT_OF_STOCK: { label: "Out of Stock", color: "bg-amber-100 text-amber-700" },
  ARCHIVED:     { label: "Archived",     color: "bg-red-100 text-red-600" },
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ProductService.findAll()
      setProducts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (product: ProductType) => {
    const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`)
    if (!confirmed) return
    setError(null)
    try {
      await ProductService.remove(product.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product")
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalogue</p>
        </div>
        <Button variant="default" size="sm" onClick={() => router.push("/dashboard/products/new")}>
          <PlusIcon className="size-3.5" />
          <span>Create</span>
        </Button>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Loading products...
                  </span>
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No products yet. Create one to get started.
                </td>
              </tr>
            )}
            {!loading &&
              products.map((product) => {
                const status = STATUS_LABELS[product.status] ?? STATUS_LABELS.DRAFT
                return (
                  <tr key={product.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      Rp{Number(product.price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5">{product.category.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.brand ? (
                        <span className="rounded bg-muted px-2 py-0.5">{product.brand.name}</span>
                      ) : (
                        <span className="text-muted-foreground/70">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.stock}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                        >
                          <PencilIcon className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(product)}>
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
