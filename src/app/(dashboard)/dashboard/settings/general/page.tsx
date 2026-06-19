'use client'
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
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
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="name">
          Name
        </label>
        <Input id="name" value={values.name} onChange={handleChange("name")} />
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
      const { data } = await api.post<CompanyInfo>("/api/companyinfo/admin", emptyForm);
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
        <CompanyInfoForm info={info} onUpdated={handleUpdated} />
      </section>
    </div>
  );
}
