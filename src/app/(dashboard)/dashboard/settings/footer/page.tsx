'use client'
import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { FooterService } from "@/service/footer.service";
import type { FooterType } from "@/service/footer.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SocialLink {
  name: string;
  icon: string;
  url: string;
}

interface LinkItem {
  label: string;
  href: string;
}

interface SectionItem {
  title: string;
  links: LinkItem[];
}

interface FormValues {
  description: string;
  phone: string;
  email: string;
  address: string;
  copyright: string;
  socialLinks: SocialLink[];
  sections: SectionItem[];
}

const emptyForm: FormValues = {
  description: "",
  phone: "",
  email: "",
  address: "",
  copyright: "",
  socialLinks: [],
  sections: [],
};

function cleanPayload<T extends object>(obj: T): T {
  const cleaned = { ...obj } as T;
  for (const key of Object.keys(cleaned) as Array<keyof T>) {
    if (cleaned[key] === "") {
      cleaned[key] = undefined as T[keyof T];
    }
  }
  return cleaned;
}

function FooterForm({
  footer,
  onUpdated,
}: {
  footer: FooterType;
  onUpdated: (footer: FooterType) => void;
}) {
  const [values, setValues] = useState<FormValues>(() => ({
    description: footer.description ?? "",
    phone: footer.phone ?? "",
    email: footer.email ?? "",
    address: footer.address ?? "",
    copyright: footer.copyright ?? "",
    socialLinks: footer.socialLinks.map((s) => ({
      name: s.name,
      icon: s.icon ?? "",
      url: s.url,
    })),
    sections: footer.sections.map((sec) => ({
      title: sec.title,
      links: sec.links.map((l) => ({
        label: l.label,
        href: l.href,
      })),
    })),
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange =
    (key: keyof Omit<FormValues, "socialLinks" | "sections">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSocialChange = (index: number, key: keyof SocialLink) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => {
      const socialLinks = [...prev.socialLinks];
      socialLinks[index] = { ...socialLinks[index], [key]: e.target.value };
      return { ...prev, socialLinks };
    });
  };

  const addSocialLink = () => {
    setValues((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { name: "", icon: "", url: "" }],
    }));
  };

  const removeSocialLink = (index: number) => {
    setValues((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSectionChange = (index: number, key: keyof SectionItem) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => {
      const sections = [...prev.sections];
      sections[index] = { ...sections[index], [key]: e.target.value };
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setValues((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: "", links: [] }],
    }));
  };

  const removeSection = (index: number) => {
    setValues((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleLinkChange = (sectionIndex: number, linkIndex: number, key: keyof LinkItem) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => {
      const sections = [...prev.sections];
      const links = [...sections[sectionIndex].links];
      links[linkIndex] = { ...links[linkIndex], [key]: e.target.value };
      sections[sectionIndex] = { ...sections[sectionIndex], links };
      return { ...prev, sections };
    });
  };

  const addLink = (sectionIndex: number) => {
    setValues((prev) => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        links: [...sections[sectionIndex].links, { label: "", href: "" }],
      };
      return { ...prev, sections };
    });
  };

  const removeLink = (sectionIndex: number, linkIndex: number) => {
    setValues((prev) => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        links: sections[sectionIndex].links.filter((_, i) => i !== linkIndex),
      };
      return { ...prev, sections };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = cleanPayload(values);
      const updated = await FooterService.update(footer.id, payload);
      onUpdated(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update footer";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const updated = await FooterService.uploadLogo(footer.id, file);
      onUpdated(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload logo";
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form className="grid gap-8" onSubmit={handleSubmit}>
      {/* Logo */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Logo</label>
        {footer.logo && (
          <img
            src={footer.logo}
            alt="Footer logo"
            className="h-16 w-auto rounded border object-contain"
          />
        )}
        <Input type="file" accept="image/*" onChange={handleLogoUpload} />
        {isUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
      </div>

      {/* Basic info */}
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="description">Description</label>
        <Input id="description" value={values.description} onChange={handleChange("description")} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="phone">Phone</label>
        <Input id="phone" value={values.phone} onChange={handleChange("phone")} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <Input id="email" type="email" value={values.email} onChange={handleChange("email")} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="address">Address</label>
        <Input id="address" value={values.address} onChange={handleChange("address")} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="copyright">Copyright</label>
        <Input id="copyright" value={values.copyright} onChange={handleChange("copyright")} />
      </div>

      {/* Social Links */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Social Links</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {values.socialLinks.map((social, i) => (
          <div key={i} className="flex gap-2 items-start rounded border p-3">
            <div className="grid flex-1 gap-2">
              <Input placeholder="Name" value={social.name} onChange={handleSocialChange(i, "name")} />
              <Input placeholder="Icon (optional)" value={social.icon} onChange={handleSocialChange(i, "icon")} />
              <Input placeholder="URL" value={social.url} onChange={handleSocialChange(i, "url")} />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sections</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            <Plus className="h-4 w-4 mr-1" /> Add Section
          </Button>
        </div>
        {values.sections.map((section, si) => (
          <div key={si} className="grid gap-3 rounded border p-4">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2">
                <Input
                  placeholder="Section title"
                  value={section.title}
                  onChange={handleSectionChange(si, "title")}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(si)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 pl-4 border-l-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Links</span>
                <Button type="button" variant="outline" size="xs" onClick={() => addLink(si)}>
                  <Plus className="h-3 w-3 mr-1" /> Link
                </Button>
              </div>
              {section.links.map((link, li) => (
                <div key={li} className="flex gap-2 items-start">
                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <Input placeholder="Label" value={link.label} onChange={handleLinkChange(si, li, "label")} />
                    <Input placeholder="Href" value={link.href} onChange={handleLinkChange(si, li, "href")} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(si, li)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function FooterPage() {
  const [footer, setFooter] = useState<FooterType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  useEffect(() => {
    const loadFooter = async () => {
      try {
        const data = await FooterService.findAll();
        if (Array.isArray(data) && data.length > 0) {
          setFooter(data[0]);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load footer";
        console.error(message);
      } finally {
        setIsLoading(false);
      }
    };
    loadFooter();
  }, []);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      setCreationError(null);
      const payload = cleanPayload(emptyForm);
      const data = await FooterService.create(payload);
      setFooter(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create footer";
      setCreationError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdated = (updated: FooterType) => {
    setFooter(updated);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Footer</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!footer) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Footer</h1>
        <p className="text-sm text-muted-foreground">No footer found.</p>
        {creationError && <p className="text-sm text-destructive">{creationError}</p>}
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Footer"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Footer</h1>
        <p className="text-sm text-muted-foreground">Manage your footer settings.</p>
      </div>
      <section className="grid gap-6">
        <FooterForm footer={footer} onUpdated={handleUpdated} />
      </section>
    </div>
  );
}
