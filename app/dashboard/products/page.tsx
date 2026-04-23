// app/dashboard/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/providers/AppProviders";
import {
  Package, Plus, Trash2, Pencil, Check, X,
  Search, CheckCircle2, XCircle, Loader2,
} from "lucide-react";

type ProductStatus = "Active" | "Inactive" | "Draft";

type Product = {
  id: string; name: string; sku: string;
  category: string; price: number; stock: number;
  status: ProductStatus; description: string;
  createdAt: { seconds: number } | null;
};

const STATUS_STYLE: Record<ProductStatus, { bg: string; text: string; border: string }> = {
  Active:   { bg: "var(--green-dim)",  text: "var(--green)",   border: "var(--green-border)" },
  Inactive: { bg: "var(--surface2)",   text: "var(--ink-dim)", border: "var(--border)"       },
  Draft:    { bg: "var(--blue-dim)",   text: "var(--blue)",    border: "var(--blue-border)"  },
};

type ProductForm = {
  name: string; sku: string; category: string;
  price: string; stock: string; status: ProductStatus; description: string;
};
const EMPTY: ProductForm = {
  name: "", sku: "", category: "", price: "", stock: "", status: "Active", description: "",
};

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<ProductForm>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({
        id: d.id,
        name:        d.data().name        || "",
        sku:         d.data().sku         || "",
        category:    d.data().category    || "",
        price:       d.data().price       || 0,
        stock:       d.data().stock       || 0,
        status:      (d.data().status as ProductStatus) || "Active",
        description: d.data().description || "",
        createdAt:   d.data().createdAt   || null,
      })));
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) { showToast("Product name is required", false); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock)   || 0,
      };
      if (editId) {
        await updateDoc(doc(db, "products", editId), payload);
        showToast("Product updated", true);
      } else {
        await addDoc(collection(db, "products"), {
          ...payload, createdBy: user?.email ?? "", createdAt: serverTimestamp(),
        });
        showToast("Product added", true);
      }
      setForm(EMPTY); setShowForm(false); setEditId(null);
    } catch (err) { console.error(err); showToast("Failed to save product", false); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Product) => {
    setForm({
      name: p.name, sku: p.sku, category: p.category,
      price: String(p.price), stock: String(p.stock),
      status: p.status, description: p.description,
    });
    setEditId(p.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    try { await deleteDoc(doc(db, "products", id)); showToast("Product deleted", true); }
    catch (err) { console.error(err); showToast("Failed to delete product", false); }
    finally { setDeleting(null); }
  };

  const filtered = products.filter((p) =>
    [p.name, p.sku, p.category, p.description].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const statuses: ProductStatus[] = ["Active", "Inactive", "Draft"];
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <RoleGuard page="Products">
      <div className="font-mono text-ink">

        {toast && (
          <div className="fixed z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl font-sans text-sm
                         bottom-6 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 sm:w-auto"
            style={{ background: toast.ok ? "var(--green-dim)" : "var(--red-dim)", borderColor: toast.ok ? "var(--green-border)" : "var(--red)", color: toast.ok ? "var(--green)" : "var(--red)" }}>
            {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {toast.msg}
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Package size={24} className="text-orange" strokeWidth={1.75} />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">Products</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-6 sm:w-8 bg-orange rounded" />
            <p className="text-ink-muted text-xs sm:text-sm font-light">Manage your product catalogue and inventory</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Products", value: products.length },
            { label: "Active",         value: products.filter((p) => p.status === "Active").length },
            { label: "Categories",     value: new Set(products.map((p) => p.category).filter(Boolean)).size },
            { label: "Inventory Value",value: `₹${totalValue.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-2xl font-serif font-bold text-ink">{value}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-ghost mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
            <input type="text" placeholder="Search by name, SKU or category…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange hover:opacity-90 text-white rounded-xl text-xs font-mono transition-all shadow-lg shadow-orange/20 shrink-0">
            <Plus size={14} /> Add Product
          </button>
        </div>

        {showForm && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
            <h2 className="font-serif text-base font-semibold text-ink mb-4">{editId ? "Edit Product" : "New Product"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input placeholder="Product Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input placeholder="SKU (optional)" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input placeholder="Category" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input type="number" placeholder="Price" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <input type="number" placeholder="Stock Quantity" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink focus:border-orange outline-none transition-colors">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input placeholder="Description (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors sm:col-span-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-orange hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-mono transition-all">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {saving ? "Saving…" : editId ? "Update" : "Save"}
              </button>
              <button onClick={() => { setForm(EMPTY); setShowForm(false); setEditId(null); }}
                className="flex items-center gap-2 px-4 py-2 border border-border bg-surface2 hover:border-orange-border text-ink-muted hover:text-orange rounded-xl text-xs font-mono transition-all">
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-ink-muted text-sm font-sans">
              <Loader2 size={18} className="animate-spin text-orange" /> Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-ghost text-sm font-sans">
              {search ? "No products match your search." : "No products yet. Add one above."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 700 }}>
                <thead>
                  <tr className="bg-surface2 border-b border-border">
                    {["Name", "SKU", "Category", "Price", "Stock", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] uppercase tracking-widest font-normal text-ink-dim">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const s = STATUS_STYLE[p.status];
                    return (
                      <tr key={p.id} className={`border-b border-border last:border-none ${i % 2 === 0 ? "bg-surface" : "bg-surface2/40"}`}>
                        <td className="px-5 py-3.5 text-sm font-sans font-medium text-ink">{p.name}</td>
                        <td className="px-5 py-3.5 text-xs font-mono text-ink-dim">{p.sku || "—"}</td>
                        <td className="px-5 py-3.5 text-sm font-sans text-ink-muted">{p.category || "—"}</td>
                        <td className="px-5 py-3.5 text-sm font-mono text-ink">₹{p.price.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-sm font-mono text-ink">
                          <span className={p.stock === 0 ? "text-red" : p.stock < 5 ? "text-orange" : "text-ink"}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border"
                            style={{ background: s.bg, color: s.text, borderColor: s.border }}>{p.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => handleEdit(p)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-orange-border hover:text-orange text-ink-dim transition-all">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-red hover:text-red text-ink-dim transition-all disabled:opacity-50">
                              {deleting === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!loading && (
          <p className="text-[10px] font-mono text-ink-ghost mt-3 text-right">
            {filtered.length} of {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </RoleGuard>
  );
}