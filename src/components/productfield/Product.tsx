"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, type FieldArrayWithId } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import * as Select from "@radix-ui/react-select";
import * as LabelPrimitive from "@radix-ui/react-label";
import {
  Plus,
  Trash2,
  ChevronDown,
  Check,
  ImagePlus,
  Tag,
  Package,
  FlaskConical,
  Droplets,
  Sparkles,
  Search,
  Save,
  Eye,
  Upload,
  X,
  Star,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { ProductService } from "@/service/product.service";
import { CategoryService } from "@/service/category.service";
import { BrandService } from "@/service/brand.service";
import type { CategoryTree } from "@/service/category.type";
import type { BrandType } from "@/service/brand.type";
import type { CreateProductPayload, UpdateProductPayload } from "@/service/product.type";
import TiptapEditor from "@/components/productfield/TiptapEditor";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProductStatus = "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";

type ImageItem = {
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
  file?: File;
  uploading?: boolean;
};

type ProductFormValues = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: number;
  skinType: string;
  status: ProductStatus;
  categoryId: string;
  brandId: string;
  images: ImageItem[];
  ingredients: { name: string; percentage: string }[];
  howToUse: { stepNumber: number; content: string }[];
  benefits: { title: string }[];
  seo: { metaTitle: string; metaDescription: string; metaKeyword: string };
};

const SKIN_TYPES = ["Normal", "Oily", "Dry", "Combination", "Sensitive", "All Skin Types"];

