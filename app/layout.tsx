import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const HEADLINE = "Complex by nature. Elegant by design.";
const SUBHEAD =
  "A senior design and engineering studio for transformative products that don't have a blueprint.";

export const metadata: Metadata = {
  title: `Pine Beach — ${HEADLINE}`,
  description: SUBHEAD,
  metadataBase: new URL("https://pinebeach.com.au"),
  openGraph: {
    title: HEADLINE,
    description: SUBHEAD,
    url: "https://pinebeach.com.au",
    siteName: "Pine Beach",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HEADLINE,
    description: SUBHEAD,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        {/* Decide the first-load intro before paint (no flash). Plays once per
            session, never under reduced-motion or in ?still capture mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=!sessionStorage.getItem('pb-introSeen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&location.search.indexOf('still')<0;if(p){document.documentElement.classList.add('pb-intro');sessionStorage.setItem('pb-introSeen','1');}}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
