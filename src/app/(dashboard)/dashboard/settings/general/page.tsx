"use client"
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CompanyInfo {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
}

interface CompanyInfoFormProps {
  info: CompanyInfo | null;
  onUpdated: (info: CompanyInfo) => void;
}

const emptyForm: Omit<CompanyInfo, "id"> = {
  name: "",
  description: "",
  address: "",
  phone: "",
  email: "",
};

function CompanyInfoForm({ info, onUpdated }: CompanyInfoFormProps) {
  const [values, setValues] = useState<Omit<CompanyInfo, "id">>(() => {
    if (!info) return { ...emptyForm };
    return {
      name: info.name ?? "",
      description: info.description ?? "",
      address: info.address ?? "",
      phone: info.phone ?? "",
      email: info.email ?? "",
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof typeof values) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !info?.id) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/companyinfo/admin/upload-logo/${info.id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Logo upload failed");
      const data = (await res.json()) as CompanyInfo;
      onUpdated(data);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!info?.id) return;
    try {
      setIsSaving(true);
      const { data } = await api.put<CompanyInfo>(`/api/companyinfo/admin/${info.id}`, values);
      onUpdated(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update company info";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!info) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading company information...</p>
      </div>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      {/* Logo + favicon */}
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="logo">
          Logo
        </label>
        <p className="text-xs text-muted-foreground">
          Upload your brand logo — it is also used as the storefront favicon.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {info.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.logoUrl} alt="Brand logo" className="size-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No logo</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Upload Logo"
              )}
            </Button>
            {info.logoUrl && (
              <a
                href={info.logoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                View current
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="name">
          Name
        </label>
        <Input id="name" value={values.name} onChange={handleChange("name")} />
        <p className="text-xs text-muted-foreground">Site name shown across the storefront.</p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <Input id="description" value={values.description} onChange={handleChange("description")} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="address">
          Address
        </label>
        <Input id="address" value={values.address} onChange={handleChange("address")} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="phone">
          Phone
        </label>
        <Input id="phone" value={values.phone} onChange={handleChange("phone")} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input id="email" type="email" value={values.email} onChange={handleChange("email")} />
      </div>

      <div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function GeneralPage() {
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const { data } = await api.get<CompanyInfo[]>("/api/companyinfo");
        if (Array.isArray(data) && data.length > 0) {
          setInfo(data[0]);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load company info";
        console.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyInfo();
  }, []);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      setCreationError(null);
      // Backend requires a non-empty `name` and a valid `email` (if provided),
      // so seed the create payload with sane defaults the admin can edit after.
      const { data } = await api.post<CompanyInfo>("/api/companyinfo/admin", {
        name: "Dermoqore",
        email: "admin@dermoqore.com",
      });
      setInfo(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create company info";
      setCreationError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdated = (updated: CompanyInfo) => {
    setInfo(updated);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">General</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">General</h1>
        <p className="text-sm text-muted-foreground">No company information found.</p>
        {creationError ? <p className="text-sm text-destructive">{creationError}</p> : null}
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Company Info"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">General</h1>
        <p className="text-sm text-muted-foreground">Manage your company information.</p>
      </div>

      <section className="grid gap-6">
        <CompanyInfoForm key={info.id} info={info} onUpdated={handleUpdated} />
      </section>
    </div>
  );
}
