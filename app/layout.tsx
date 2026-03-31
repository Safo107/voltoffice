import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ProProvider } from "@/context/ProContext";
import Script from "next/script";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "VoltOffice — ElektroGenius",
  description: "Professionelle Handwerkersoftware für Elektrobetriebe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
        {/* Google Analytics GA4 — startet im Consent-Modus (denied) */}
        <Script id="ga-consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            wait_for_update: 500,
          });
        `}</Script>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-9EYXMP1S7Y" strategy="afterInteractive"/>
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-9EYXMP1S7Y');
          // Gespeicherte Zustimmung wiederherstellen
          const consent = localStorage.getItem('cookie_consent');
          if (consent === 'accepted') {
            gtag('consent', 'update', { analytics_storage: 'granted' });
          }
        `}</Script>
      </head>
      <body className="h-full">
        <AuthProvider>
          <ProProvider>{children}</ProProvider>
        </AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
