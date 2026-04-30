"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/navbar";
import { fetchJSON } from "@/lib/fetcher";

// ── Core types ──────────────────────────────────────────────────────────────
type ApiResponse<T> = { results: T[] };
type Category  = { id: number; name: string; slug: string; image_url?: string };
type Product   = { id: number; name: string; price: number; image_url: string; category_id: number; description: string };
type Banner    = { id: number; image_url: string; heading: string; button_text: string; sort_order: number; link_type?: "category"|"product"|"none"; link_value?: string };
type OrderItem = { id: number; product_name: string; price: number; quantity: number };
type Order     = { id: number; user_name: string; user_email: string; address: string; city: string; phone: string; total: number; status: string; created_at: string; items: OrderItem[] };
type CarouselItem = { id: number; image_url: string; link_type: string; link_value: string; sort_order: number };
type Brand     = { id: number; name: string; logo_url?: string; link_url?: string; sort_order: number };
type Toast     = { id: number; type: "success"|"error"|"info"; message: string };
type ConfirmState = { open: boolean; message: string; onConfirm: () => void };
type EditProductState = {
  open: boolean; product: Product | null;
  name: string; price: string; description: string; category_id: string;
  newImages: File[]; newImagePreviews: string[]; saving: boolean;
};

// ── Homepage section types ──────────────────────────────────────────────────
type SectionType = "promo_banners" | "category_carousel" | "brand_grid" | "category_circles";

interface HpBannerItem {
  id: string; image_url: string; heading: string; button_text: string;
  link_type: "category"|"product"|"none"; link_value: string; sort_order: number;
}
interface HpCarouselItem {
  id: string; image_url: string;
  link_type: "category"|"product"; link_value: string; sort_order: number;
}
interface HpBrandItem {
  id: string; name: string; logo_url?: string;
  link_type: "category"|"product"|"url"|"none"; link_value: string; sort_order: number;
}
type AnyHpItem = HpBannerItem | HpCarouselItem | HpBrandItem;

interface HomepageSection {
  id: number; type: SectionType; label: string;
  sort_order: number; enabled: number; items: string;
}

type ItemForm = {
  heading: string; button_text: string;
  bannerImage: File|null; bannerPreview: string;
  carouselImage: File|null; carouselPreview: string;
  brandName: string; brandLogo: File|null; brandLogoPreview: string;
  link_type: "category"|"product"|"url"|"none";
  link_value: string; sort_order: string; uploading: boolean;
};

const SECTION_META: Record<SectionType, { emoji: string; color: string; label: string }> = {
  promo_banners:     { emoji: "🖼", color: "#FFE14D", label: "Promo Banners"     },
  category_carousel: { emoji: "🎠", color: "#FF8C00", label: "Carousel Images"   },
  brand_grid:        { emoji: "⭐", color: "#0EA5E9", label: "Brand Grid"        },
  category_circles:  { emoji: "🔄", color: "#00D084", label: "Category Circles"  },
};

// ── Social / Settings types ─────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", color: "#E1306C", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>` },
  { key: "facebook",  label: "Facebook",  color: "#1877F2", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>` },
  { key: "tiktok",    label: "TikTok",    color: "#111",    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>` },
  { key: "twitter",   label: "X / Twitter", color: "#111",  icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
  { key: "youtube",   label: "YouTube",   color: "#FF0000", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>` },
  { key: "whatsapp",  label: "WhatsApp",  color: "#25D366", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>` },
] as const;
type SocialKey = typeof SOCIAL_PLATFORMS[number]["key"];
type SocialSettings = Record<SocialKey, { url: string; visible: boolean }>;

const STATUS_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color:"#b45309", bg:"#FEF3C7", border:"#FCD34D", label:"⏳ Pending"   },
  confirmed: { color:"#1d4ed8", bg:"#DBEAFE", border:"#93C5FD", label:"✅ Confirmed" },
  shipped:   { color:"#6d28d9", bg:"#EDE9FE", border:"#C4B5FD", label:"🚚 Shipped"   },
  delivered: { color:"#065f46", bg:"#D1FAE5", border:"#6EE7B7", label:"📦 Delivered" },
  cancelled: { color:"#991b1b", bg:"#FEE2E2", border:"#FCA5A5", label:"❌ Cancelled" },
};

const TABS = ["categories","products","banners","orders","carousel","brands","homepage","settings"] as const;
type Tab = typeof TABS[number];

const TAB_COLORS: Record<Tab, string> = {
  categories:"#C03EFF", products:"#00D084", banners:"#FFE14D", orders:"#7C3AED",
  carousel:"#FF8C00", brands:"#0EA5E9", homepage:"#EC4899", settings:"#64748B",
};

const defaultSocials = (): SocialSettings =>
  Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.key, { url: "", visible: false }])) as SocialSettings;

