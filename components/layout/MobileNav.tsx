"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Briefcase,
  Clock, ShoppingCart, Settings,
} from "lucide-react";

const items = [
  { label: "Dashboard",  href: "/dashboard",      icon: <LayoutDashboard size={20} /> },
  { label: "Kunden",     href: "/kunden",          icon: <Users size={20} /> },
  { label: "Angebote",   href: "/angebote",        icon: <FileText size={20} /> },
  { label: "Projekte",   href: "/projekte",        icon: <Briefcase size={20} /> },
  { label: "Zeit",       href: "/zeiterfassung",   icon: <Clock size={20} /> },
  { label: "Einkauf",    href: "/einkaufsliste",   icon: <ShoppingCart size={20} /> },
  { label: "Einstellungen", href: "/einstellungen", icon: <Settings size={20} /> },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      style={{
        background: "#112240",
        borderTop: "1px solid #1e3a5f",
        /* Sicherstellen, dass die Nav-Bar nie über die sichere Bildschirm-
           untergrenze hinausragt (iPhone Home-Indicator) */
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Scrollbarer Container – kein Clipping, kein harter Overflow */}
      <div
        className="flex w-full overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.mobile-nav-scroll::-webkit-scrollbar { display: none; }`}</style>

        <div className="mobile-nav-scroll flex w-full">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-2 gap-0.5 transition-all"
                style={{
                  color: active ? "#00c6ff" : "#4a5568",
                  /* Jedes Item bekommt gleichen Anteil; min-width verhindert
                     Zusammenquetschen auf sehr schmalen Screens */
                  flex: "1 0 0",
                  minWidth: "52px",
                }}
              >
                {item.icon}
                <span
                  className="font-medium leading-none"
                  style={{ fontSize: "9px" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
