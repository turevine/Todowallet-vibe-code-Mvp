import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  title: "TodoWallet",
  description: "노력은 눈에 보여야 계속된다",
  metadataBase,
  openGraph: {
    title: "TodoWallet",
    description: "노력은 눈에 보여야 계속된다",
    images: [{ url: "/favicon-96x96.png", width: 96, height: 96, alt: "TodoWallet 로고" }],
  },
  twitter: {
    card: "summary",
    title: "TodoWallet",
    description: "노력은 눈에 보여야 계속된다",
    images: ["/favicon-96x96.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <ToastProvider>
          <div className="app-shell flex min-h-screen flex-col">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