const defaultItemForm = (): ItemForm => ({
  heading:"", button_text:"",
  bannerImage:null, bannerPreview:"",
  carouselImage:null, carouselPreview:"",
  brandName:"", brandLogo:null, brandLogoPreview:"",
  link_type:"none", link_value:"", sort_order:"0", uploading:false,
});

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ═══════════════════════════════════════════════════════════════════════════════
export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const toast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const [confirm, setConfirm] = useState<ConfirmState>({ open:false, message:"", onConfirm:()=>{} });
  const askConfirm = (message: string, onConfirm: () => void) => setConfirm({ open:true, message, onConfirm });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");

  // ── Categories ──
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryImage, setCategoryImage] = useState<File|null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [categoryUploading, setCategoryUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // ── Products ──
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [editModal, setEditModal] = useState<EditProductState>({ open:false, product:null, name:"", price:"", description:"", category_id:"", newImages:[], newImagePreviews:[], saving:false });

  // ── Banners (standalone tab) — now with link_type + link_value ──
  const [bannerHeading, setBannerHeading] = useState("");
  const [bannerButtonText, setBannerButtonText] = useState("");
  const [bannerSortOrder, setBannerSortOrder] = useState("0");
  const [bannerLinkType, setBannerLinkType] = useState<"category"|"product"|"none">("none");
  const [bannerLinkValue, setBannerLinkValue] = useState("");
  const [bannerImage, setBannerImage] = useState<File|null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);

  // ── Orders ──
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<number|null>(null);
  const [orderFilter, setOrderFilter] = useState("all");

  // ── Carousel (standalone tab) ──
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [carouselImage, setCarouselImage] = useState<File|null>(null);
  const [carouselPreview, setCarouselPreview] = useState("");
  const [carouselLinkType, setCarouselLinkType] = useState<"product"|"category">("product");
  const [carouselLinkValue, setCarouselLinkValue] = useState("");
  const [carouselSortOrder, setCarouselSortOrder] = useState("0");
  const [carouselUploading, setCarouselUploading] = useState(false);

  // ── Brands (standalone tab) ──
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandLinkUrl, setBrandLinkUrl] = useState("");
  const [brandSortOrder, setBrandSortOrder] = useState("0");
  const [brandLogo, setBrandLogo] = useState<File|null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState("");
  const [brandUploading, setBrandUploading] = useState(false);

  // ── Homepage Sections ──
  const [hpSections, setHpSections] = useState<HomepageSection[]>([]);
  const [hpLoading, setHpLoading] = useState(false);
  const [addSectionType, setAddSectionType] = useState<SectionType>("promo_banners");
  const [addSectionLabel, setAddSectionLabel] = useState("");
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<number|null>(null);
  const [itemForms, setItemForms] = useState<Record<number, ItemForm>>({});

  const getForm = (id: number): ItemForm => itemForms[id] ?? defaultItemForm();
  const setForm = (id: number, patch: Partial<ItemForm>) =>
    setItemForms(prev => ({ ...prev, [id]: { ...(prev[id] ?? defaultItemForm()), ...patch } }));

  // ── Settings ──
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminEmailsSaving, setAdminEmailsSaving] = useState(false);
  const [socials, setSocials] = useState<SocialSettings>(defaultSocials());
  const [socialsSaving, setSocialsSaving] = useState(false);
  const [footerMessage, setFooterMessage] = useState("");
  const [footerMessageSaving, setFooterMessageSaving] = useState(false);

  // ── Fetchers ──
  const fetchCategories = useCallback(async () => { const d = await fetchJSON<ApiResponse<Category>>("/api/categories"); setCategories(d.results||[]); }, []);
  const fetchProducts   = useCallback(async () => { const url = selectedCategory==="all" ? "/api/products" : `/api/products?category_id=${selectedCategory}`; const d = await fetchJSON<ApiResponse<Product>>(url); setProducts(d.results||[]); }, [selectedCategory]);
  const fetchBanners    = useCallback(async () => { const d = await fetchJSON<ApiResponse<Banner>>("/api/banners"); setBanners(d.results||[]); }, []);
  const fetchOrders     = useCallback(async () => { const d = await fetchJSON<ApiResponse<Order>>("/api/orders?admin=true",{credentials:"include"}); setOrders(d.results||[]); }, []);
  const fetchCarousel   = useCallback(async () => { const d = await fetchJSON<{results:CarouselItem[]}>("/api/carousel"); setCarouselItems(d.results||[]); }, []);
  const fetchBrands     = useCallback(async () => { const d = await fetchJSON<ApiResponse<Brand>>("/api/brands"); setBrands(d.results||[]); }, []);

  const fetchHpSections = useCallback(async () => {
    setHpLoading(true);
    try { const d = await fetchJSON<{results:HomepageSection[]}>("/api/homepage-sections"); setHpSections(d.results||[]); }
    finally { setHpLoading(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    const d = await fetchJSON<{settings:Record<string,string>}>("/api/settings");
    if (d.settings?.whatsapp)       setWhatsappNumber(d.settings.whatsapp);
    if (d.settings?.admin_emails)   { try { setAdminEmails(JSON.parse(d.settings.admin_emails)); } catch {} }
    if (d.settings?.socials)        { try { setSocials({...defaultSocials(),...JSON.parse(d.settings.socials)}); } catch {} }
    if (d.settings?.footer_message) setFooterMessage(d.settings.footer_message);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts();   }, [fetchProducts]);
  useEffect(() => { fetchBanners();    }, [fetchBanners]);
  useEffect(() => { fetchOrders();     }, [fetchOrders]);
  useEffect(() => { fetchCarousel();   }, [fetchCarousel]);
  useEffect(() => { fetchBrands();     }, [fetchBrands]);
  useEffect(() => { fetchHpSections(); }, [fetchHpSections]);
  useEffect(() => { fetchSettings();   }, [fetchSettings]);

  // ── Upload helper ──
  const uploadImageWithProgress = (file: File, onProgress: (pct:number)=>void): Promise<string> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd  = new FormData(); fd.append("file", file);
      xhr.upload.addEventListener("progress", e => { if (e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); });
      xhr.addEventListener("load", () => { try { const d=JSON.parse(xhr.responseText); if(d.success) resolve(d.url); else reject(new Error(d.error)); } catch { reject(new Error("Invalid response")); } });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("POST","/api/upload/bannerUpload");
      xhr.send(fd);
    });

  // ── Category actions ──
  const addCategory = async () => {
    if (!categoryName.trim()||!categorySlug.trim()) { toast("error","Fill both name and slug."); return; }
    setCategoryUploading(true);
    try {
      let image_url: string|undefined;
      if (categoryImage) { setUploadStep("Uploading image…"); image_url = await uploadImageWithProgress(categoryImage, pct=>setUploadProgress(pct)); }
      const res = await fetch("/api/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:categoryName.trim(),slug:categorySlug.trim(),image_url})});
      if (res.ok) { setCategoryName(""); setCategorySlug(""); setCategoryImage(null); setCategoryImagePreview(""); fetchCategories(); toast("success",`"${categoryName.trim()}" added!`); }
      else toast("error","Failed to add category.");
    } catch { toast("error","Upload failed."); }
    finally { setCategoryUploading(false); setUploadProgress(0); setUploadStep(""); }
  };
  const deleteCategory = (id:number,name:string) => askConfirm(`Delete "${name}"?`, async()=>{
    const res = await fetch("/api/categories",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if(res.ok){fetchCategories();toast("success",`"${name}" deleted.`);}else toast("error","Failed.");
  });

  // ── Product actions ──
  const handleImageSelect = (e:React.ChangeEvent<HTMLInputElement>) => { const files=Array.from(e.target.files||[]); setProductImages(prev=>[...prev,...files]); setImagePreviews(prev=>[...prev,...files.map(f=>URL.createObjectURL(f))]); };
  const removeImage = (i:number) => { setProductImages(prev=>prev.filter((_,j)=>j!==i)); setImagePreviews(prev=>prev.filter((_,j)=>j!==i)); };
  const openEditModal  = (p:Product) => setEditModal({open:true,product:p,name:p.name,price:String(p.price),description:p.description||"",category_id:String(p.category_id),newImages:[],newImagePreviews:[],saving:false});
  const closeEditModal = () => setEditModal(prev=>({...prev,open:false,newImages:[],newImagePreviews:[]}));
  const saveProductEdit = async () => {
    if (!editModal.product||!editModal.name.trim()||!editModal.price||!editModal.category_id) { toast("error","Fill all required fields."); return; }
    setEditModal(prev=>({...prev,saving:true}));
    try {
      let image_url = editModal.product.image_url;
      if (editModal.newImages.length>0) { setUploadStep("Uploading…"); image_url=await uploadImageWithProgress(editModal.newImages[0],pct=>setUploadProgress(pct)); }
      const res = await fetch("/api/products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editModal.product.id,name:editModal.name.trim(),price:parseFloat(editModal.price),description:editModal.description.trim(),category_id:parseInt(editModal.category_id),image_url})});
      if(res.ok){fetchProducts();toast("success","Updated!");closeEditModal();}else toast("error","Failed.");
    } catch { toast("error","Error."); }
    finally { setEditModal(prev=>({...prev,saving:false})); setUploadProgress(0); setUploadStep(""); }
  };
  const addProduct = async () => {
    if (!productName.trim()||!productPrice||!productCategory) { toast("error","Fill all required fields."); return; }
    setUploading(true);
    try {
      const urls:string[]=[];
      for (let i=0;i<productImages.length;i++) { setUploadStep(`Uploading ${i+1}/${productImages.length}…`); urls.push(await uploadImageWithProgress(productImages[i],pct=>setUploadProgress(Math.round((i*100+pct)/productImages.length)))); }
      const res = await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:productName.trim(),price:parseFloat(productPrice),description:productDescription.trim(),category_id:parseInt(productCategory),image_urls:urls})});
      if(res.ok){setProductName("");setProductPrice("");setProductDescription("");setProductCategory("");setProductImages([]);setImagePreviews([]);fetchProducts();toast("success",`"${productName.trim()}" added!`);}
      else toast("error","Failed.");
    } catch { toast("error","Upload failed."); }
    finally { setUploading(false); setUploadProgress(0); setUploadStep(""); }
  };
  const deleteProduct = (id:number,name:string) => askConfirm(`Delete "${name}"?`, async()=>{const res=await fetch("/api/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});if(res.ok){fetchProducts();toast("success","Deleted!");}else toast("error","Failed.");});
  const copyProductLink = (id:number) => navigator.clipboard.writeText(`${window.location.origin}/products/${id}`).then(()=>toast("success","Link copied!")).catch(()=>toast("error","Copy failed."));

  // ── Banner actions — updated to use link_type + link_value ──
  const addBanner = async () => {
    if (!bannerHeading.trim()||!bannerButtonText.trim()||!bannerImage) { toast("error","Fill all fields."); return; }
    setBannerUploading(true); setUploadStep("Uploading…");
    try {
      const image_url = await uploadImageWithProgress(bannerImage,pct=>setUploadProgress(pct));
      const res = await fetch("/api/banners",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        image_url,
        heading: bannerHeading.trim(),
        button_text: bannerButtonText.trim(),
        sort_order: parseInt(bannerSortOrder)||0,
        link_type: bannerLinkType,
        link_value: bannerLinkType !== "none" ? bannerLinkValue.trim() : "",
      })});
      if(res.ok){
        setBannerHeading(""); setBannerButtonText(""); setBannerSortOrder("0");
        setBannerLinkType("none"); setBannerLinkValue("");
        setBannerImage(null); setBannerPreview("");
        fetchBanners(); toast("success","Banner added!");
      } else toast("error","Failed.");
    } catch { toast("error","Upload failed."); }
    finally { setBannerUploading(false); setUploadProgress(0); setUploadStep(""); }
  };
  const deleteBanner = (id:number,heading:string) => askConfirm(`Delete "${heading}"?`, async()=>{const res=await fetch("/api/banners",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});if(res.ok){fetchBanners();toast("success","Deleted!");}else toast("error","Failed.");});

  // ── Order actions ──
  const updateOrderStatus = async (orderId:number,status:string) => {const res=await fetch("/api/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({id:orderId,status})});if(res.ok){fetchOrders();toast("success",`Order marked ${status}.`);}else toast("error","Failed.");};
  const deleteOrder = (id:number) => askConfirm(`Delete order #${String(id).padStart(6,"0")}?`, async()=>{const res=await fetch("/api/orders",{method:"DELETE",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({id})});if(res.ok){fetchOrders();toast("success","Order deleted.");}else toast("error","Failed.");});

  // ── Carousel actions ──
  const addCarouselItem = async () => {
    if (!carouselImage||!carouselLinkValue.trim()) { toast("error","Select image and link."); return; }
    setCarouselUploading(true); setUploadStep("Uploading…");
    try {
      const image_url=await uploadImageWithProgress(carouselImage,pct=>setUploadProgress(pct));
      const res=await fetch("/api/carousel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image_url,link_type:carouselLinkType,link_value:carouselLinkValue.trim(),sort_order:parseInt(carouselSortOrder)||0})});
      if(res.ok){setCarouselImage(null);setCarouselPreview("");setCarouselLinkValue("");setCarouselSortOrder("0");fetchCarousel();toast("success","Added!");}
      else toast("error","Failed.");
    } catch { toast("error","Upload failed."); }
    finally { setCarouselUploading(false); setUploadProgress(0); setUploadStep(""); }
  };
  const deleteCarouselItem = (id:number) => askConfirm("Delete this carousel image?", async()=>{const res=await fetch("/api/carousel",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});if(res.ok){fetchCarousel();toast("success","Deleted!");}else toast("error","Failed.");});

  // ── Brand actions ──
  const addBrand = async () => {
    if (!brandName.trim()) { toast("error","Brand name is required."); return; }
    setBrandUploading(true);
    try {
      let logo_url:string|undefined;
      if (brandLogo){setUploadStep("Uploading logo…");logo_url=await uploadImageWithProgress(brandLogo,pct=>setUploadProgress(pct));}
      const res=await fetch("/api/brands",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:brandName.trim(),logo_url,link_url:brandLinkUrl.trim()||undefined,sort_order:parseInt(brandSortOrder)||0})});
      if(res.ok){setBrandName("");setBrandLinkUrl("");setBrandSortOrder("0");setBrandLogo(null);setBrandLogoPreview("");fetchBrands();toast("success",`"${brandName.trim()}" added!`);}
      else toast("error","Failed to add brand.");
    } catch { toast("error","Upload failed."); }
    finally { setBrandUploading(false); setUploadProgress(0); setUploadStep(""); }
  };
  const deleteBrand = (id:number,name:string) => askConfirm(`Delete brand "${name}"?`, async()=>{const res=await fetch("/api/brands",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});if(res.ok){fetchBrands();toast("success","Deleted!");}else toast("error","Failed.");});

  // ── Settings actions ──
  const saveWhatsapp = async () => { if(!whatsappNumber.trim()){toast("error","Enter a number.");return;}setWhatsappSaving(true);const res=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:"whatsapp",value:whatsappNumber.trim()})});setWhatsappSaving(false);if(res.ok)toast("success","Saved!");else toast("error","Failed.");};
  const addAdminEmail = async () => { const email=newAdminEmail.trim().toLowerCase();if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast("error","Invalid email.");return;}if(adminEmails.includes(email)){toast("error","Already an admin.");return;}const updated=[...adminEmails,email];setAdminEmailsSaving(true);const res=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:"admin_emails",value:JSON.stringify(updated)})});setAdminEmailsSaving(false);if(res.ok){setAdminEmails(updated);setNewAdminEmail("");toast("success",`${email} added!`);}else toast("error","Failed.");};
  const removeAdminEmail = (email:string) => { if(adminEmails.length<=1){toast("error","Keep at least one admin.");return;}askConfirm(`Remove ${email}?`,async()=>{const updated=adminEmails.filter(e=>e!==email);const res=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:"admin_emails",value:JSON.stringify(updated)})});if(res.ok){setAdminEmails(updated);toast("success","Removed.");}else toast("error","Failed.");});};
  const saveSocials = async () => { setSocialsSaving(true);const res=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:"socials",value:JSON.stringify(socials)})});setSocialsSaving(false);if(res.ok)toast("success","Saved!");else toast("error","Failed.");};
  const saveFooterMessage = async () => { setFooterMessageSaving(true);const res=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:"footer_message",value:footerMessage})});setFooterMessageSaving(false);if(res.ok)toast("success","Saved!");else toast("error","Failed.");};

  // ── Homepage section actions ──
  const addHpSection = async () => {
    if (!addSectionLabel.trim()) { toast("error","Give this section a label."); return; }
    setAddingSectionLoading(true);
    try {
      const res = await fetch("/api/homepage-sections",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:addSectionType,label:addSectionLabel.trim(),sort_order:hpSections.length,enabled:true})});
      if(res.ok){setAddSectionLabel("");fetchHpSections();toast("success",`Section "${addSectionLabel.trim()}" created!`);}
      else toast("error","Failed to create section.");
    } finally { setAddingSectionLoading(false); }
  };

  const deleteHpSection = (id:number,label:string) => askConfirm(`Delete section "${label}" and ALL its items?`, async()=>{
    const res=await fetch("/api/homepage-sections",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if(res.ok){fetchHpSections();toast("success","Section deleted.");}else toast("error","Failed.");
  });

  const toggleHpSection = async (section:HomepageSection) => {
    const res=await fetch("/api/homepage-sections",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:section.id,enabled:section.enabled===0})});
    if(res.ok)fetchHpSections();else toast("error","Failed.");
  };

  const updateHpSectionLabel = async (section:HomepageSection,label:string) => {
    if(!label.trim()||label.trim()===section.label)return;
    const res=await fetch("/api/homepage-sections",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:section.id,label:label.trim()})});
    if(res.ok)fetchHpSections();else toast("error","Failed.");
  };

  const getHpItems = (section:HomepageSection): AnyHpItem[] => { try{return JSON.parse(section.items);}catch{return[];} };

  const patchHpItems = async (section:HomepageSection,items:AnyHpItem[]) => {
    const res=await fetch("/api/homepage-sections",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:section.id,items})});
    if(res.ok)fetchHpSections();else toast("error","Failed to save.");
  };

  const deleteHpItem = async (section:HomepageSection,itemId:string) => {
    const updated=getHpItems(section).filter((x:any)=>x.id!==itemId);
    await patchHpItems(section,updated);
    toast("success","Item removed.");
  };

  const addItemToSection = async (section:HomepageSection) => {
    const form=getForm(section.id);
    if (section.type==="promo_banners") {
      if(!form.heading.trim()||!form.button_text.trim()||!form.bannerImage){toast("error","Fill heading, button text, and choose an image.");return;}
      setForm(section.id,{uploading:true});
      try {
        const image_url=await uploadImageWithProgress(form.bannerImage,pct=>setUploadProgress(pct));
        const item:HpBannerItem={id:newId(),image_url,heading:form.heading.trim(),button_text:form.button_text.trim(),link_type:form.link_type as any,link_value:form.link_value,sort_order:parseInt(form.sort_order)||0};
        await patchHpItems(section,[...getHpItems(section),item]);
        setForm(section.id,{heading:"",button_text:"",bannerImage:null,bannerPreview:"",link_type:"none",link_value:"",sort_order:"0"});
        toast("success","Banner added!");
      } catch{toast("error","Upload failed.");}
      finally{setForm(section.id,{uploading:false});setUploadProgress(0);setUploadStep("");}

    } else if (section.type==="category_carousel") {
      if(!form.carouselImage||!form.link_value.trim()){toast("error","Choose an image and a link value.");return;}
      setForm(section.id,{uploading:true});
      try {
        const image_url=await uploadImageWithProgress(form.carouselImage,pct=>setUploadProgress(pct));
        const item:HpCarouselItem={id:newId(),image_url,link_type:form.link_type==="none"?"category":form.link_type as any,link_value:form.link_value,sort_order:parseInt(form.sort_order)||0};
        await patchHpItems(section,[...getHpItems(section),item]);
        setForm(section.id,{carouselImage:null,carouselPreview:"",link_type:"category",link_value:"",sort_order:"0"});
        toast("success","Carousel item added!");
      } catch{toast("error","Upload failed.");}
      finally{setForm(section.id,{uploading:false});setUploadProgress(0);setUploadStep("");}

    } else if (section.type==="brand_grid") {
      if(!form.brandName.trim()){toast("error","Brand name is required.");return;}
      setForm(section.id,{uploading:true});
      try {
        let logo_url:string|undefined;
        if(form.brandLogo)logo_url=await uploadImageWithProgress(form.brandLogo,pct=>setUploadProgress(pct));
        const item:HpBrandItem={id:newId(),name:form.brandName.trim(),logo_url,link_type:form.link_type as any,link_value:form.link_value,sort_order:parseInt(form.sort_order)||0};
        await patchHpItems(section,[...getHpItems(section),item]);
        setForm(section.id,{brandName:"",brandLogo:null,brandLogoPreview:"",link_type:"none",link_value:"",sort_order:"0"});
        toast("success","Brand added!");
      } catch{toast("error","Upload failed.");}
      finally{setForm(section.id,{uploading:false});setUploadProgress(0);setUploadStep("");}

    } else if (section.type==="category_circles") {
      toast("info","Category circles automatically use your Categories tab — no items needed here.");
    }
  };

  const isUploading = uploading||bannerUploading||editModal.saving||categoryUploading||carouselUploading||brandUploading;

  // ── Link selector helper ──
  const LinkSelector = ({ sectionId, supportsUrl=false }: { sectionId:number; supportsUrl?:boolean }) => {
    const form=getForm(sectionId);
    return (
      <div className="f-stack">
        <div className="f-field">
          <label className="f-label">Link To</label>
          <select className="f-input f-select" value={form.link_type}
            onChange={e=>setForm(sectionId,{link_type:e.target.value as any,link_value:""})}>
            <option value="none">No link</option>
            <option value="category">Category page</option>
            <option value="product">Product page</option>
            {supportsUrl && <option value="url">Custom URL</option>}
          </select>
        </div>
        {form.link_type==="category" && (
          <div className="f-field">
            <label className="f-label">Select Category</label>
            <select className="f-input f-select" value={form.link_value} onChange={e=>setForm(sectionId,{link_value:e.target.value})}>
              <option value="">Choose category…</option>
              {categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        )}
        {form.link_type==="product" && (
          <div className="f-field">
            <label className="f-label">Select Product</label>
            <select className="f-input f-select" value={form.link_value} onChange={e=>setForm(sectionId,{link_value:e.target.value})}>
              <option value="">Choose product…</option>
              {products.map(p=><option key={p.id} value={String(p.id)}>{p.name} — RS {p.price}</option>)}
            </select>
          </div>
        )}
        {supportsUrl && form.link_type==="url" && (
          <div className="f-field">
            <label className="f-label">URL</label>
            <input className="f-input" placeholder="https://…" value={form.link_value} onChange={e=>setForm(sectionId,{link_value:e.target.value})}/>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Navbar />
      <style>{css}</style>

      {/* Toasts */}
      <div className="f-toasts">
        {toasts.map(t=>(
          <div key={t.id} className={`f-toast f-toast--${t.type}`}>
            <span className="f-toast__dot"/><span className="f-toast__msg">{t.message}</span>
            <button className="f-toast__x" onClick={()=>setToasts(p=>p.filter(x=>x.id!==t.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirm.open && (
        <div className="f-overlay" onClick={()=>setConfirm(c=>({...c,open:false}))}>
          <div className="f-dialog" onClick={e=>e.stopPropagation()}>
            <div className="f-dialog__icon">⚠</div>
            <p className="f-dialog__msg">{confirm.message}</p>
            <div className="f-dialog__btns">
              <button className="f-btn f-btn--ghost" onClick={()=>setConfirm(c=>({...c,open:false}))}>Cancel</button>
              <button className="f-btn f-btn--red" onClick={()=>{confirm.onConfirm();setConfirm(c=>({...c,open:false}));}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editModal.open && (
        <div className="f-overlay" onClick={closeEditModal}>
          <div className="f-modal" onClick={e=>e.stopPropagation()}>
            <div className="f-modal__head">
              <span className="f-modal__title">✏️ Edit Product <span style={{color:"#aaa",fontWeight:400}}>#{editModal.product?.id}</span></span>
              <button className="f-modal__close" onClick={closeEditModal}>×</button>
            </div>
            <div className="f-modal__body">
              <div className="f-img-row">
                <div className="f-img-preview">
                  {editModal.newImagePreviews.length>0?<img src={editModal.newImagePreviews[0]} alt=""/>:editModal.product?.image_url?<img src={editModal.product.image_url} alt=""/>:<span>No image</span>}
                </div>
                <div>
                  <label className="f-file-btn">📷 Replace Image<input type="file" accept="image/*" onChange={e=>{const files=Array.from(e.target.files||[]);setEditModal(prev=>({...prev,newImages:files,newImagePreviews:files.map(f=>URL.createObjectURL(f))}));}} style={{display:"none"}}/></label>
                  {editModal.newImagePreviews.length>0&&<button className="f-clear-btn" onClick={()=>setEditModal(prev=>({...prev,newImages:[],newImagePreviews:[]}))}>Clear</button>}
                </div>
              </div>
              <div className="f-grid-2">
                <div className="f-field"><label className="f-label">Name</label><input className="f-input" value={editModal.name} onChange={e=>setEditModal(p=>({...p,name:e.target.value}))}/></div>
                <div className="f-field"><label className="f-label">Price (RS)</label><input className="f-input" type="number" value={editModal.price} onChange={e=>setEditModal(p=>({...p,price:e.target.value}))}/></div>
              </div>
              <div className="f-field"><label className="f-label">Description</label><textarea className="f-input f-textarea" value={editModal.description} onChange={e=>setEditModal(p=>({...p,description:e.target.value}))}/></div>
              <div className="f-field">
                <label className="f-label">Category</label>
                <select className="f-input f-select" value={editModal.category_id} onChange={e=>setEditModal(p=>({...p,category_id:e.target.value}))}>
                  <option value="">Select</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {editModal.saving&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`}}/></div>}
            </div>
            <div className="f-modal__foot">
              <button className="f-btn f-btn--ghost" onClick={closeEditModal} disabled={editModal.saving}>Cancel</button>
              <button className="f-btn f-btn--green" onClick={saveProductEdit} disabled={editModal.saving}>{editModal.saving?"Saving…":"✓ Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading&&!editModal.open&&(
        <div className="f-upload-bar">
          <span>{uploadStep||"Uploading…"}</span>
          <div className="f-upload-bar__track"><div className="f-upload-bar__fill" style={{width:`${uploadProgress}%`}}/></div>
          <span>{uploadProgress}%</span>
        </div>
      )}

      <div className="f-page">
        {/* Header */}
        <div className="f-header">
          <div>
            <div className="f-badge">Admin Panel</div>
            <h1 className="f-title">Dashboard</h1>
          </div>
          <div className="f-stats">
            {[{n:categories.length,l:"Categories",c:"#C03EFF"},{n:products.length,l:"Products",c:"#00D084"},{n:orders.length,l:"Orders",c:"#7C3AED"},{n:hpSections.length,l:"Sections",c:"#EC4899"}].map(s=>(
              <div key={s.l} className="f-stat" style={{borderColor:s.c}}>
                <span className="f-stat__n" style={{color:s.c}}>{s.n}</span>
                <span className="f-stat__l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="f-tabs">
          {TABS.map(tab=>(
            <button key={tab} className={`f-tab ${activeTab===tab?"f-tab--active":""}`}
              style={activeTab===tab?{background:TAB_COLORS[tab],color:tab==="banners"?"#111":"#fff",borderColor:TAB_COLORS[tab],boxShadow:`3px 3px 0 #111`}:{}}
              onClick={()=>setActiveTab(tab)}>
              {tab==="categories"&&"🗂"}{tab==="products"&&"📦"}{tab==="banners"&&"🖼"}{tab==="orders"&&"🧾"}{tab==="carousel"&&"🎠"}{tab==="brands"&&"⭐"}{tab==="homepage"&&"🏠"}{tab==="settings"&&"⚙️"}
              {" "}{tab.charAt(0).toUpperCase()+tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ══ CATEGORIES ══ */}
        {activeTab==="categories"&&(
          <div className="f-section">
            <div className="f-card" style={{borderTopColor:"#C03EFF"}}>
              <h2 className="f-card-title">🗂 Add Category</h2>
              <div className="f-stack">
                <div className="f-grid-2">
                  <div className="f-field"><label className="f-label">Name</label><input className="f-input" placeholder="e.g. Lipsticks" value={categoryName} onChange={e=>setCategoryName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()}/></div>
                  <div className="f-field"><label className="f-label">Slug</label><input className="f-input" placeholder="e.g. lipsticks" value={categorySlug} onChange={e=>setCategorySlug(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()}/></div>
                </div>
                <div className="f-field">
                  <label className="f-label">Circle Image <span className="f-hint-text">shown on homepage carousel</span></label>
                  <label className="f-file-btn">📷 Choose Image<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]||null;setCategoryImage(f);setCategoryImagePreview(f?URL.createObjectURL(f):"");}}/></label>
                  {categoryImagePreview&&(
                    <div style={{position:"relative",display:"inline-block",marginTop:10}}>
                      <img src={categoryImagePreview} style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"3px solid #111",boxShadow:"3px 3px 0 #C03EFF",display:"block"}} alt=""/>
                      <button onClick={()=>{setCategoryImage(null);setCategoryImagePreview("");}} style={{position:"absolute",top:-8,right:-8,width:22,height:22,background:"#C03EFF",color:"#fff",border:"2px solid #111",borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  )}
                </div>
                {categoryUploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#C03EFF"}}/></div>}
                <button className="f-btn f-btn--red" onClick={addCategory} disabled={categoryUploading} style={{alignSelf:"flex-start"}}>{categoryUploading?"Uploading…":"+ Add Category"}</button>
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#C03EFF"}}>
              <h2 className="f-card-title">All Categories <span className="f-count">{categories.length}</span></h2>
              {categories.length===0?<p className="f-empty">No categories yet.</p>:(
                <div className="f-table-wrap"><table className="f-table">
                  <thead><tr><th>IMG</th><th>ID</th><th>Name</th><th>Slug</th><th></th></tr></thead>
                  <tbody>{categories.map(cat=>(
                    <tr key={cat.id}>
                      <td>{cat.image_url?<img src={cat.image_url} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:"2px solid #111"}} alt=""/>:<div style={{width:38,height:38,borderRadius:"50%",background:"#FFE14D",border:"2px solid #111",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>?</div>}</td>
                      <td><code className="f-code">#{cat.id}</code></td>
                      <td><strong>{cat.name}</strong></td>
                      <td><code className="f-code">{cat.slug}</code></td>
                      <td><button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteCategory(cat.id,cat.name)}>Delete</button></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </div>
        )}

        {/* ══ PRODUCTS ══ */}
        {activeTab==="products"&&(
          <div className="f-section">
            <div className="f-card" style={{borderTopColor:"#00D084"}}>
              <h2 className="f-card-title">📦 Add Product</h2>
              <div className="f-stack">
                <div className="f-grid-2">
                  <div className="f-field"><label className="f-label">Name</label><input className="f-input" placeholder="Product name" value={productName} onChange={e=>setProductName(e.target.value)}/></div>
                  <div className="f-field"><label className="f-label">Price (RS)</label><input className="f-input" type="number" placeholder="0.00" value={productPrice} onChange={e=>setProductPrice(e.target.value)}/></div>
                </div>
                <div className="f-field"><label className="f-label">Description</label><textarea className="f-input f-textarea" placeholder="Describe the product…" value={productDescription} onChange={e=>setProductDescription(e.target.value)}/></div>
                <div className="f-field"><label className="f-label">Category</label><select className="f-input f-select" value={productCategory} onChange={e=>setProductCategory(e.target.value)}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="f-field">
                  <label className="f-label">Images</label>
                  <label className="f-file-btn">🖼 Choose Images<input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{display:"none"}}/></label>
                  {imagePreviews.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>
                      {imagePreviews.map((src,i)=>(
                        <div key={i} style={{position:"relative"}}>
                          <img src={src} style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:"2.5px solid #111",boxShadow:i===0?"3px 3px 0 #00D084":"2px 2px 0 #111"}} alt=""/>
                          {i===0&&<span style={{position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",background:"#00D084",color:"#111",fontSize:"0.6rem",fontWeight:700,padding:"1px 6px",borderRadius:100,border:"1.5px solid #111",whiteSpace:"nowrap"}}>Cover</span>}
                          <button onClick={()=>removeImage(i)} style={{position:"absolute",top:-8,right:-8,width:20,height:20,background:"#C03EFF",color:"#fff",border:"2px solid #111",borderRadius:"50%",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {uploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#00D084"}}/></div>}
                <button className="f-btn f-btn--green" onClick={addProduct} disabled={uploading} style={{alignSelf:"flex-start"}}>{uploading?uploadStep||"Uploading…":"+ Add Product"}</button>
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#00D084"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
                <h2 className="f-card-title" style={{marginBottom:0}}>Products <span className="f-count">{products.length}</span></h2>
                <select className="f-input f-select" style={{width:"auto"}} value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}><option value="all">All Categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              {products.length===0?<p className="f-empty">No products found.</p>:(
                <div className="f-table-wrap"><table className="f-table">
                  <thead><tr><th>IMG</th><th>Name</th><th>Price</th><th>Category</th><th>Link</th><th></th></tr></thead>
                  <tbody>{products.map(p=>(
                    <tr key={p.id}>
                      <td>{p.image_url?<img src={p.image_url} style={{width:48,height:36,objectFit:"cover",borderRadius:6,border:"2px solid #111"}} alt=""/>:<span>—</span>}</td>
                      <td><strong style={{fontSize:"0.84rem"}}>{p.name}</strong></td>
                      <td><span style={{fontWeight:700,color:"#00D084"}}>RS {p.price}</span></td>
                      <td><span className="f-badge-sm">{categories.find(c=>c.id===p.category_id)?.name||"—"}</span></td>
                      <td><div style={{display:"flex",alignItems:"center",gap:4}}><code className="f-code" style={{fontSize:"0.7rem"}}>/products/{p.id}</code><button className="f-icon-btn" onClick={()=>copyProductLink(p.id)} title="Copy">📋</button><a className="f-icon-btn" href={`/products/${p.id}`} target="_blank" rel="noopener noreferrer" title="Open">↗</a></div></td>
                      <td><div style={{display:"flex",gap:4}}><button className="f-btn f-btn--blue f-btn--sm" onClick={()=>openEditModal(p)}>Edit</button><button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteProduct(p.id,p.name)}>Delete</button></div></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </div>
        )}

        {/* ══ BANNERS ══ */}
        {activeTab==="banners"&&(
          <div className="f-section">
            <div className="f-card" style={{borderTopColor:"#FFE14D"}}>
              <h2 className="f-card-title">🖼 Add Banner</h2>
              <p className="f-hint">Standalone banners tab — separate from Homepage Sections. Max 4. Sort order 0–3 controls position.</p>
              <div className="f-stack">
                <div className="f-grid-2">
                  <div className="f-field"><label className="f-label">Heading</label><input className="f-input" placeholder="Banner headline" value={bannerHeading} onChange={e=>setBannerHeading(e.target.value)}/></div>
                  <div className="f-field"><label className="f-label">Button Text</label><input className="f-input" placeholder="e.g. Shop Now" value={bannerButtonText} onChange={e=>setBannerButtonText(e.target.value)}/></div>
                </div>
                <div className="f-field" style={{maxWidth:180}}>
                  <label className="f-label">Sort Order</label>
                  <input className="f-input" type="number" value={bannerSortOrder} onChange={e=>setBannerSortOrder(e.target.value)}/>
                </div>

                {/* ── New link_type + link_value selectors ── */}
                <div className="f-field">
                  <label className="f-label">Link To</label>
                  <select className="f-input f-select" value={bannerLinkType}
                    onChange={e=>{ setBannerLinkType(e.target.value as any); setBannerLinkValue(""); }}>
                    <option value="none">No link</option>
                    <option value="category">Category page</option>
                    <option value="product">Product page</option>
                  </select>
                </div>
                {bannerLinkType==="category"&&(
                  <div className="f-field">
                    <label className="f-label">Select Category</label>
                    <select className="f-input f-select" value={bannerLinkValue} onChange={e=>setBannerLinkValue(e.target.value)}>
                      <option value="">Choose category…</option>
                      {categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                {bannerLinkType==="product"&&(
                  <div className="f-field">
                    <label className="f-label">Select Product</label>
                    <select className="f-input f-select" value={bannerLinkValue} onChange={e=>setBannerLinkValue(e.target.value)}>
                      <option value="">Choose product…</option>
                      {products.map(p=><option key={p.id} value={String(p.id)}>{p.name} — RS {p.price}</option>)}
                    </select>
                  </div>
                )}

                <div className="f-field">
                  <label className="f-label">Banner Image</label>
                  <label className="f-file-btn">🖼 Choose Image<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0]||null;setBannerImage(f);setBannerPreview(f?URL.createObjectURL(f):"");}} style={{display:"none"}}/></label>
                  {bannerPreview&&<img src={bannerPreview} style={{marginTop:10,width:200,height:110,objectFit:"cover",borderRadius:10,border:"2.5px solid #111",boxShadow:"3px 3px 0 #FFE14D",display:"block"}} alt=""/>}
                </div>
                {bannerUploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#FFE14D"}}/></div>}
                <button className="f-btn f-btn--yellow" onClick={addBanner} disabled={bannerUploading} style={{alignSelf:"flex-start"}}>{bannerUploading?"Uploading…":"+ Add Banner"}</button>
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#FFE14D"}}>
              <h2 className="f-card-title">Existing Banners <span className="f-count">{banners.length}/4</span></h2>
              {banners.length===0?<p className="f-empty">No banners yet.</p>:(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {banners.map(b=>(
                    <div key={b.id} className="f-item-row">
                      <img src={b.image_url} style={{width:100,height:62,objectFit:"cover",borderRadius:8,border:"2px solid #111",flexShrink:0}} alt=""/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,color:"#111",marginBottom:4}}>{b.heading}</div>
                        <div style={{fontSize:"0.75rem",color:"#666",display:"flex",gap:10,flexWrap:"wrap"}}>
                          <span>Btn: <b>{b.button_text}</b></span>
                          <span>Order: <b>{b.sort_order}</b></span>
                          {b.link_type&&b.link_type!=="none"&&b.link_value&&(
                            <span className="f-badge-sm" style={b.link_type==="category"?{background:"#DCFCE7",borderColor:"#86EFAC",color:"#166534"}:{background:"#E0F2FE",borderColor:"#93C5FD",color:"#1e40af"}}>
                              {b.link_type==="category"?"🗂 /category/":"📦 /products/"}{b.link_value}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteBanner(b.id,b.heading)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ORDERS ══ */}
        {activeTab==="orders"&&(
          <div className="f-section">
            <div className="f-card" style={{borderTopColor:"#7C3AED"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
                <h2 className="f-card-title" style={{marginBottom:0}}>🧾 Orders <span className="f-count">{orders.length}</span></h2>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["all","pending","confirmed","shipped","delivered","cancelled"].map(f=>{
                    const sm=STATUS_META[f];const active=orderFilter===f;
                    return <button key={f} onClick={()=>setOrderFilter(f)} style={{padding:"5px 12px",borderRadius:100,cursor:"pointer",fontSize:"0.72rem",fontWeight:700,border:`2px solid ${active?(f==="all"?"#111":sm.border):"#ddd"}`,background:active?(f==="all"?"#111":sm.bg):"#fff",color:active?(f==="all"?"#fff":sm.color):"#888",boxShadow:active?`2px 2px 0 ${f==="all"?"#111":sm.border}`:"none",transition:"all 0.15s"}}>{f==="all"?"All":sm.label}{f!=="all"&&<span style={{marginLeft:4,opacity:0.7}}>({orders.filter(o=>o.status===f).length})</span>}</button>;
                  })}
                </div>
              </div>
              {(()=>{
                const filtered=orderFilter==="all"?orders:orders.filter(o=>o.status===orderFilter);
                return filtered.length===0?<p className="f-empty">No orders found.</p>:(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {filtered.map(order=>{
                      const sm=STATUS_META[order.status]||STATUS_META.pending;
                      const open=expandedOrder===order.id;
                      return (
                        <div key={order.id} style={{border:`2px solid ${open?sm.border:"#ddd"}`,borderRadius:12,overflow:"hidden",background:"#fff",boxShadow:open?`3px 3px 0 ${sm.border}`:"none",transition:"all 0.2s"}}>
                          <button style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",flexWrap:"wrap"}} onClick={()=>setExpandedOrder(open?null:order.id)}>
                            <div><div style={{fontWeight:700,fontSize:"0.9rem",color:"#111"}}>#{String(order.id).padStart(6,"0")}</div><div style={{fontSize:"0.7rem",color:"#888"}}>{new Date(order.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div></div>
                            <span style={{flex:1,fontSize:"0.78rem",color:"#666"}}>{order.user_name} · {order.user_email}</span>
                            <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto"}}>
                              <span style={{padding:"3px 10px",borderRadius:100,fontSize:"0.68rem",fontWeight:700,background:sm.bg,color:sm.color,border:`1.5px solid ${sm.border}`}}>{sm.label}</span>
                              <span style={{fontWeight:700,color:"#7C3AED"}}>RS {order.total.toFixed(2)}</span>
                              <span style={{transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",display:"inline-block"}}>▾</span>
                            </div>
                          </button>
                          {open&&(
                            <div style={{padding:"16px 18px",borderTop:`2px solid ${sm.border}`,background:sm.bg}}>
                              <div className="f-grid-2">
                                <div>
                                  <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#888",marginBottom:10}}>Items</div>
                                  {order.items.map(item=><div key={item.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,0.06)",fontSize:"0.82rem"}}><span style={{width:8,height:8,borderRadius:"50%",background:sm.color,flexShrink:0,marginTop:5}}/><span style={{flex:1,fontWeight:500}}>{item.product_name}</span><span style={{color:"#888"}}>×{item.quantity}</span><span style={{fontWeight:700,color:sm.color}}>RS {(item.price*item.quantity).toFixed(2)}</span></div>)}
                                </div>
                                <div>
                                  <div style={{fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#888",marginBottom:10}}>Delivery</div>
                                  <div style={{fontSize:"0.82rem",color:"#444",marginBottom:6}}>📍 {order.address}, {order.city}</div>
                                  <div style={{fontSize:"0.82rem",color:"#444",marginBottom:16}}>📞 {order.phone}</div>
                                  <select className="f-input f-select" value={order.status} onChange={e=>updateOrderStatus(order.id,e.target.value)} style={{marginBottom:10,borderColor:sm.border,color:sm.color,fontWeight:700}}>
                                    <option value="pending">⏳ Pending</option><option value="confirmed">✅ Confirmed</option><option value="shipped">🚚 Shipped</option><option value="delivered">📦 Delivered</option><option value="cancelled">❌ Cancelled</option>
                                  </select>
                                  <button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteOrder(order.id)}>🗑 Delete Order</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══ CAROUSEL ══ */}
        {activeTab==="carousel"&&(
          <div className="f-section">
            <div className="f-card" style={{borderTopColor:"#FF8C00"}}>
              <h2 className="f-card-title">🎠 Add Carousel Image</h2>
              <p className="f-hint">Standalone carousel — separate from Homepage Sections. Images scroll infinitely and link to a product or category.</p>
              <div className="f-stack">
                <div className="f-field">
                  <label className="f-label">Image</label>
                  <label className="f-file-btn">🖼 Choose Image<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]||null;setCarouselImage(f);setCarouselPreview(f?URL.createObjectURL(f):"");}}/></label>
                  {carouselPreview&&<img src={carouselPreview} style={{marginTop:10,width:200,height:120,objectFit:"cover",borderRadius:10,border:"2.5px solid #111",boxShadow:"3px 3px 0 #FF8C00",display:"block"}} alt=""/>}
                </div>
                <div className="f-grid-2">
                  <div className="f-field"><label className="f-label">Link Type</label><select className="f-input f-select" value={carouselLinkType} onChange={e=>setCarouselLinkType(e.target.value as "product"|"category")}><option value="product">Product</option><option value="category">Category</option></select></div>
                  <div className="f-field">
                    <label className="f-label">{carouselLinkType==="product"?"Select Product":"Select Category"}</label>
                    {carouselLinkType==="product"?<select className="f-input f-select" value={carouselLinkValue} onChange={e=>setCarouselLinkValue(e.target.value)}><option value="">Choose…</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} #{p.id}</option>)}</select>:<select className="f-input f-select" value={carouselLinkValue} onChange={e=>setCarouselLinkValue(e.target.value)}><option value="">Choose…</option>{categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select>}
                  </div>
                </div>
                <div className="f-field" style={{maxWidth:180}}><label className="f-label">Sort Order</label><input className="f-input" type="number" value={carouselSortOrder} onChange={e=>setCarouselSortOrder(e.target.value)}/></div>
                {carouselUploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#FF8C00"}}/></div>}
                <button className="f-btn f-btn--orange" onClick={addCarouselItem} disabled={carouselUploading} style={{alignSelf:"flex-start"}}>{carouselUploading?"Uploading…":"+ Add to Carousel"}</button>
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#FF8C00"}}>
              <h2 className="f-card-title">Carousel Images <span className="f-count">{carouselItems.length}</span></h2>
              {carouselItems.length===0?<p className="f-empty">No carousel images yet.</p>:(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {carouselItems.map(item=>(
                    <div key={item.id} className="f-item-row">
                      <img src={item.image_url} style={{width:120,height:76,objectFit:"cover",borderRadius:8,border:"2px solid #111",flexShrink:0}} alt=""/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:"0.82rem",color:"#111",marginBottom:4}}>{item.link_type==="product"?"📦 Product":"🗂 Category"}</div>
                        <code className="f-code">{item.link_value}</code>
                        <div style={{fontSize:"0.72rem",color:"#888",marginTop:4}}>Order: {item.sort_order}</div>
                      </div>
                      <button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteCarouselItem(item.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ BRANDS ══ */}
        {activeTab==="brands"&&(
          <div className="f-section">
            <div className="f-card" style={{borderTopColor:"#0EA5E9"}}>
              <h2 className="f-card-title">⭐ Add Brand</h2>
              <p className="f-hint">Standalone brands tab. Upload a logo and set a link — internal path like <code className="f-code">/search?q=garnier</code> or full external URL.</p>
              <div className="f-stack">
                <div className="f-grid-2">
                  <div className="f-field"><label className="f-label">Brand Name</label><input className="f-input" placeholder="e.g. Garnier" value={brandName} onChange={e=>setBrandName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBrand()}/></div>
                  <div className="f-field"><label className="f-label">Sort Order</label><input className="f-input" type="number" placeholder="0" value={brandSortOrder} onChange={e=>setBrandSortOrder(e.target.value)}/></div>
                </div>
                <div className="f-field"><label className="f-label">Link URL</label><input className="f-input" placeholder="/search?q=garnier or https://garnier.com" value={brandLinkUrl} onChange={e=>setBrandLinkUrl(e.target.value)}/></div>
                <div className="f-field">
                  <label className="f-label">Brand Logo</label>
                  <label className="f-file-btn">🖼 Choose Logo<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]||null;setBrandLogo(f);setBrandLogoPreview(f?URL.createObjectURL(f):"");}}/></label>
                  {brandLogoPreview&&(
                    <div style={{position:"relative",display:"inline-block",marginTop:10}}>
                      <img src={brandLogoPreview} style={{height:56,maxWidth:160,objectFit:"contain",borderRadius:8,border:"2px solid #111",background:"#fff",padding:6,display:"block",boxShadow:"3px 3px 0 #0EA5E9"}} alt=""/>
                      <button onClick={()=>{setBrandLogo(null);setBrandLogoPreview("");}} style={{position:"absolute",top:-8,right:-8,width:22,height:22,background:"#C03EFF",color:"#fff",border:"2px solid #111",borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  )}
                </div>
                {brandUploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#0EA5E9"}}/></div>}
                <button className="f-btn f-btn--blue" onClick={addBrand} disabled={brandUploading} style={{alignSelf:"flex-start"}}>{brandUploading?"Uploading…":"+ Add Brand"}</button>
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#0EA5E9"}}>
              <h2 className="f-card-title">All Brands <span className="f-count">{brands.length}</span></h2>
              {brands.length===0?<p className="f-empty">No brands yet.</p>:(
                <div className="f-table-wrap"><table className="f-table">
                  <thead><tr><th>Logo</th><th>Name</th><th>Link</th><th>Order</th><th></th></tr></thead>
                  <tbody>{brands.map(brand=>(
                    <tr key={brand.id}>
                      <td>{brand.logo_url?<img src={brand.logo_url} style={{height:40,maxWidth:100,objectFit:"contain",background:"#fff",border:"2px solid #111",borderRadius:6,padding:4}} alt=""/>:<div style={{width:60,height:40,background:"#E0F2FE",border:"2px dashed #0EA5E9",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",color:"#0EA5E9"}}>No logo</div>}</td>
                      <td><strong>{brand.name}</strong></td>
                      <td>{brand.link_url?<code className="f-code" style={{maxWidth:200,display:"inline-block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",verticalAlign:"middle"}}>{brand.link_url}</code>:<span style={{color:"#aaa",fontSize:"0.78rem"}}>No link</span>}</td>
                      <td><code className="f-code">{brand.sort_order}</code></td>
                      <td><button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteBrand(brand.id,brand.name)}>Delete</button></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </div>
        )}

        {/* ══ HOMEPAGE SECTIONS ══ */}
        {activeTab==="homepage"&&(
          <div className="f-section">
            <div style={{padding:"14px 18px",background:"#FDF2F8",border:"2px solid #F9A8D4",borderRadius:12,boxShadow:"3px 3px 0 #F9A8D4",fontSize:"0.82rem",color:"#9D174D",fontWeight:600,lineHeight:1.6}}>
              🏠 <strong>Each section is fully independent.</strong> You can add the same type multiple times with different content.
              Every section has its own images, links, and data — they don't share anything.
              Each item can link to a <strong>category page</strong> or a <strong>product page</strong> individually.
            </div>
            <div className="f-card" style={{borderTopColor:"#EC4899"}}>
              <h2 className="f-card-title">➕ Create New Section</h2>
              <div className="f-stack">
                <div className="f-grid-2">
                  <div className="f-field">
                    <label className="f-label">Section Type</label>
                    <select className="f-input f-select" value={addSectionType} onChange={e=>setAddSectionType(e.target.value as SectionType)}>
                      <option value="promo_banners">🖼 Promo Banners — large image cards</option>
                      <option value="category_carousel">🎠 Carousel — infinitely scrolling images</option>
                      <option value="brand_grid">⭐ Brand Grid — logo grid</option>
                      <option value="category_circles">🔄 Category Circles — auto from categories tab</option>
                    </select>
                  </div>
                  <div className="f-field">
                    <label className="f-label">Section Label <span className="f-hint-text">admin name, not shown to visitors</span></label>
                    <input className="f-input" placeholder='e.g. "Summer Sale Banners" or "Hero Carousel"'
                      value={addSectionLabel} onChange={e=>setAddSectionLabel(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&addHpSection()}/>
                  </div>
                </div>
                <button className="f-btn f-btn--pink" onClick={addHpSection} disabled={addingSectionLoading} style={{alignSelf:"flex-start"}}>
                  {addingSectionLoading?"Creating…":"+ Create Section"}
                </button>
              </div>
            </div>
            {hpLoading&&<p className="f-empty" style={{textAlign:"center",padding:"30px 0"}}>Loading sections…</p>}
            {!hpLoading&&hpSections.length===0&&(
              <div className="f-card" style={{borderTopColor:"#EC4899",textAlign:"center",padding:"48px 24px"}}>
                <div style={{fontSize:"2.8rem",marginBottom:12}}>📭</div>
                <p style={{color:"#888",fontSize:"0.88rem",fontWeight:600}}>No homepage sections yet.<br/>Create your first one above!</p>
              </div>
            )}
            {hpSections.map(section=>{
              const items = getHpItems(section);
              const isOpen = openSectionId===section.id;
              const form = getForm(section.id);
              const meta = SECTION_META[section.type];
              return (
                <div key={section.id} className="f-card" style={{borderTopColor:meta.color,padding:0,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",background:section.enabled?"#fff":"#f9f9f9",flexWrap:"wrap"}}>
                    <button onClick={()=>toggleHpSection(section)}
                      style={{width:40,height:22,borderRadius:100,border:"2px solid #111",cursor:"pointer",
                        background:section.enabled?meta.color:"#eee",flexShrink:0,padding:0,
                        position:"relative",transition:"background 0.2s"}}>
                      <span style={{position:"absolute",top:2,left:section.enabled?18:2,width:14,height:14,
                        borderRadius:"50%",background:"#fff",border:"1.5px solid #111",
                        transition:"left 0.2s",display:"block"}}/>
                    </button>
                    <span style={{fontSize:"1.1rem",flexShrink:0}}>{meta.emoji}</span>
                    <input className="f-input"
                      style={{flex:1,fontWeight:700,fontSize:"0.88rem",minWidth:100,
                        background:"transparent",border:"1.5px dashed #ccc",padding:"4px 8px",borderRadius:6}}
                      defaultValue={section.label}
                      onBlur={e=>updateHpSectionLabel(section,e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")(e.target as HTMLInputElement).blur();}}/>
                    <span style={{fontSize:"0.7rem",color:"#888",background:"#f0f0f0",border:"1.5px solid #ddd",borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap",flexShrink:0}}>{meta.label}</span>
                    <span style={{fontSize:"0.7rem",fontWeight:800,padding:"3px 10px",borderRadius:100,flexShrink:0,border:`2px solid ${section.enabled?meta.color:"#ddd"}`,background:section.enabled?meta.color:"#f0f0f0",color:section.enabled?(meta.color==="#FFE14D"?"#111":"#fff"):"#999"}}>{section.enabled?"ON":"OFF"}</span>
                    <span style={{fontSize:"0.72rem",color:"#888",background:"#f5f5f5",border:"1.5px solid #ddd",borderRadius:6,padding:"3px 8px",flexShrink:0}}>{section.type==="category_circles"?"auto":items.length+" item"+(items.length!==1?"s":"")}</span>
                    <button onClick={()=>setOpenSectionId(isOpen?null:section.id)}
                      style={{width:30,height:30,background:"#f5f5f5",border:"1.5px solid #111",borderRadius:6,cursor:"pointer",fontSize:"0.85rem",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</button>
                    <button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteHpSection(section.id,section.label)}>Delete</button>
                  </div>
                  {isOpen&&(
                    <div style={{borderTop:`2.5px solid ${meta.color}`,padding:"22px",background:"#fafafa"}}>
                      {section.type==="category_circles"&&(
                        <div style={{padding:"18px",background:"#F0FDF4",border:"2px solid #6EE7B7",borderRadius:10,fontSize:"0.84rem",color:"#065f46",fontWeight:600,lineHeight:1.7}}>
                          🔄 <strong>No items needed here.</strong> This section automatically renders circles from your <strong>Categories</strong> tab.
                        </div>
                      )}
                      {section.type==="promo_banners"&&(
                        <div className="f-stack">
                          <div style={{padding:"10px 14px",background:"#FFFBEB",border:"2px solid #FCD34D",borderRadius:8,fontSize:"0.78rem",color:"#92400E",fontWeight:600}}>
                            💡 Each banner can link independently to any category or product.
                          </div>
                          <div style={{background:"#fff",border:"2px solid #FFE14D",borderRadius:10,padding:"16px",boxShadow:"3px 3px 0 #FFE14D"}}>
                            <div style={{fontWeight:800,fontSize:"0.8rem",color:"#111",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>➕ Add Banner to This Section</div>
                            <div className="f-stack">
                              <div className="f-grid-2">
                                <div className="f-field"><label className="f-label">Heading</label><input className="f-input" placeholder="e.g. Summer Sale" value={form.heading} onChange={e=>setForm(section.id,{heading:e.target.value})}/></div>
                                <div className="f-field"><label className="f-label">Button Text</label><input className="f-input" placeholder="e.g. Shop Now" value={form.button_text} onChange={e=>setForm(section.id,{button_text:e.target.value})}/></div>
                              </div>
                              <LinkSelector sectionId={section.id}/>
                              <div className="f-field">
                                <label className="f-label">Banner Image</label>
                                <label className="f-file-btn">🖼 Choose Image<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]||null;setForm(section.id,{bannerImage:f,bannerPreview:f?URL.createObjectURL(f):""});}}/></label>
                                {form.bannerPreview&&<img src={form.bannerPreview} style={{marginTop:10,width:180,height:100,objectFit:"cover",borderRadius:8,border:"2.5px solid #111",boxShadow:"3px 3px 0 #FFE14D",display:"block"}} alt=""/>}
                              </div>
                              {form.uploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#FFE14D"}}/></div>}
                              <button className="f-btn f-btn--yellow" onClick={()=>addItemToSection(section)} disabled={form.uploading} style={{alignSelf:"flex-start"}}>{form.uploading?"Uploading…":"+ Add This Banner"}</button>
                            </div>
                          </div>
                          {items.length>0&&(
                            <div className="f-stack">
                              <div style={{fontSize:"0.7rem",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"#888"}}>Banners in this section ({items.length})</div>
                              {(items as HpBannerItem[]).map(item=>(
                                <div key={item.id} className="f-item-row">
                                  <img src={item.image_url} style={{width:100,height:62,objectFit:"cover",borderRadius:6,border:"2px solid #111",flexShrink:0}} alt=""/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontWeight:700,fontSize:"0.84rem",color:"#111"}}>{item.heading}</div>
                                    <div style={{fontSize:"0.72rem",color:"#666",marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
                                      <span>Btn: <b>{item.button_text}</b></span>
                                      {item.link_type!=="none"&&item.link_value&&(
                                        <span className="f-badge-sm" style={item.link_type==="category"?{background:"#DCFCE7",borderColor:"#86EFAC",color:"#166534"}:{background:"#E0F2FE",borderColor:"#93C5FD",color:"#1e40af"}}>
                                          {item.link_type==="category"?"🗂 /category/":"📦 /products/"}{item.link_value}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteHpItem(section,item.id)}>Remove</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {section.type==="category_carousel"&&(
                        <div className="f-stack">
                          <div style={{padding:"10px 14px",background:"#FFF7ED",border:"2px solid #FED7AA",borderRadius:8,fontSize:"0.78rem",color:"#92400E",fontWeight:600}}>
                            💡 Each carousel image links independently to a category or product.
                          </div>
                          <div style={{background:"#fff",border:"2px solid #FF8C00",borderRadius:10,padding:"16px",boxShadow:"3px 3px 0 #FF8C00"}}>
                            <div style={{fontWeight:800,fontSize:"0.8rem",color:"#111",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>➕ Add Image to This Carousel</div>
                            <div className="f-stack">
                              <div className="f-field">
                                <label className="f-label">Image</label>
                                <label className="f-file-btn">🖼 Choose Image<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]||null;setForm(section.id,{carouselImage:f,carouselPreview:f?URL.createObjectURL(f):""});}}/></label>
                                {form.carouselPreview&&<img src={form.carouselPreview} style={{marginTop:10,width:180,height:110,objectFit:"cover",borderRadius:8,border:"2.5px solid #111",boxShadow:"3px 3px 0 #FF8C00",display:"block"}} alt=""/>}
                              </div>
                              <div className="f-field">
                                <label className="f-label">Link Type</label>
                                <select className="f-input f-select" value={form.link_type==="none"?"category":form.link_type} onChange={e=>setForm(section.id,{link_type:e.target.value as any,link_value:""})}>
                                  <option value="category">Category page</option>
                                  <option value="product">Product page</option>
                                </select>
                              </div>
                              {(form.link_type==="category"||form.link_type==="none")&&(
                                <div className="f-field">
                                  <label className="f-label">Select Category</label>
                                  <select className="f-input f-select" value={form.link_value} onChange={e=>setForm(section.id,{link_value:e.target.value})}>
                                    <option value="">Choose category…</option>
                                    {categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}
                                  </select>
                                </div>
                              )}
                              {form.link_type==="product"&&(
                                <div className="f-field">
                                  <label className="f-label">Select Product</label>
                                  <select className="f-input f-select" value={form.link_value} onChange={e=>setForm(section.id,{link_value:e.target.value})}>
                                    <option value="">Choose product…</option>
                                    {products.map(p=><option key={p.id} value={String(p.id)}>{p.name} — RS {p.price}</option>)}
                                  </select>
                                </div>
                              )}
                              {form.uploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#FF8C00"}}/></div>}
                              <button className="f-btn f-btn--orange" onClick={()=>addItemToSection(section)} disabled={form.uploading} style={{alignSelf:"flex-start"}}>{form.uploading?"Uploading…":"+ Add to This Carousel"}</button>
                            </div>
                          </div>
                          {items.length>0&&(
                            <div className="f-stack">
                              <div style={{fontSize:"0.7rem",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"#888"}}>Images in this carousel ({items.length})</div>
                              {(items as HpCarouselItem[]).map(item=>(
                                <div key={item.id} className="f-item-row">
                                  <img src={item.image_url} style={{width:120,height:74,objectFit:"cover",borderRadius:6,border:"2px solid #111",flexShrink:0}} alt=""/>
                                  <div style={{flex:1}}>
                                    <div style={{fontWeight:700,fontSize:"0.82rem",marginBottom:4}}>{item.link_type==="product"?"📦 Product":"🗂 Category"}</div>
                                    <code className="f-code">{item.link_value||"—"}</code>
                                  </div>
                                  <button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteHpItem(section,item.id)}>Remove</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {section.type==="brand_grid"&&(
                        <div className="f-stack">
                          <div style={{padding:"10px 14px",background:"#EFF6FF",border:"2px solid #BAE6FD",borderRadius:8,fontSize:"0.78rem",color:"#075985",fontWeight:600}}>
                            💡 Each brand can link to its own category, product, or a custom URL.
                          </div>
                          <div style={{background:"#fff",border:"2px solid #0EA5E9",borderRadius:10,padding:"16px",boxShadow:"3px 3px 0 #0EA5E9"}}>
                            <div style={{fontWeight:800,fontSize:"0.8rem",color:"#111",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>➕ Add Brand to This Section</div>
                            <div className="f-stack">
                              <div className="f-field"><label className="f-label">Brand Name</label><input className="f-input" placeholder="e.g. Garnier" value={form.brandName} onChange={e=>setForm(section.id,{brandName:e.target.value})}/></div>
                              <LinkSelector sectionId={section.id} supportsUrl={true}/>
                              <div className="f-field">
                                <label className="f-label">Logo</label>
                                <label className="f-file-btn">🖼 Choose Logo<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]||null;setForm(section.id,{brandLogo:f,brandLogoPreview:f?URL.createObjectURL(f):""});}}/></label>
                                {form.brandLogoPreview&&(
                                  <div style={{position:"relative",display:"inline-block",marginTop:10}}>
                                    <img src={form.brandLogoPreview} style={{height:52,maxWidth:160,objectFit:"contain",borderRadius:8,border:"2px solid #111",background:"#fff",padding:6,display:"block",boxShadow:"3px 3px 0 #0EA5E9"}} alt=""/>
                                    <button onClick={()=>setForm(section.id,{brandLogo:null,brandLogoPreview:""})} style={{position:"absolute",top:-8,right:-8,width:22,height:22,background:"#C03EFF",color:"#fff",border:"2px solid #111",borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                                  </div>
                                )}
                              </div>
                              {form.uploading&&<div className="f-prog"><div className="f-prog__bar" style={{width:`${uploadProgress}%`,background:"#0EA5E9"}}/></div>}
                              <button className="f-btn f-btn--blue" onClick={()=>addItemToSection(section)} disabled={form.uploading} style={{alignSelf:"flex-start"}}>{form.uploading?"Uploading…":"+ Add This Brand"}</button>
                            </div>
                          </div>
                          {items.length>0&&(
                            <div className="f-stack">
                              <div style={{fontSize:"0.7rem",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"#888"}}>Brands in this section ({items.length})</div>
                              <div className="f-table-wrap">
                                <table className="f-table">
                                  <thead><tr><th>Logo</th><th>Name</th><th>Links to</th><th></th></tr></thead>
                                  <tbody>
                                    {(items as HpBrandItem[]).map(item=>(
                                      <tr key={item.id}>
                                        <td>{item.logo_url?<img src={item.logo_url} style={{height:36,maxWidth:90,objectFit:"contain",background:"#fff",border:"2px solid #111",borderRadius:4,padding:3}} alt=""/>:<span style={{color:"#aaa",fontSize:"0.76rem"}}>No logo</span>}</td>
                                        <td><strong>{item.name}</strong></td>
                                        <td>{item.link_type==="none"||!item.link_value?<span style={{color:"#aaa",fontSize:"0.76rem"}}>No link</span>:<span className="f-badge-sm" style={item.link_type==="category"?{background:"#DCFCE7",borderColor:"#86EFAC",color:"#166534"}:{background:"#E0F2FE",borderColor:"#93C5FD",color:"#1e40af"}}>{item.link_type==="category"?"🗂":item.link_type==="product"?"📦":"🔗"} {item.link_value}</span>}</td>
                                        <td><button className="f-btn f-btn--red f-btn--sm" onClick={()=>deleteHpItem(section,item.id)}>Remove</button></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {activeTab==="settings"&&(
          <div className="f-section">
            <div className="f-card" style={{borderTopColor:"#C03EFF"}}>
              <h2 className="f-card-title">🛡 Admin Access</h2>
              <p className="f-hint">These emails have full admin dashboard access.</p>
              <div className="f-stack">
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {adminEmails.length===0&&<p className="f-empty">No admins loaded yet.</p>}
                  {adminEmails.map(email=>(
                    <div key={email} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#FFF1F3",border:"2px solid #FFB3C1",borderRadius:10,boxShadow:"2px 2px 0 #FFB3C1"}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"#C03EFF",border:"2px solid #111",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:"0.8rem",flexShrink:0}}>{email[0].toUpperCase()}</div>
                      <span style={{flex:1,fontWeight:600,fontSize:"0.85rem",color:"#111"}}>{email}</span>
                      <button className="f-btn f-btn--red f-btn--sm" onClick={()=>removeAdminEmail(email)}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="f-grid-2" style={{alignItems:"flex-end"}}>
                  <div className="f-field"><label className="f-label">Add Admin Email</label><input className="f-input" type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAdminEmail()}/></div>
                  <button className="f-btn f-btn--red" onClick={addAdminEmail} disabled={adminEmailsSaving}>{adminEmailsSaving?"Saving…":"+ Add Admin"}</button>
                </div>
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#25D366"}}>
              <h2 className="f-card-title">💬 WhatsApp Contact</h2>
              <p className="f-hint">Number with country code (e.g. 923001234567). Shows as floating button.</p>
              <div className="f-stack">
                <div className="f-grid-2" style={{alignItems:"flex-end"}}>
                  <div className="f-field"><label className="f-label">Phone Number</label><input className="f-input" placeholder="923001234567" value={whatsappNumber} onChange={e=>setWhatsappNumber(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveWhatsapp()}/></div>
                  <button className="f-btn f-btn--wa" onClick={saveWhatsapp} disabled={whatsappSaving}>{whatsappSaving?"Saving…":"💾 Save"}</button>
                </div>
                {whatsappNumber&&(
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#D1FAE5",border:"2px solid #6EE7B7",borderRadius:10,boxShadow:"2px 2px 0 #6EE7B7"}}>
                    <div style={{width:40,height:40,background:"#25D366",borderRadius:"50%",border:"2px solid #111",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>💬</div>
                    <div style={{flex:1}}><div style={{fontWeight:700,color:"#065f46"}}>+{whatsappNumber.replace(/\D/g,"")}</div><div style={{fontSize:"0.72rem",color:"#059669"}}>Active on site</div></div>
                    <a href={`https://wa.me/${whatsappNumber.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{fontWeight:700,color:"#065f46",textDecoration:"none",fontSize:"0.8rem"}}>Test ↗</a>
                  </div>
                )}
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#0EA5E9"}}>
              <h2 className="f-card-title">🔗 Social Media</h2>
              <p className="f-hint">Toggle which platforms show in the footer. Enter the full URL for each.</p>
              <div className="f-stack">
                {SOCIAL_PLATFORMS.map(platform=>(
                  <div key={platform.key} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f0f0f0"}}>
                    <button onClick={()=>setSocials(prev=>({...prev,[platform.key]:{...prev[platform.key],visible:!prev[platform.key].visible}}))} style={{width:36,height:20,borderRadius:100,border:"2px solid #111",cursor:"pointer",background:socials[platform.key].visible?platform.color:"#eee",transition:"background 0.2s",flexShrink:0,position:"relative",padding:0}}>
                      <span style={{position:"absolute",top:1,left:socials[platform.key].visible?15:1,width:14,height:14,borderRadius:"50%",background:"#fff",border:"1.5px solid #111",transition:"left 0.2s",display:"block"}}/>
                    </button>
                    <span style={{width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",color:socials[platform.key].visible?platform.color:"#ccc",flexShrink:0}} dangerouslySetInnerHTML={{__html:platform.icon}}/>
                    <span style={{fontWeight:600,fontSize:"0.82rem",color:"#111",minWidth:90,flexShrink:0}}>{platform.label}</span>
                    <input className="f-input" style={{flex:1}} placeholder={`https://${platform.key}.com/…`} value={socials[platform.key].url} onChange={e=>setSocials(prev=>({...prev,[platform.key]:{...prev[platform.key],url:e.target.value}}))} disabled={!socials[platform.key].visible}/>
                  </div>
                ))}
                <button className="f-btn f-btn--blue" onClick={saveSocials} disabled={socialsSaving} style={{alignSelf:"flex-start"}}>{socialsSaving?"Saving…":"💾 Save Social Links"}</button>
              </div>
            </div>
            <div className="f-card" style={{borderTopColor:"#F59E0B"}}>
              <h2 className="f-card-title">✉️ Footer Message</h2>
              <p className="f-hint">Short tagline shown at the bottom of the site. Leave empty to hide.</p>
              <div className="f-stack">
                <div className="f-field"><label className="f-label">Message</label><textarea className="f-input f-textarea" placeholder="e.g. Made with love in Pakistan 💖" value={footerMessage} onChange={e=>setFooterMessage(e.target.value)} style={{minHeight:70}}/></div>
                <div style={{display:"flex",gap:8}}>
                  <button className="f-btn f-btn--yellow" onClick={saveFooterMessage} disabled={footerMessageSaving}>{footerMessageSaving?"Saving…":"💾 Save"}</button>
                  {footerMessage&&<button className="f-btn f-btn--ghost" onClick={()=>setFooterMessage("")}>Clear</button>}
                </div>
                {footerMessage&&<div style={{padding:"10px 14px",background:"#FFFBEB",border:"2px solid #FCD34D",borderRadius:8,fontSize:"0.85rem",color:"#92400E",fontWeight:500}}>Preview: {footerMessage}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .f-page { min-height: 100vh; background: #f5f5f5; padding: 80px 20px 100px; font-family: 'Jost', sans-serif; }
  .f-header { max-width: 1000px; margin: 0 auto 28px; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
  .f-badge { display: inline-block; padding: 4px 12px; background: #C03EFF; color: #fff; border: 2px solid #111; border-radius: 6px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; box-shadow: 2px 2px 0 #111; margin-bottom: 8px; }
  .f-title { font-size: clamp(2rem,4vw,2.8rem); font-weight: 800; color: #111; letter-spacing: -0.04em; line-height: 1; }
  .f-stats { display: flex; gap: 10px; flex-wrap: wrap; }
  .f-stat { background: #fff; border: 2.5px solid #111; border-radius: 10px; padding: 12px 18px; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 80px; box-shadow: 3px 3px 0 #111; border-top-width: 4px; }
  .f-stat__n { font-size: 1.5rem; font-weight: 800; }
  .f-stat__l { font-size: 0.66rem; color: #666; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .f-tabs { max-width: 1000px; margin: 0 auto 24px; display: flex; gap: 6px; flex-wrap: wrap; }
  .f-tab { padding: 8px 16px; background: #fff; border: 2px solid #111; border-radius: 8px; font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 700; color: #444; cursor: pointer; transition: all 0.15s; box-shadow: 2px 2px 0 #ddd; display: flex; align-items: center; gap: 6px; }
  .f-tab:hover { transform: translateY(-2px); box-shadow: 3px 3px 0 #111; border-color: #111; color: #111; }
  .f-section { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
  .f-card { background: #fff; border: 2.5px solid #111; border-radius: 14px; padding: 24px; box-shadow: 4px 4px 0 #111; border-top-width: 5px; }
  .f-card-title { font-size: 1.05rem; font-weight: 800; color: #111; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .f-count { font-size: 0.72rem; font-weight: 700; background: #f0f0f0; color: #666; border: 1.5px solid #ddd; border-radius: 100px; padding: 2px 9px; }
  .f-hint { font-size: 0.78rem; color: #888; line-height: 1.6; margin-bottom: 16px; }
  .f-hint-text { font-size: 0.72rem; color: #00D084; font-weight: 600; margin-left: 4px; }
  .f-stack { display: flex; flex-direction: column; gap: 16px; }
  .f-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
  .f-field { display: flex; flex-direction: column; gap: 6px; }
  .f-label { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; color: #555; text-transform: uppercase; }
  .f-empty { font-size: 0.85rem; color: #aaa; padding: 16px 0; }
  .f-input { width: 100%; padding: 10px 13px; background: #f9f9f9; border: 2px solid #111; border-radius: 8px; font-family: 'Jost', sans-serif; font-size: 0.86rem; font-weight: 500; color: #111; transition: box-shadow 0.15s, background 0.15s; }
  .f-input:focus { outline: none; background: #fff; box-shadow: 3px 3px 0 #111; }
  .f-input::placeholder { color: #bbb; font-weight: 400; }
  .f-input:disabled { opacity: 0.4; cursor: not-allowed; }
  .f-textarea { min-height: 88px; resize: vertical; }
  .f-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; background-color: #f9f9f9; }
  .f-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border: 2px solid #111; border-radius: 8px; font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 800; cursor: pointer; transition: all 0.15s; white-space: nowrap; letter-spacing: 0.02em; }
  .f-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .f-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .f-btn--red    { background: #C03EFF; color: #fff; box-shadow: 3px 3px 0 #111; } .f-btn--red:hover:not(:disabled)    { box-shadow: 4px 5px 0 #111; }
  .f-btn--green  { background: #00D084; color: #111; box-shadow: 3px 3px 0 #111; } .f-btn--green:hover:not(:disabled)  { box-shadow: 4px 5px 0 #111; }
  .f-btn--yellow { background: #FFE14D; color: #111; box-shadow: 3px 3px 0 #111; } .f-btn--yellow:hover:not(:disabled) { box-shadow: 4px 5px 0 #111; }
  .f-btn--blue   { background: #0EA5E9; color: #fff; box-shadow: 3px 3px 0 #111; } .f-btn--blue:hover:not(:disabled)   { box-shadow: 4px 5px 0 #111; }
  .f-btn--orange { background: #FF8C00; color: #fff; box-shadow: 3px 3px 0 #111; } .f-btn--orange:hover:not(:disabled) { box-shadow: 4px 5px 0 #111; }
  .f-btn--wa     { background: #25D366; color: #fff; box-shadow: 3px 3px 0 #111; } .f-btn--wa:hover:not(:disabled)     { box-shadow: 4px 5px 0 #111; }
  .f-btn--pink   { background: #EC4899; color: #fff; box-shadow: 3px 3px 0 #111; } .f-btn--pink:hover:not(:disabled)   { box-shadow: 4px 5px 0 #111; }
  .f-btn--ghost  { background: #fff; color: #444; box-shadow: 2px 2px 0 #ddd; }    .f-btn--ghost:hover:not(:disabled)  { box-shadow: 3px 3px 0 #111; border-color: #111; color: #111; }
  .f-btn--sm { padding: 5px 12px; font-size: 0.72rem; }
  .f-file-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; background: #fff; border: 2px dashed #111; border-radius: 8px; font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 700; color: #444; cursor: pointer; transition: all 0.15s; }
  .f-file-btn:hover { background: #FFE14D; border-style: solid; box-shadow: 2px 2px 0 #111; }
  .f-clear-btn { display: inline-block; margin-left: 8px; padding: 4px 10px; background: #fff; border: 1.5px solid #111; border-radius: 6px; font-family: 'Jost', sans-serif; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
  .f-clear-btn:hover { background: #C03EFF; color: #fff; }
  .f-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: #f5f5f5; border: 1.5px solid #111; border-radius: 6px; cursor: pointer; font-size: 13px; text-decoration: none; color: #111; transition: all 0.15s; }
  .f-icon-btn:hover { background: #FFE14D; box-shadow: 2px 2px 0 #111; }
  .f-prog { height: 8px; background: #f0f0f0; border: 2px solid #111; border-radius: 100px; overflow: hidden; }
  .f-prog__bar { height: 100%; border-radius: 100px; transition: width 0.2s ease; }
  .f-table-wrap { overflow-x: auto; border: 2px solid #111; border-radius: 10px; }
  .f-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
  .f-table thead tr { background: #111; }
  .f-table th { padding: 10px 14px; text-align: left; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #fff; white-space: nowrap; }
  .f-table td { padding: 11px 14px; border-bottom: 1.5px solid #f0f0f0; color: #333; vertical-align: middle; }
  .f-table tbody tr:last-child td { border-bottom: none; }
  .f-table tbody tr:hover td { background: #FFFBEB; }
  .f-code { background: #f5f5f5; border: 1.5px solid #ddd; border-radius: 5px; padding: 2px 7px; font-size: 0.76rem; color: #555; }
  .f-badge-sm { display: inline-flex; padding: 2px 8px; background: #F3F4F6; border: 1.5px solid #ddd; border-radius: 100px; font-size: 0.71rem; font-weight: 700; color: #444; }
  .f-item-row { display: flex; align-items: center; gap: 14px; padding: 14px; background: #f9f9f9; border: 2px solid #111; border-radius: 10px; box-shadow: 2px 2px 0 #ddd; flex-wrap: wrap; }
  .f-toasts { position: fixed; bottom: 24px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
  .f-toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #fff; border: 2.5px solid #111; border-radius: 10px; box-shadow: 4px 4px 0 #111; font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 600; color: #111; min-width: 240px; max-width: 360px; pointer-events: all; animation: fToastIn 0.25s cubic-bezier(.22,1,.36,1) both; }
  @keyframes fToastIn { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: none; } }
  .f-toast--success { border-color: #00D084; box-shadow: 4px 4px 0 #00D084; }
  .f-toast--error   { border-color: #C03EFF; box-shadow: 4px 4px 0 #C03EFF; }
  .f-toast--info    { border-color: #0EA5E9; box-shadow: 4px 4px 0 #0EA5E9; }
  .f-toast__dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #111; flex-shrink: 0; }
  .f-toast--success .f-toast__dot { background: #00D084; }
  .f-toast--error   .f-toast__dot { background: #C03EFF; }
  .f-toast--info    .f-toast__dot { background: #0EA5E9; }
  .f-toast__msg { flex: 1; }
  .f-toast__x { background: none; border: none; font-size: 18px; cursor: pointer; color: #888; padding: 0; line-height: 1; }
  .f-toast__x:hover { color: #111; }
  .f-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
  .f-dialog { background: #fff; border: 3px solid #111; border-radius: 16px; padding: 32px 28px; max-width: 360px; width: 100%; text-align: center; box-shadow: 6px 6px 0 #111; animation: fPopIn 0.22s cubic-bezier(.22,1,.36,1) both; }
  @keyframes fPopIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
  .f-dialog__icon { font-size: 2.5rem; margin-bottom: 14px; }
  .f-dialog__msg { font-size: 0.9rem; color: #444; line-height: 1.6; margin-bottom: 22px; font-family: 'Jost', sans-serif; }
  .f-dialog__btns { display: flex; gap: 10px; justify-content: center; }
  .f-modal { background: #fff; border: 3px solid #111; border-radius: 16px; width: 100%; max-width: 540px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 6px 6px 0 #111; overflow: hidden; animation: fPopIn 0.22s cubic-bezier(.22,1,.36,1) both; }
  .f-modal__head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 2px solid #111; background: #111; }
  .f-modal__title { font-size: 1rem; font-weight: 800; color: #fff; }
  .f-modal__close { width: 30px; height: 30px; background: #C03EFF; border: 2px solid #fff; border-radius: 6px; color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .f-modal__body { overflow-y: auto; padding: 20px 22px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
  .f-modal__foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 2px solid #111; background: #f9f9f9; }
  .f-img-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px; background: #f5f5f5; border: 2px solid #111; border-radius: 10px; }
  .f-img-preview { width: 96px; height: 70px; border-radius: 8px; border: 2px solid #111; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #e0e0e0; font-size: 0.72rem; color: #888; }
  .f-img-preview img { width: 100%; height: 100%; object-fit: cover; }
  .f-upload-bar { position: fixed; top: 62px; left: 0; right: 0; z-index: 200; background: #111; padding: 8px 24px; display: flex; align-items: center; gap: 14px; }
  .f-upload-bar span { font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 700; color: #fff; white-space: nowrap; }
  .f-upload-bar__track { flex: 1; height: 6px; background: rgba(255,255,255,0.2); border-radius: 100px; overflow: hidden; }
  .f-upload-bar__fill { height: 100%; background: #FFE14D; border-radius: 100px; transition: width 0.2s; }
  @media (max-width: 600px) {
    .f-grid-2 { grid-template-columns: 1fr; }
    .f-header { flex-direction: column; align-items: flex-start; }
    .f-stats { width: 100%; }
    .f-stat { flex: 1; }
    .f-toasts { left: 14px; right: 14px; }
    .f-toast { min-width: unset; }
    .f-modal { max-height: 95vh; }
    .f-img-row { flex-direction: column; }
  }
`;