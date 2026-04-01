"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1b2e" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#00c6ff", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ background: "#0d1b2e" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        <footer className="hidden md:flex shrink-0 items-center justify-center gap-4 px-6 py-2 text-xs" style={{ borderTop: "1px solid #1e3a5f", color: "#4a5568" }}>
          <span>© 2026 ElektroGenius</span>
          <span>·</span>
          <Link href="/impressum" className="transition-colors hover:text-[#8b9ab5]">Impressum</Link>
          <span>·</span>
          <Link href="/datenschutz" className="transition-colors hover:text-[#8b9ab5]">Datenschutz</Link>
        </footer>
        <MobileNav />
      </div>
    </div>
  );
}
