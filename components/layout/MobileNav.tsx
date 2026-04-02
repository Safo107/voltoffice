"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Briefcase, Settings } from "lucide-react";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Kunden", href: "/kunden", icon: <Users size={20} /> },
  { label: "Angebote", href: "/angebote", icon: <FileText size={20} /> },
  { label: "Projekte", href: "/projekte", icon: <Briefcase size={20} /> },
  { label: "Einstellungen", href: "/einstellungen", icon: <Settings size={20} /> },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      style={{ background: "#112240", borderTop: "1px solid #1e3a5f" }}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all"
            style={{ color: active ? "#00c6ff" : "#4a5568" }}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
