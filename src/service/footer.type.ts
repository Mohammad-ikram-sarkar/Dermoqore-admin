export interface FooterLink {
  id: string;
  label: string;
  href: string;
  sectionId: string;
}

export interface FooterSection {
  id: string;
  title: string;
  footerId: string;
  links: FooterLink[];
}

export interface FooterSocial {
  id: string;
  name: string;
  icon?: string | null;
  url: string;
  footerId: string;
}

export interface FooterType {
  id: string;
  logo?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  copyright?: string | null;
  createdAt: string;
  updatedAt: string;
  socialLinks: FooterSocial[];
  sections: FooterSection[];
}

export interface CreateFooterLinkPayload {
  label: string;
  href: string;
}

export interface CreateFooterSectionPayload {
  title: string;
  links?: CreateFooterLinkPayload[];
}

export interface CreateFooterSocialPayload {
  name: string;
  icon?: string;
  url: string;
}

export interface CreateFooterPayload {
  logo?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  copyright?: string;
  socialLinks?: CreateFooterSocialPayload[];
  sections?: CreateFooterSectionPayload[];
}

export interface UpdateFooterLinkPayload {
  label?: string;
  href?: string;
}

export interface UpdateFooterSectionPayload {
  title?: string;
  links?: UpdateFooterLinkPayload[];
}

export interface UpdateFooterSocialPayload {
  name?: string;
  icon?: string;
  url?: string;
}

export interface UpdateFooterPayload {
  logo?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  copyright?: string;
  socialLinks?: UpdateFooterSocialPayload[];
  sections?: UpdateFooterSectionPayload[];
}
