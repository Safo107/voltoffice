"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import Modal from "@/components/ui/Modal";
import { usePro } from "@/context/ProContext";
import {
  Users, FileText, Briefcase, Clock, AlertCircle, ArrowRight,
} from "lucide-react";
import WorkdayProgressWidget from "@/components/widgets/WorkdayProgressWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import OpenInvoicesWidget from "@/components/widgets/OpenInvoicesWidget";
import TodayOnSiteWidget from "@/components/widgets/TodayOnSiteWidget";
import TimeTrackerWidget from "@/components/widgets/TimeTrackerWidget";

interface DashboardStats {
  customerCount: number;
  customerLimit: number;
  offerCount: number;
  offerLimit: number;
  projectCount: number;
  projectLimit: number;
  hoursThisWeek: number;
  openOfferValue: number;
}

interface OpenOffer {
  _id?: string;
  number: string;
  customerName: string;
  total: number;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isPro } = usePro();
  const [activityModal, setActivityModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openOffers, setOpenOffers] = useState<OpenOffer[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, offersRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/angebote"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (offersRes.ok) {
          const all: OpenOffer[] = await offersRes.json();
          setOpenOffers(all.filter((a) => a.status === "draft" || a.status === "sent").slice(0, 3));
        }
      } catch {
        //
      } finally {
        setLoadingStats(false);
      }
    };
    load();
  }, []);

  const s = stats;
  const effectiveOfferLimit = isPro ? undefined : (s?.offerLimit ?? 3);
  const effectiveProjectLimit = isPro ? undefined : (s?.projectLimit ?? 3);
  const effectiveCustomerLimit = isPro ? undefined : (s?.customerLimit ?? 5);

  return (
    <DashboardLayout title="Dashboard" subtitle="Übersicht Ihres Betriebs">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Kunden"
          value={loadingStats ? "…" : String(s?.customerCount ?? 0)}
          icon={<Users size={20} />}
          accent="cyan"
          current={s?.customerCount}
          limit={effectiveCustomerLimit}
          sublabel={isPro ? "Unbegrenzt (Pro)" : `Free: bis zu ${s?.customerLimit ?? 5} Kunden`}
        />
        <StatCard
          label="Offene Angebote"
          value={loadingStats ? "…" : String(s?.offerCount ?? 0)}
          icon={<FileText size={20} />}
          accent="orange"
          current={s?.offerCount}
          limit={effectiveOfferLimit}
          sublabel={s?.openOfferValue ? `Gesamtwert: ${(s.openOfferValue).toLocaleString("de-DE")} €` : "Keine offenen Angebote"}
        />
        <StatCard
          label="Aktive Projekte"
          value={loadingStats ? "…" : String(s?.projectCount ?? 0)}
          icon={<Briefcase size={20} />}
          accent="green"
          current={s?.projectCount}
          limit={effectiveProjectLimit}
          sublabel={isPro ? "Unbegrenzt (Pro)" : `Free: bis zu ${s?.projectLimit ?? 3} Projekte`}
        />
        <StatCard
          label="Stunden diese Woche"
          value={loadingStats ? "…" : `${s?.hoursThisWeek ?? 0}h`}
          icon={<Clock size={20} />}
          accent="muted"
          sublabel="Zeiterfassung"
        />
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <WorkdayProgressWidget />
        <TimeTrackerWidget />
        <TodayOnSiteWidget />
        <WeatherWidget />
        <OpenInvoicesWidget />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Open Offers */}
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
                Offene Angebote
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f5a62322", color: "#f5a623", border: "1px solid #f5a62344" }}>
                {openOffers.length} offen
              </span>
            </div>

            {openOffers.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "#8b9ab5" }}>Keine offenen Angebote</p>
            ) : (
              <div className="space-y-2">
                {openOffers.map((offer) => (
                  <div
                    key={offer._id || offer.number}
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                    style={{ background: "#0d1b2e", border: "1px solid #1e3a5f" }}
                    onClick={() => router.push("/angebote")}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6ff33"; e.currentTarget.style.background = "#00c6ff08"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.background = "#0d1b2e"; }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>#{offer.number}</p>
                      <p className="text-xs" style={{ color: "#8b9ab5" }}>{offer.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "#00c6ff" }}>
                        {(offer.total || 0).toLocaleString("de-DE")} €
                      </p>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={offer.status === "sent"
                          ? { background: "#00c6ff18", color: "#00c6ff" }
                          : { background: "#8b9ab518", color: "#8b9ab5" }}
                      >
                        {offer.status === "sent" ? "Versendet" : "Entwurf"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isPro && s && s.offerCount >= (s.offerLimit - 1) && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#00c6ff08", border: "1px solid #00c6ff22" }}>
              <AlertCircle size={16} className="shrink-0" style={{ color: "#00c6ff", marginTop: 1 }} />
              <div>
                <p className="text-sm font-medium mb-0.5" style={{ color: "#e6edf3" }}>
                  Free-Plan: {s.offerCount} von {s.offerLimit} Angeboten genutzt
                </p>
                <p className="text-xs" style={{ color: "#8b9ab5" }}>
                  Mit Pro unbegrenzte Angebote und Rechnungen erstellen.
                </p>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
            <h2 className="text-base font-bold mb-3" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              Schnellaktionen
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Angebot erstellen", icon: <FileText size={14} />, color: "#00c6ff", href: "/angebote" },
                { label: "Kunde anlegen", icon: <Users size={14} />, color: "#f5a623", href: "/kunden" },
                { label: "Zeit erfassen", icon: <Clock size={14} />, color: "#22c55e", href: "/zeiterfassung" },
                { label: "Projekt erstellen", icon: <Briefcase size={14} />, color: "#8b9ab5", href: "/projekte" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium text-left transition-all"
                  style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", color: "#e6edf3" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${action.color}44`; e.currentTarget.style.background = `${action.color}0a`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.background = "#0d1b2e"; }}
                >
                  <span style={{ color: action.color }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity placeholder */}
        <div className="rounded-xl p-5" style={{ background: "#112240", border: "1px solid #1e3a5f" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: "#e6edf3", fontFamily: "var(--font-syne)" }}>
              Letzte Aktivitäten
            </h2>
            <button
              onClick={() => setActivityModal(true)}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "#00c6ff" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#00c6ffcc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#00c6ff"; }}
            >
              Alle anzeigen <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: "#4a5568" }}>
            <Clock size={28} />
            <p className="text-sm text-center" style={{ color: "#8b9ab5" }}>
              Aktivitäts-Feed kommt in einer der nächsten Versionen.
            </p>
          </div>
        </div>
      </div>

      <Modal open={activityModal} onClose={() => setActivityModal(false)} title="Alle Aktivitäten">
        <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ color: "#4a5568" }}>
          <Clock size={28} />
          <p className="text-sm" style={{ color: "#8b9ab5" }}>Aktivitäts-Feed kommt bald.</p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
