import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Datenschutzerklärung — VoltOffice",
  description: "Datenschutzerklärung von VoltOffice gemäß DSGVO.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold mb-3" style={{ color: "#00c6ff" }}>{title}</h2>
      <div className="rounded-xl p-5 text-sm leading-relaxed space-y-3" style={{ background: "#112240", border: "1px solid #1e3a5f", color: "#c8dff0" }}>
        {children}
      </div>
    </section>
  );
}

export default function DatenschutzPage() {
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
          Datenschutzerklärung
        </h1>
        <p className="text-sm mb-10" style={{ color: "#8b9ab5" }}>Gemäß DSGVO (EU) 2016/679 — Stand: April 2026</p>

        <Section title="1. Verantwortlicher">
          <p>
            <strong style={{ color: "#e6edf3" }}>Safin Deler Yezdin Al Ali</strong><br />
            c/o Postflex PFX-938-000<br />
            Emsdettener Str. 10<br />
            48268 Greven<br />
            Deutschland
          </p>
          <p>
            E-Mail:{" "}
            <a href="mailto:info@elektrogenius.de" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              info@elektrogenius.de
            </a>
          </p>
          <p>
            VoltOffice wird unter{" "}
            <a href="https://voltoffice.elektrogenius.de" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              voltoffice.elektrogenius.de
            </a>{" "}
            betrieben — einer Subdomain der Hauptdomain elektrogenius.de, die vollständig im Eigentum von Safin Deler Yezdin Al Ali steht.
          </p>
        </Section>

        <Section title="2. Erhobene Daten & Zweck">
          <p>
            Wir verarbeiten personenbezogene Daten ausschließlich zur Bereitstellung der VoltOffice-Plattform. Konkret werden folgende Daten verarbeitet:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1" style={{ color: "#c8dff0" }}>
            <li>E-Mail-Adresse und Passwort (Authentifizierung)</li>
            <li>Google-Profildaten bei Google-Anmeldung (Name, E-Mail, Profilbild)</li>
            <li>2-Faktor-Authentifizierung (TOTP): verschlüsselte TOTP-Geheimnisse zur Kontosicherheit</li>
            <li>Betriebsdaten: Kunden, Angebote, Projekte, Rechnungen, Zeiterfassung, Materialverwaltung</li>
            <li>Mitarbeiterdaten: Namen, Rollen (bei Business-Plan)</li>
            <li>Zahlungs- und Abonnementdaten (Stripe-Kunden-ID, Abonnementstatus, Plan)</li>
            <li>Benachrichtigungen (systemintern erzeugte Hinweise zu überfälligen Rechnungen etc.)</li>
            <li>Technische Zugriffsdaten: IP-Adresse, Browser, Datum/Uhrzeit</li>
          </ul>
          <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem Betrieb).</p>
        </Section>

        <Section title="3. Firebase Authentication (Google)">
          <p>
            VoltOffice nutzt <strong style={{ color: "#e6edf3" }}>Firebase Authentication</strong> von Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA zur Verwaltung von Nutzerkonten.
          </p>
          <p>
            Unterstützte Anmeldemethoden: E-Mail/Passwort sowie Google Sign-In. Bei der Nutzung von Google Sign-In werden Daten (Name, E-Mail, Profilbild) von Google an Firebase übertragen. Die Daten werden auf Google-Servern in den USA gespeichert. Die Datenübertragung in die USA erfolgt auf Grundlage der Standardvertragsklauseln der EU-Kommission (Art. 46 Abs. 2 lit. c DSGVO).
          </p>
          <p>
            Datenschutzrichtlinie von Google:{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              policies.google.com/privacy
            </a>
          </p>
        </Section>

        <Section title="4. MongoDB Atlas (Datenspeicherung)">
          <p>
            Betriebsdaten (Kunden, Angebote, Projekte, Rechnungen, Zeiterfassung, Materialien, Mitarbeiter, Benachrichtigungen) werden in{" "}
            <strong style={{ color: "#e6edf3" }}>MongoDB Atlas</strong> von MongoDB, Inc., 1633 Broadway, 38th Floor, New York, NY 10019, USA gespeichert.
          </p>
          <p>
            Die Server befinden sich in den USA. Die Datenübertragung erfolgt auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). MongoDB Atlas ist nach ISO 27001 zertifiziert und verwendet AES-256-Verschlüsselung im Ruhezustand. Alle gespeicherten Datensätze sind durch eine userId-Zuordnung strikt auf den jeweiligen Nutzer begrenzt.
          </p>
          <p>
            Datenschutzrichtlinie von MongoDB:{" "}
            <a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noopener" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              mongodb.com/legal/privacy-policy
            </a>
          </p>
        </Section>

        <Section title="5. Stripe (Zahlungsabwicklung)">
          <p>
            Die Zahlungsabwicklung für kostenpflichtige Abonnements (Pro-Plan: 19,99 €/Monat, Business-Plan: 29,99 €/Monat) erfolgt über{" "}
            <strong style={{ color: "#e6edf3" }}>Stripe</strong> (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland).
          </p>
          <p>
            Stripe verarbeitet als Auftragsverarbeiter gemäß Art. 28 DSGVO folgende Daten: Kreditkarten- bzw. Zahlungsdaten, E-Mail-Adresse, Rechnungsadresse sowie Abonnementdaten. Zahlungsdaten (Kartennummern) werden ausschließlich bei Stripe gespeichert und niemals an unsere Server übertragen.
          </p>
          <p>
            In VoltOffice wird lediglich die Stripe-Kunden-ID sowie der Abonnementstatus (aktiv/inaktiv, Plan, Testzeitraum) in unserer Datenbank gespeichert.
          </p>
          <p>
            Datenschutzrichtlinie von Stripe:{" "}
            <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              stripe.com/de/privacy
            </a>
          </p>
        </Section>

        <Section title="6. Vercel (Hosting)">
          <p>
            VoltOffice wird gehostet auf <strong style={{ color: "#e6edf3" }}>Vercel</strong> (Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA). Vercel verarbeitet technische Zugriffsdaten (IP-Adresse, Anfragezeitpunkt, aufgerufene URL, Browser-Informationen) in Server-Logs zum Zweck des Betriebs und der Sicherheit.
          </p>
          <p>
            Serverstandort: primär USA und EU-Regionen (je nach Edge-Routing). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabilem, sicherem Betrieb).
          </p>
          <p>
            Datenschutzrichtlinie von Vercel:{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              vercel.com/legal/privacy-policy
            </a>
          </p>
        </Section>

        <Section title="7. 2-Faktor-Authentifizierung (TOTP)">
          <p>
            VoltOffice bietet eine optionale Zwei-Faktor-Authentifizierung auf Basis von <strong style={{ color: "#e6edf3" }}>TOTP (Time-based One-Time Passwords)</strong> gemäß RFC 6238 an. Beim Aktivieren der 2FA wird ein verschlüsseltes TOTP-Geheimnis in unserer Datenbank gespeichert.
          </p>
          <p>
            Dieses Geheimnis wird ausschließlich zur Validierung von Einmal-Codes beim Login verwendet und niemals an Dritte weitergegeben. Die Speicherung erfolgt AES-256-verschlüsselt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Kontosicherheit).
          </p>
        </Section>

        <Section title="8. Automatische Benachrichtigungen (Cron-System)">
          <p>
            VoltOffice betreibt einen automatisierten Hintergrunddienst (Cron-Job, täglich 08:00 Uhr), der folgende nutzerrelevante Ereignisse prüft und interne Benachrichtigungen erzeugt:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1" style={{ color: "#c8dff0" }}>
            <li>Überfällige Rechnungen (Fälligkeitsdatum überschritten)</li>
            <li>Bald fällige Rechnungen (Fälligkeitsdatum in 2 Tagen)</li>
            <li>Nicht versendete Angebote (Draft-Status älter als 3 Tage)</li>
            <li>Projekte ohne Zeiterfassung (mehr als 2 Tage inaktiv)</li>
          </ul>
          <p>
            Diese Benachrichtigungen sind ausschließlich für den jeweiligen Nutzer sichtbar, werden mit seiner userId verknüpft und nicht an Dritte weitergegeben. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
          </p>
        </Section>

        <Section title="9. DATEV-Export">
          <p>
            VoltOffice ermöglicht den Export von Rechnungsdaten im DATEV-kompatiblen Format (CSV). Exportierte Dateien werden lokal auf dem Gerät des Nutzers gespeichert und nicht an unsere Server übertragen. Der Nutzer ist selbst verantwortlich für die Weiterverarbeitung der exportierten Daten gemäß den Anforderungen seines Steuerberaters.
          </p>
        </Section>

        <Section title="10. Ihre Rechte (DSGVO Art. 15–21)">
          <p>Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong style={{ color: "#e6edf3" }}>Auskunftsrecht</strong> (Art. 15 DSGVO): Welche Daten speichern wir von Ihnen?</li>
            <li><strong style={{ color: "#e6edf3" }}>Berichtigungsrecht</strong> (Art. 16 DSGVO): Korrektur unrichtiger Daten.</li>
            <li><strong style={{ color: "#e6edf3" }}>Löschungsrecht</strong> (Art. 17 DSGVO): Löschung Ihrer personenbezogenen Daten.</li>
            <li><strong style={{ color: "#e6edf3" }}>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO).</li>
            <li><strong style={{ color: "#e6edf3" }}>Datenübertragbarkeit</strong> (Art. 20 DSGVO): Herausgabe Ihrer Daten in maschinenlesbarem Format.</li>
            <li><strong style={{ color: "#e6edf3" }}>Widerspruchsrecht</strong> (Art. 21 DSGVO): Widerspruch gegen die Verarbeitung.</li>
          </ul>
          <p>
            Zur Ausübung Ihrer Rechte wenden Sie sich bitte per E-Mail an:{" "}
            <a href="mailto:info@elektrogenius.de" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              info@elektrogenius.de
            </a>
          </p>
          <p>
            Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die zuständige Behörde für Nordrhein-Westfalen ist:{" "}
            <a href="https://www.ldi.nrw.de" target="_blank" rel="noopener" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              www.ldi.nrw.de
            </a>
          </p>
        </Section>

        <Section title="11. Datenlöschung & Speicherdauer">
          <p>
            Personenbezogene Daten werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus erfolgen, wenn dies durch europäische oder nationale Gesetzgeber vorgesehen wurde (z. B. steuerrechtliche Aufbewahrungspflichten für Rechnungsdaten: 10 Jahre gemäß § 147 AO).
          </p>
          <p>
            Bei Kontolöschung werden alle gespeicherten Betriebsdaten (Kunden, Angebote, Projekte, Rechnungen, Zeiterfassungen, Materialien) innerhalb von 30 Tagen endgültig aus der Datenbank entfernt. Stripe-Abonnements werden separat über das Stripe-Kundenportal verwaltet.
          </p>
        </Section>

        <Section title="12. Cookies & lokale Speicherung">
          <p>
            VoltOffice verwendet technisch notwendige Cookies für die Authentifizierung (Firebase Auth Session Token). Es werden keine Tracking- oder Werbe-Cookies eingesetzt. Sie können Cookies in Ihrem Browser deaktivieren; dies beeinträchtigt die Anmeldefunktion der Anwendung.
          </p>
        </Section>

        <Section title="13. Kontakt für Datenschutzanfragen">
          <p>
            Bei Fragen zum Datenschutz wenden Sie sich an:<br />
            <strong style={{ color: "#e6edf3" }}>Safin Deler Yezdin Al Ali</strong><br />
            E-Mail:{" "}
            <a href="mailto:info@elektrogenius.de" className="transition-opacity hover:opacity-70" style={{ color: "#00c6ff" }}>
              info@elektrogenius.de
            </a>
          </p>
        </Section>

        <div className="flex items-center gap-4 pt-4 text-xs" style={{ color: "#4a5568", borderTop: "1px solid #1e3a5f" }}>
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-[#8b9ab5]"><ArrowLeft size={13} />Zurück zur App</Link>
          <span>·</span>
          <Link href="/impressum" className="transition-colors hover:text-[#8b9ab5]">Impressum</Link>
        </div>
      </main>
    </div>
  );
}
