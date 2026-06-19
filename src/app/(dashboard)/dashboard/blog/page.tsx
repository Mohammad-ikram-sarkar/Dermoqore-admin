"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { PlusIcon, PencilIcon, TrashIcon, Loader2Icon, StarIcon, Bold, Italic, Underline as UnderlineIcon, Strikethrough, ListIcon, ListOrdered, Quote, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, LinkIcon, ImageIcon, XIcon } from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ImageExtension from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BlogService, type BlogType, type CreateBlogPayload, type UpdateBlogPayload } from "@/service/blog.service"
import { CategoryService, type CategoryTree } from "@/service/category.service"

function RichTextEditor({ content, onChange }: { content: string, onChange: (val: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit, 
      ImageExtension, 
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true })
    ],
    content: content ? (() => { try { return JSON.parse(content) } catch { return content } })() : '',
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: 'w-full min-h-[200px] resize-y p-5 text-[15px] leading-relaxed focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground/60 prose prose-sm dark:prose-invert max-w-none'
      }
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    try {
      const url = await BlogService.uploadImage(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      console.error("Failed to upload image", err)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div className="rounded-xl border border-border/60 bg-white dark:bg-background overflow-hidden flex flex-col shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 px-3 py-2.5 bg-muted/10">
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }} data-active={editor.isActive('bold')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><Bold className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }} data-active={editor.isActive('italic')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><Italic className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }} data-active={editor.isActive('underline')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><UnderlineIcon className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }} data-active={editor.isActive('strike')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><Strikethrough className="size-4" /></Button>
        
        <div className="mx-1 h-5 w-px bg-border/60" />
        
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }} data-active={editor.isActive('heading', { level: 2 })} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><Heading2 className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }} data-active={editor.isActive('heading', { level: 3 })} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><Heading3 className="size-4" /></Button>
        
        <div className="mx-1 h-5 w-px bg-border/60" />

        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }} data-active={editor.isActive('bulletList')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><ListIcon className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }} data-active={editor.isActive('orderedList')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><ListOrdered className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }} data-active={editor.isActive('blockquote')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><Quote className="size-4" /></Button>
        
        <div className="mx-1 h-5 w-px bg-border/60" />

        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }} data-active={editor.isActive({ textAlign: 'left' })} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><AlignLeft className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }} data-active={editor.isActive({ textAlign: 'center' })} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><AlignCenter className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }} data-active={editor.isActive({ textAlign: 'right' })} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><AlignRight className="size-4" /></Button>

        <div className="mx-1 h-5 w-px bg-border/60" />

        <Button onClick={(e) => { e.preventDefault(); handleLink() }} data-active={editor.isActive('link')} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:text-foreground"><LinkIcon className="size-4" /></Button>
        <Button onClick={(e) => { e.preventDefault(); fileInputRef.current?.click() }} variant="ghost" type="button" size="icon-sm" className="rounded-md h-8 w-8 text-foreground/70 hover:bg-muted/60"><ImageIcon className="size-4" /></Button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      </div>
      <EditorContent editor={editor} className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-muted-foreground/30 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_a]:text-purple-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4" />
    </div>
  )
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Draft",     color: "bg-slate-100 text-slate-600" },
  PUBLISHED: { label: "Published", color: "bg-emerald-100 text-emerald-700" },
  ARCHIVED:  { label: "Archived",  color: "bg-red-100 text-red-600" },
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogType[]>([])
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BlogType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const slugManuallyEdited = useRef(false)

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [status, setStatus] = useState<string>("DRAFT")
  const [featured, setFeatured] = useState(false)
  const [categoryId, setCategoryId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [blogData, catData] = await Promise.all([
        BlogService.findAll({ limit: 50 }),
        CategoryService.findAll(),
      ])
      setBlogs(blogData.data)
      setCategories(catData)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blogs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!slugManuallyEdited.current) {
      setSlug(slugify(title))
    }
  }, [title])

  const resetForm = () => {
    setEditing(null)
    setTitle("")
    setSlug("")
    setExcerpt("")
    setContent("")
    setFeaturedImage("")
    setStatus("DRAFT")
    setFeatured(false)
    setCategoryId("")
    setError(null)
    slugManuallyEdited.current = false
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.")
      return
    }

    try {
      setLoading(true)
      const url = await BlogService.uploadImage(file)
      setFeaturedImage(url)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (blog: BlogType) => {
    setEditing(blog)
    setTitle(blog.title)
    setSlug(blog.slug)
    setExcerpt(blog.excerpt ?? "")
    setContent(typeof blog.content === "string" ? blog.content : JSON.stringify(blog.content))
    setFeaturedImage(blog.featuredImage ?? "")
    setStatus(blog.status)
    setFeatured(blog.featured)
    setCategoryId(blog.categoryId)
    slugManuallyEdited.current = true
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (!title.trim()) {
        setError("Title is required")
        setSaving(false)
        return
      }
      if (!categoryId) {
        setError("Category is required")
        setSaving(false)
        return
      }

      if (editing) {
        const payload: UpdateBlogPayload = {
          title: title.trim(),
          slug: slug.trim() || undefined,
          excerpt: excerpt.trim() || undefined,
          content: content.trim() || undefined,
          featuredImage: featuredImage.trim() || undefined,
          status: status as any,
          featured,
          categoryId,
        }
        await BlogService.update(editing.id, payload)
      } else {
        const payload: CreateBlogPayload = {
          title: title.trim(),
          slug: slug.trim() || undefined,
          excerpt: excerpt.trim() || undefined,
          content: content.trim() || undefined,
          featuredImage: featuredImage.trim() || undefined,
          status: status as any,
          featured,
          categoryId,
        }
        await BlogService.create(payload)
      }
      setOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save blog")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (blog: BlogType) => {
    const confirmed = window.confirm(`Delete "${blog.title}"? This cannot be undone.`)
    if (!confirmed) return
    setError(null)
    try {
      await BlogService.remove(blog.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete blog")
    }
  }

  const handleToggleFeatured = async (blog: BlogType) => {
    try {
      await BlogService.toggleFeatured(blog.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to toggle featured")
    }
  }

  const handleToggleStatus = async (blog: BlogType) => {
    const newStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    try {
      await BlogService.toggleStatus(blog.id, newStatus as any)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status")
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">Blog</h1>
          <p className="text-sm text-muted-foreground">Manage blog posts</p>
        </div>
        <Button variant="default" size="sm" className="rounded-md normal-case tracking-normal" onClick={openCreate}>
          <PlusIcon className="size-4 mr-1.5" />
          <span>Create</span>
        </Button>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-all" />
            <Dialog.Popup className="fixed left-[50%] top-[50%] z-50 flex max-h-[90vh] w-full max-w-4xl flex-col -translate-x-[50%] -translate-y-[50%] overflow-hidden rounded-xl bg-background shadow-2xl border border-border">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-background">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-black/5 text-black dark:bg-white/10 dark:text-white">
                    <PencilIcon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Quick Edit</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Refining: "{title || '10 Steps to Morning Radiant Skin'}"</p>
                  </div>
                </div>
                <Dialog.Close className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <XIcon className="size-5" />
                </Dialog.Close>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#fafafa] dark:bg-background/50">
                <form id="blog-form" onSubmit={handleSubmit} className="space-y-10">
                  
                  {/* GENERAL INFORMATION */}
                  <section className="space-y-5">
                    <h3 className="text-[13px] font-bold tracking-widest text-foreground/70 uppercase">General Information</h3>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[14px] text-foreground/90">Blog Title</label>
                        <Input 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                          className="rounded-lg h-12 border-border/60 bg-white dark:bg-background text-[15px] focus-visible:ring-black/20 focus-visible:border-black dark:focus-visible:ring-white/20 dark:focus-visible:border-white" 
                          placeholder="e.g. 10 Steps to Morning Radiant Skin" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[14px] text-foreground/90">Slug</label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                              <LinkIcon className="size-4" />
                            </div>
                            <Input 
                              value={slug} 
                              onChange={(e) => { setSlug(e.target.value); slugManuallyEdited.current = true }} 
                              className="rounded-lg pl-10 pr-24 h-12 border-border/60 bg-white dark:bg-background text-[15px] focus-visible:ring-black/20 focus-visible:border-black dark:focus-visible:ring-white/20 dark:focus-visible:border-white" 
                              placeholder="e.g. radiant-skin-morning-routine" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setSlug(slugify(title))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-foreground/80 hover:text-foreground"
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[14px] text-foreground/90">Category</label>
                          <div className="relative">
                            <select
                              value={categoryId}
                              onChange={(e) => setCategoryId(e.target.value)}
                              className="flex h-12 w-full appearance-none items-center justify-between rounded-lg border border-border/60 bg-white dark:bg-background px-3.5 py-2 text-[15px] ring-offset-background focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black dark:focus:ring-white/20 dark:focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select Category</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* FEATURED IMAGE */}
                  <section className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-bold tracking-widest text-foreground/70 uppercase">Featured Image</h3>
                    </div>
                    <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-white dark:bg-background p-8 text-center transition-colors hover:border-black/30 dark:hover:border-white/30 overflow-hidden">
                      {featuredImage ? (
                        <div className="flex w-full flex-col items-center">
                          <div className="relative mb-4 aspect-[1200/630] w-full max-w-sm overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                            <img src={featuredImage} alt="Featured preview" className="h-full w-full object-cover" />
                            <button 
                              type="button" 
                              onClick={(e) => { e.preventDefault(); setFeaturedImage(""); }}
                              className="absolute right-2 top-2 z-20 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black"
                            >
                              <XIcon className="size-4" />
                            </button>
                          </div>
                          <p className="text-[13px] text-muted-foreground">Image successfully attached</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-foreground/70">
                            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                          </div>
                          <p className="mb-1 text-[15px] font-semibold text-foreground/90">Click to upload or drag and drop</p>
                          <p className="mb-4 text-[13px] text-muted-foreground">
                            SVG, PNG, JPG or GIF (max. 5MB)
                            <br />
                            Recommended size: 1200 x 630px
                          </p>
                          <div className="flex w-full max-w-sm items-center gap-2">
                            <div className="h-px flex-1 bg-border/60"></div>
                            <span className="text-[12px] uppercase text-muted-foreground">or provide url</span>
                            <div className="h-px flex-1 bg-border/60"></div>
                          </div>
                          <div className="relative z-20 mt-4 w-full max-w-sm">
                            <Input 
                              value={featuredImage} 
                              onChange={(e) => setFeaturedImage(e.target.value)} 
                              className="h-10 w-full rounded-lg border-border/60 bg-white dark:bg-background text-[14px] focus-visible:border-black focus-visible:ring-black/20 dark:focus-visible:border-white dark:focus-visible:ring-white/20" 
                              placeholder="https://example.com/image.jpg" 
                            />
                          </div>
                          <input type="file" onChange={handleImageUpload} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" accept="image/*" />
                        </>
                      )}
                    </div>
                  </section>

                  {/* CONTENT EDITOR */}
                  <section className="space-y-5">
                    <h3 className="text-[13px] font-bold tracking-widest text-foreground/70 uppercase">Content Editor</h3>
                    <RichTextEditor content={content} onChange={setContent} />
                  </section>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                </form>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/50 px-6 py-4 bg-background">
                <button 
                  type="button" 
                  onClick={() => setOpen(false)} 
                  className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discard Changes
                </button>
                <div className="flex items-center gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={saving}
                    className="rounded-lg font-medium px-5 normal-case tracking-normal h-[42px] border-border/60 bg-white hover:bg-muted/40 dark:bg-background text-[14px]"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setStatus("DRAFT"); 
                      handleSubmit(e); 
                    }}
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    type="submit" 
                    form="blog-form"
                    disabled={saving}
                    className="rounded-lg font-medium px-6 normal-case tracking-normal h-[42px] bg-black hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 text-white shadow-sm border-0 text-[14px] flex items-center gap-2"
                    onClick={() => setStatus("PUBLISHED")}
                  >
                    {saving && <Loader2Icon className="size-4 animate-spin" />}
                    Publish Now
                  </Button>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Loading blogs...
                  </span>
                </td>
              </tr>
            )}
            {!loading && blogs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No blog posts yet. Create one to get started.
                </td>
              </tr>
            )}
            {!loading &&
              blogs.map((blog) => {
                const statusStyle = STATUS_LABELS[blog.status] ?? STATUS_LABELS.DRAFT
                return (
                  <tr key={blog.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{blog.title}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleStatus(blog)} className="cursor-pointer">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5">{blog.category.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{blog.author.name}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleFeatured(blog)} className="cursor-pointer">
                        <StarIcon className={`size-4 ${blog.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(blog)}>
                          <PencilIcon className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(blog)}>
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
