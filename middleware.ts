import { NextRequest, NextResponse } from "next/server";

const PRODUCTION_HOST = "voltoffice.elektrogenius.de";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";

  // Permanenter 301-Redirect von jeder *.vercel.app-Subdomain auf die Produktionsdomain
  if (host.endsWith(".vercel.app")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = PRODUCTION_HOST;
    url.port = "";
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  // Gilt für alle Routen außer Next.js-internen Assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
