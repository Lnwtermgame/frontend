"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDollarSign, ShoppingCart, Package, Users, TrendingUp, Activity,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  AdminLayout, AdminPageHeader, PageContainer, StatCard, StatusBadge,
} from "@/components/admin";
import {
  analyticsApi, DashboardStats, RecentOrder, PopularProduct,
} from "@/lib/services/analytics-api";
import { getMinPrice, formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";

interface Data {
  stats: DashboardStats | null;
  recentOrders: RecentOrder[];
  popularProducts: PopularProduct[];
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();
  const [data, setData] = useState<Data>({ stats: null, recentOrders: [], popularProducts: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && !isAdmin) router.push("/");
  }, [isAdmin, isInitialized, router]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const [s, o, p] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getRecentOrders(10),
          analyticsApi.getPopularProducts(5),
        ]);
        setData({ stats: s.data, recentOrders: o.data, popularProducts: p.data });
      } catch (err) { setError("ไม่สามารถโหลดข้อมูลได้"); console.error(err); }
    })();
  }, [isAdmin]);

  const s = data.stats;

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title="แดชบอร์ดผู้ดูแลระบบ"
          description={`ภาพรวมร้านวันนี้ · ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}`}
        />

        {error && (
          <div className="bg-semantic-rose/10 border border-semantic-rose/30 rounded-lg text-semantic-rose px-3 py-2 text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="ยอดขายรวม" value={s ? formatCurrency(s.sales.total) : "฿0"} change={s?.sales.percent ?? 0} trend={s?.sales.isUp ? "up" : "down"} icon={CircleDollarSign} semantic="blue" subtitle={`วันนี้: ${s ? formatCurrency(s.sales.today) : "฿0"}`} />
          <StatCard title="คำสั่งซื้อ" value={s?.orders.total.toLocaleString() ?? "0"} change={s?.orders.percent ?? 0} trend={s?.orders.isUp ? "up" : "down"} icon={ShoppingCart} semantic="violet" subtitle={`วันนี้: ${s?.orders.today.toLocaleString() ?? "0"}`} />
          <StatCard title="สินค้า" value={s?.products.total.toLocaleString() ?? "0"} change={s?.products.percent ?? 0} trend="up" icon={Package} semantic="green" subtitle={`ใช้งาน: ${s?.products.active.toLocaleString() ?? "0"}`} />
          <StatCard title="ผู้ใช้" value={s?.users.total.toLocaleString() ?? "0"} change={s?.users.percent ?? 0} trend={s?.users.isUp ? "up" : "down"} icon={Users} semantic="amber" subtitle={`ใหม่วันนี้: ${s?.users.today.toLocaleString() ?? "0"}`} />
        </div>

        {/* Recent orders + popular products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden">
            <div className="px-4 py-3 border-b border-site-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold text-site-text flex items-center gap-2">
                <Activity className="w-4 h-4 text-site-accent" /> คำสั่งซื้อล่าสุด
              </h3>
              <Link href="/admin/orders" className="text-[11px] text-site-muted hover:text-site-accent">ดูทั้งหมด →</Link>
            </div>
            <div className="divide-y divide-site-border-soft">
              {data.recentOrders.length > 0 ? data.recentOrders.map((o) => (
                <div key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-site-raised/50 cursor-pointer">
                  <span className="font-mono text-[11px] text-site-muted w-20">{o.orderNumber}</span>
                  <span className="text-xs text-site-text flex-1 truncate">{o.user.username}</span>
                  <span className="text-xs font-semibold">{formatCurrency(o.finalAmount)}</span>
                  <StatusBadge status={o.status} />
                </div>
              )) : <p className="px-4 py-8 text-center text-xs text-site-dim">ไม่มีคำสั่งซื้อ</p>}
            </div>
          </div>

          <div className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden">
            <div className="px-4 py-3 border-b border-site-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold text-site-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-site-accent" /> สินค้าขายดี
              </h3>
              <Link href="/admin/products" className="text-[11px] text-site-muted hover:text-site-accent">ดูทั้งหมด →</Link>
            </div>
            <div className="p-3 space-y-2">
              {data.popularProducts.length > 0 ? data.popularProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-site-raised/50">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${i < 3 ? "bg-site-accent/12 text-site-accent border border-site-accent/20" : "bg-site-raised text-site-dim border border-site-border"}`}>{i + 1}</span>
                  <span className="text-xs font-medium text-site-text flex-1 truncate">{p.name}</span>
                  <span className="text-xs font-semibold">{p.revenue ? formatCurrency(p.revenue) : formatPrice(getMinPrice(p.types))}</span>
                </div>
              )) : <p className="py-8 text-center text-xs text-site-dim">ไม่มีข้อมูล</p>}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: "จัดการสินค้า", desc: "เพิ่ม แก้ไข ลบ", icon: Package, href: "/admin/products" },
            { title: "คำสั่งซื้อ", desc: "ตรวจสอบออเดอร์", icon: ShoppingCart, href: "/admin/orders" },
            { title: "ซิงค์ SEAGM", desc: "ดึงสินค้าจาก SEAGM", icon: RefreshCw, href: "/admin/seagm-sync" },
            { title: "ผู้ใช้งาน", desc: "จัดการสมาชิก", icon: Users, href: "/admin/users" },
          ].map((q) => (
            <Link key={q.href} href={q.href}>
              <div className="bg-site-surface border border-site-border-soft rounded-12 p-4 hover:border-site-accent/30 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-site-accent/10 border border-site-accent/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <q.icon className="w-4 h-4 text-site-accent" />
                </div>
                <h4 className="text-sm font-bold text-site-text">{q.title}</h4>
                <p className="text-[11px] text-site-muted mt-0.5">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
