import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InternGenie — AI-Powered Internship Recommendations | PM Internship Scheme",
  description:
    "Find your dream internship with AI-powered recommendations. The PM Internship Scheme platform connects 1.2M+ students with 12,500+ companies across India.",
  keywords: [
    "PM Internship Scheme",
    "AI internship recommendation",
    "India internships",
    "student internships",
    "career guidance",
  ],
  authors: [{ name: "InternGenie" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InternGenie",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "InternGenie — AI-Powered Internship Recommendations",
    description:
      "Find your dream internship with AI-powered recommendations. The PM Internship Scheme platform.",
    siteName: "InternGenie",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternGenie",
    description: "AI-Powered Internship Recommendations",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1e25" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker
                    .register('/sw.js')
                    .then(function (reg) {
                      console.log('Service Worker registered, scope:', reg.scope);
                      reg.addEventListener('updatefound', function () {
                        var newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function () {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('New service worker available. Reload to update.');
                            }
                          });
                        }
                      });
                    })
                    .catch(function (err) {
                      console.error('Service Worker registration failed:', err);
                    });
                });
                navigator.serviceWorker.addEventListener('controllerchange', function () {
                  window.location.reload();
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
            <SonnerToaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
