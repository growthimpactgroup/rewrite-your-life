import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Rewrite Your Life",
  description: "Your map. Six minutes. No wrong answers — only an accurate map.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {/* Runs before hydration so a returning dark-mode visitor never sees
            a flash of the light theme first. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('ryl-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`}
        </Script>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
