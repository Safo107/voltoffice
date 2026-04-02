import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Impressum — VoltOffice",
  description: "Impressum von VoltOffice, der Handwerkersoftware für Elektrobetriebe.",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0d1b2e", color: "#e6edf3" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4" style={{ background: "#112240", borderBottom: "1px solid #1e3a5f" }}>
        <Link href="/" className="flex items-center gap-3 text-sm transition-opacity hover:opacity-70" style={{ color: "#8b9ab5" }}>
          <ArrowLeft size={16} />
          Zurück
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg, #00c6ff, #0099cc)" }}>
            <Zap size={14} style={{ color: "#0d1b2e" }} />
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: "var(--font-syne)", color: "#e6edf3" }}>VoltOffice</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-syne)", color: "#e6edf3" }}>
          Impressum
        </h1>
        <p className="text-sm mb-10" style={{ color: "#8b9ab5" }}>Angaben gemäß § 5 TMG</p>

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#00c6ff" }}>Anbieter</h2>
          <div className="rounded-xl p-5 text-sm leading-relaxed space-y-1" style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#c8dff0" }}>
            <p><strong style={{ color: "#e6edf3" }}>ElektroGenius</strong></p>
            <p>Safin Deler Yezdin Al Ali</p>
            <p>c/o Postflex PFX-938-000</p>
            <p>Emsdettener Str. 10</p>
            <p>48268 Greven</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#00c6ff" }}>Kontakt</h2>
          <div className="rounded-xl p-5 text-sm leading-relaxed" style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#c8dff0" }}>
            <p>E-Mail: <a href="mailto:info@elektrogenius.de" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>info@elektrogenius.de</a></p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#00c6ff" }}>Plattform</h2>
          <div className="rounded-xl p-5 text-sm leading-relaxed" style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#c8dff0" }}>
            <p>
              <a href="https://voltoffice.elektrogenius.de" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
                https://voltoffice.elektrogenius.de
              </a>
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#00c6ff" }}>Verantwortlich für den Inhalt</h2>
          <div className="rounded-xl p-5 text-sm leading-relaxed" style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#c8dff0" }}>
            <p>Gemäß § 55 Abs. 2 RStV:</p>
            <p className="mt-1"><strong style={{ color: "#e6edf3" }}>Safin Deler Yezdin Al Ali</strong></p>
            <p>c/o Postflex PFX-938-000, Emsdettener Str. 10, 48268 Greven</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#00c6ff" }}>Haftungsausschluss</h2>
          <div className="rounded-xl p-5 text-sm leading-relaxed space-y-3" style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#c8dff0" }}>
            <p>
              <strong style={{ color: "#e6edf3" }}>Haftung für Inhalte:</strong>{" "}
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            </p>
            <p>
              <strong style={{ color: "#e6edf3" }}>Haftung für Links:</strong>{" "}
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#00c6ff" }}>Urheberrecht</h2>
          <div className="rounded-xl p-5 text-sm leading-relaxed" style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#c8dff0" }}>
            <p>
              Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-4 pt-4 text-xs" style={{ color: "#4a5568", borderTop: "1px solid #1e3a5f" }}>
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-[#8b9ab5]"><ArrowLeft size={13} />Zurück zur App</Link>
          <span>·</span>
          <Link href="/datenschutz" className="transition-colors hover:text-[#8b9ab5]">Datenschutzerklärung</Link>
        </div>
      </main>
    </div>
  );
}