const STATUS_OPTIONS: { value: ProductStatus; label: string; color: string }[] = [
  { value: "DRAFT",        label: "Draft",        color: "bg-slate-100 text-slate-600"   },
  { value: "ACTIVE",       label: "Active",       color: "bg-emerald-100 text-emerald-700" },
  { value: "OUT_OF_STOCK", label: "Out of Stock", color: "bg-amber-100 text-amber-700"   },
  { value: "ARCHIVED",     label: "Archived",     color: "bg-red-100 text-red-600"       },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("token");
  const res = await fetch("/api/product/admin/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json() as { url: string };
  return data.url;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FormField({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <LabelPrimitive.Root className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </LabelPrimitive.Root>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

function InputField({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${className}`}
    />
  );
}

function TextareaField({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none ${className}`}
    />
  );
}

function SelectField({ value, onValueChange, placeholder, options, disabled }: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-black data-placeholder:text-slate-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
        <Select.Value placeholder={placeholder} />
        <Select.Icon><ChevronDown className="w-4 h-4 text-slate-400" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <Select.Viewport className="p-1">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-neutral-50 hover:text-neutral-900 data-highlighted:bg-neutral-50 data-highlighted:text-neutral-900"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator><Check className="w-4 h-4" /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SectionCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100">
          <Icon className="w-4 h-4 text-black" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function ImageUploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  }, [onFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-10 px-6 ${
        dragging ? "border-black bg-neutral-50" : "border-slate-200 bg-slate-50 hover:border-black/30 hover:bg-black/5"
      }`}
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${dragging ? "bg-neutral-200" : "bg-white border border-slate-200"}`}>
        <Upload className={`w-5 h-5 ${dragging ? "text-black" : "text-slate-400"}`} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">{dragging ? "Drop images here" : "Drag & drop images here"}</p>
        <p className="text-xs text-slate-400 mt-0.5">or <span className="text-black font-medium">browse files</span> — PNG, JPG, WEBP up to 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={handleChange} />
    </div>
  );
}

function ImageCard({
  item, index, total, onSetPrimary, onRemove, onAltChange,
}: {
  item: ImageItem; index: number; total: number;
  onSetPrimary: () => void; onRemove: () => void; onAltChange: (v: string) => void;
}) {
  return (
    <div className={`group relative rounded-xl border overflow-hidden bg-white transition-all ${
      item.isPrimary ? "border-black ring-2 ring-black/20" : "border-slate-200 hover:border-slate-300"
    }`}>
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        {item.uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50">
            <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400">Uploading…</p>
          </div>
        ) : item.url ? (
          <img src={item.url} alt={item.alt || "Product image"} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
        )}
        {item.isPrimary && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black px-2 py-0.5">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-[10px] font-semibold text-white">Primary</span>
          </div>
        )}
        {!item.uploading && (
          <button type="button" onClick={onRemove} disabled={total === 1}
            className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-white/90 shadow text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 disabled:hidden">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">
        <input value={item.alt} onChange={(e) => onAltChange(e.target.value)} placeholder="Alt text…"
          className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-black transition-all" />
        {!item.isPrimary && !item.uploading && (
          <button type="button" onClick={onSetPrimary}
            className="w-full rounded-md border border-slate-200 py-1 text-xs text-slate-500 hover:border-black/30 hover:text-black hover:bg-neutral-50 transition-all">
            Set as primary
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Product({ productId }: { productId?: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab]     = useState("basic");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [categories, setCategories]   = useState<CategoryTree[]>([]);
  const [brands, setBrands]           = useState<BrandType[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);

  // Load categories + brands on mount
  useEffect(() => {
    Promise.all([CategoryService.findAll(), BrandService.findAll()])
      .then(([cats, brs]) => { setCategories(cats); setBrands(brs); })
      .catch(() => {/* non-fatal, user can still type IDs */})
      .finally(() => setLoadingMeta(false));
  }, []);

  const { register, control, watch, setValue, getValues, handleSubmit, formState: { errors } } =
    useForm<ProductFormValues>({
      defaultValues: {
        name: "", slug: "", shortDescription: "", description: "",
        price: "", comparePrice: "", stock: 0, skinType: "",
        status: "DRAFT", categoryId: "", brandId: "",
        images: [],
        ingredients: [{ name: "", percentage: "" }],
        howToUse:    [{ stepNumber: 1, content: "" }],
        benefits:    [{ title: "" }],
        seo: { metaTitle: "", metaDescription: "", metaKeyword: "" },
      },
    });

  // Load existing product for editing
  useEffect(() => {
    if (!productId) return;
    ProductService.findOne(productId)
      .then((product) => {
        setValue("name", product.name);
        setValue("slug", product.slug);
        setValue("shortDescription", product.shortDescription ?? "");
        setValue("description", product.description ?? "");
        setValue("price", product.price.toString());
        setValue("comparePrice", product.comparePrice?.toString() ?? "");
        setValue("stock", product.stock);
        setValue("skinType", product.skinType ?? "");
        setValue("status", product.status);
        setValue("categoryId", product.categoryId);
        setValue("brandId", product.brandId ?? "");

        if (product.images.length > 0) {
          setValue(
            "images",
            product.images.map((img) => ({
              url: img.url,
              alt: img.alt ?? "",
              isPrimary: img.isPrimary,
              sortOrder: img.sortOrder,
            })),
          );
        }

        if (product.ingredients && product.ingredients.length > 0) {
          setValue("ingredients", product.ingredients.map((i) => ({ name: i.name, percentage: i.percentage ?? "" })));
        }

        if (product.howToUse && product.howToUse.length > 0) {
          setValue("howToUse", product.howToUse.map((s) => ({ stepNumber: s.stepNumber, content: s.content })));
        }

        if (product.benefits && product.benefits.length > 0) {
          setValue("benefits", product.benefits.map((b) => ({ title: b.title })));
        }

        if (product.seo) {
          setValue("seo", {
            metaTitle: product.seo.metaTitle ?? "",
            metaDescription: product.seo.metaDescription ?? "",
            metaKeyword: product.seo.metaKeyword ?? "",
          });
        }
      })
      .catch(() => {
        setSaveError("Failed to load product");
      })
      .finally(() => setLoadingProduct(false));
  }, [productId, setValue]);

  const imagesArray     = useFieldArray({ control, name: "images" });
  const ingredientsArr  = useFieldArray({ control, name: "ingredients" });
  const howToUseArr     = useFieldArray({ control, name: "howToUse" });
  const benefitsArr     = useFieldArray({ control, name: "benefits" });

  const nameValue      = watch("name");
  const statusValue    = watch("status");
  const imageFields    = watch("images");
  const currentStatus  = STATUS_OPTIONS.find((s) => s.value === statusValue) ?? STATUS_OPTIONS[0];

  // ── Image upload ──────────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: File[]) => {
    const currentImages = getValues("images");
    const hasNoImages   = currentImages.length === 0;
    const startIndex    = currentImages.length;

    files.forEach((file, i) => {
      imagesArray.append({
        url: "", alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        isPrimary: hasNoImages && i === 0,
        sortOrder: startIndex + i, file, uploading: true,
      });
    });

    await Promise.all(files.map(async (file, i) => {
      const idx = startIndex + i;
      try {
        const url = await uploadToCloudinary(file);
        setValue(`images.${idx}.url`, url);
        setValue(`images.${idx}.uploading`, false);
      } catch {
        imagesArray.remove(idx);
      }
    }));
  }, [imagesArray, getValues, setValue]);

  const setPrimary = (index: number) => {
    imageFields.forEach((_: ImageItem, i: number) => setValue(`images.${i}.isPrimary`, i === index));
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const onSubmit = async (data: ProductFormValues) => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const payload: UpdateProductPayload = {
        name:             data.name.trim(),
        slug:             data.slug.trim() || undefined,
        shortDescription: data.shortDescription || undefined,
        description:      data.description || undefined,
        price:            parseFloat(data.price) || 0,
        comparePrice:     data.comparePrice ? parseFloat(data.comparePrice) : undefined,
        stock:            data.stock,
        skinType:         data.skinType || undefined,
        status:           data.status,
        categoryId:       data.categoryId,
        brandId:          data.brandId || undefined,
        images: data.images
          .filter((img) => img.url && !img.uploading)
          .map((img, index) => ({
            url: img.url,
            alt: img.alt || undefined,
            isPrimary: img.isPrimary,
            sortOrder: index,
          })),
        ingredients: data.ingredients
          .filter((ingredient) => ingredient.name.trim())
          .map((ingredient) => ({
            name: ingredient.name.trim(),
            percentage: ingredient.percentage.trim() || null,
          })),
        howToUse: data.howToUse
          .filter((step) => step.content.trim())
          .map((step, index) => ({
            stepNumber: index + 1,
            content: step.content.trim(),
          })),
        benefits: data.benefits
          .filter((benefit) => benefit.title.trim())
          .map((benefit) => ({ title: benefit.title.trim() })),
        seo: {
          metaTitle: data.seo.metaTitle.trim() || null,
          metaDescription: data.seo.metaDescription.trim() || null,
          metaKeyword: data.seo.metaKeyword.trim() || null,
        },
      };

      if (productId) {
        await ProductService.update(productId, payload);
      } else {
        await ProductService.create(payload as CreateProductPayload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        router.push("/dashboard/products");
      }, 1500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "basic",   label: "Basic Info" },
    { id: "media",   label: "Media"      },
    { id: "details", label: "Details"    },
    { id: "seo",     label: "SEO"        },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-slate-50">

      {/* Topbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Products</p>
              <h1 className="text-sm font-semibold text-slate-800 truncate">{nameValue || (productId ? "Edit Product" : "New Product")}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-xs text-rose-600 max-w-[220px] truncate">{saveError}</span>
            )}
            {saveSuccess && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button type="button" onClick={() => router.push("/dashboard/products")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
            <button type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit">
            {TABS.map((tab) => (
              <Tabs.Trigger key={tab.id} value={tab.id}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-slate-500 transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:hover:text-slate-700">
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* ── Basic Info ────────────────────────────────────────────────── */}
          <Tabs.Content value="basic" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-4">
                <SectionCard title="General Information" icon={Package}>
                  <FormField label="Product Name" required error={errors.name?.message}>
                    <InputField
                      {...register("name", { required: "Name is required" })}
                      placeholder="e.g. Hydrating Vitamin C Serum"
                      onChange={(e) => {
                        register("name").onChange(e);
                        setValue("slug", slugify(e.target.value));
                      }}
                    />
                  </FormField>
                  <FormField label="Slug" required hint="Auto-generated from name. Used in the product URL.">
                    <InputField {...register("slug")} placeholder="hydrating-vitamin-c-serum" />
                  </FormField>
                  <FormField label="Short Description" hint="Brief summary shown in listings (max 160 chars).">
                    <InputField {...register("shortDescription")} placeholder="A lightweight serum that brightens and hydrates..." maxLength={160} />
                  </FormField>
                  <FormField label="Description" hint="Full product description shown on the product page.">
                    <Controller
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <TiptapEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Describe the product in detail…"
                          minHeight={220}
                        />
                      )}
                    />
                  </FormField>
                </SectionCard>

                <SectionCard title="Pricing & Inventory" icon={Tag}>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Price (Rp)" required error={errors.price?.message}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                        <InputField {...register("price", { required: "Price is required" })} className="pl-9" placeholder="0" type="number" min="0" step="0.01" />
                      </div>
                    </FormField>
                    <FormField label="Compare Price (Rp)" hint="Original price (shown crossed out).">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                        <InputField {...register("comparePrice")} className="pl-9" placeholder="0" type="number" min="0" step="0.01" />
                      </div>
                    </FormField>
                  </div>
                  <FormField label="Stock" required>
                    <InputField {...register("stock", { valueAsNumber: true })} placeholder="0" type="number" min="0" />
                  </FormField>
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard title="Status" icon={Check}>
                  <FormField label="Product Status">
                    <Controller control={control} name="status" render={({ field }) => (
                      <SelectField value={field.value} onValueChange={field.onChange} placeholder="Select status"
                        options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
                    )} />
                  </FormField>
                </SectionCard>

                <SectionCard title="Organisation" icon={Package}>
                  <FormField label="Category" required error={errors.categoryId?.message}>
                    <Controller control={control} name="categoryId"
                      rules={{ required: "Category is required" }}
                      render={({ field }) => (
                        <SelectField
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={loadingMeta ? "Loading…" : "Select category"}
                          disabled={loadingMeta}
                          options={categories.map((c) => ({ value: c.id, label: c.name }))}
                        />
                      )}
                    />
                  </FormField>
                  <FormField label="Brand">
                    <Controller control={control} name="brandId" render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={loadingMeta ? "Loading…" : "Select brand"}
                        disabled={loadingMeta}
                        options={brands.map((b) => ({ value: b.id, label: b.name }))}
                      />
                    )} />
                  </FormField>
                  <FormField label="Skin Type">
                    <Controller control={control} name="skinType" render={({ field }) => (
                      <SelectField value={field.value} onValueChange={field.onChange} placeholder="Select skin type"
                        options={SKIN_TYPES.map((s) => ({ value: s, label: s }))} />
                    )} />
                  </FormField>
                </SectionCard>
              </div>
            </div>
          </Tabs.Content>

          {/* ── Media ─────────────────────────────────────────────────────── */}
          <Tabs.Content value="media">
            <SectionCard title="Product Images" icon={ImagePlus}>
              <ImageUploadZone onFiles={handleFiles} />
              {imageFields.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {imageFields.length} image{imageFields.length !== 1 ? "s" : ""} •{" "}
                      <span className="text-black font-medium">
                        {imageFields.find((img: ImageItem) => img.isPrimary) ? "Primary set" : "No primary selected"}
                      </span>
                    </p>
                    <button type="button" onClick={() => imagesArray.replace([])}
                      className="text-xs text-rose-400 hover:text-rose-600 transition-colors">
                      Remove all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imageFields.map((item: ImageItem, index: number) => (
                      <ImageCard
                        key={(imagesArray.fields as FieldArrayWithId<ProductFormValues, "images">[]).at(index)?.id ?? index}
                        item={item} index={index} total={imageFields.length}
                        onSetPrimary={() => setPrimary(index)}
                        onRemove={() => {
                          imagesArray.remove(index);
                          const remaining = getValues("images");
                          if (item.isPrimary && remaining.length > 0) setValue("images.0.isPrimary", true);
                        }}
                        onAltChange={(v) => setValue(`images.${index}.alt`, v)}
                      />
                    ))}
                    <button type="button" onClick={() => document.getElementById("extra-upload-input")?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-black/30 hover:bg-black/5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-black transition-all">
                      <Plus className="w-5 h-5" />
                      <span className="text-xs font-medium">Add more</span>
                    </button>
                    <input id="extra-upload-input" type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
                      onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) handleFiles(files); e.target.value = ""; }} />
                  </div>
                </>
              )}
            </SectionCard>
          </Tabs.Content>

          {/* ── Details ───────────────────────────────────────────────────── */}
          <Tabs.Content value="details" className="space-y-4">
            <SectionCard title="Ingredients" icon={FlaskConical}>
              <p className="text-xs text-slate-400">List all active ingredients and their concentrations.</p>
              <div className="space-y-2">
                {ingredientsArr.fields.map((field: FieldArrayWithId<ProductFormValues, "ingredients">, index: number) => (
                  <div key={field.id} className="flex gap-3 items-center">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <InputField {...register(`ingredients.${index}.name`)} placeholder="e.g. Niacinamide" />
                      </div>
                      <InputField {...register(`ingredients.${index}.percentage`)} placeholder="e.g. 10%" />
                    </div>
                    <button type="button" onClick={() => ingredientsArr.remove(index)} disabled={ingredientsArr.fields.length === 1}
                      className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => ingredientsArr.append({ name: "", percentage: "" })}
                className="flex items-center gap-2 rounded-lg border border-dashed border-black/30 bg-neutral-50 px-4 py-2.5 text-sm text-black hover:bg-neutral-100 transition-colors w-full justify-center">
                <Plus className="w-4 h-4" /> Add Ingredient
              </button>
            </SectionCard>

            <SectionCard title="How To Use" icon={Droplets}>
              <p className="text-xs text-slate-400">Step-by-step usage instructions shown on the product page.</p>
              <div className="space-y-3">
                {howToUseArr.fields.map((field: FieldArrayWithId<ProductFormValues, "howToUse">, index: number) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 text-neutral-900 text-xs font-semibold shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <TextareaField {...register(`howToUse.${index}.content`)} placeholder={`Step ${index + 1}: e.g. Apply 2–3 drops...`} rows={2} />
                    </div>
                    <button type="button" onClick={() => howToUseArr.remove(index)} disabled={howToUseArr.fields.length === 1}
                      className="mt-1.5 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => howToUseArr.append({ stepNumber: howToUseArr.fields.length + 1, content: "" })}
                className="flex items-center gap-2 rounded-lg border border-dashed border-black/30 bg-neutral-50 px-4 py-2.5 text-sm text-black hover:bg-neutral-100 transition-colors w-full justify-center">
                <Plus className="w-4 h-4" /> Add Step
              </button>
            </SectionCard>

            <SectionCard title="Product Benefits" icon={Sparkles}>
              <p className="text-xs text-slate-400">Key benefits shown as highlights on the product page.</p>
              <div className="space-y-2">
                {benefitsArr.fields.map((field: FieldArrayWithId<ProductFormValues, "benefits">, index: number) => (
                  <div key={field.id} className="flex gap-3 items-center">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <InputField {...register(`benefits.${index}.title`)} placeholder="e.g. Brightens skin tone" />
                    </div>
                    <button type="button" onClick={() => benefitsArr.remove(index)} disabled={benefitsArr.fields.length === 1}
                      className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => benefitsArr.append({ title: "" })}
                className="flex items-center gap-2 rounded-lg border border-dashed border-black/30 bg-neutral-50 px-4 py-2.5 text-sm text-black hover:bg-neutral-100 transition-colors w-full justify-center">
                <Plus className="w-4 h-4" /> Add Benefit
              </button>
            </SectionCard>
          </Tabs.Content>

          {/* ── SEO ───────────────────────────────────────────────────────── */}
          <Tabs.Content value="seo" className="space-y-4">
            <SectionCard title="Search Engine Optimisation" icon={Search}>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 mb-2">
                <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Preview</p>
                <p className="text-sm text-blue-700 font-medium line-clamp-1">
                  {watch("seo.metaTitle") || watch("name") || "Product Title"}
                </p>
                <p className="text-xs text-emerald-700">yourstore.com/products/{watch("slug") || "product-slug"}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {watch("seo.metaDescription") || watch("shortDescription") || "Product description will appear here."}
                </p>
              </div>
              <FormField label="Meta Title" hint="Recommended: 50–60 characters.">
                <InputField {...register("seo.metaTitle")} placeholder="Best Vitamin C Serum for Glowing Skin | YourBrand" maxLength={60} />
              </FormField>
              <FormField label="Meta Description" hint="Recommended: 120–160 characters.">
                <TextareaField {...register("seo.metaDescription")} placeholder="Discover our bestselling vitamin C serum..." rows={3} maxLength={160} />
              </FormField>
              <FormField label="Meta Keywords" hint="Comma-separated keywords.">
                <InputField {...register("seo.metaKeyword")} placeholder="vitamin c serum, brightening serum, skincare" />
              </FormField>
            </SectionCard>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </form>
  );
}
