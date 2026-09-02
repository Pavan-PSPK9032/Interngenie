import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://interngenie.vercel.app"),
  title: "InternGenie — AI-Powered Internship Discovery Platform",
  description:
    "InternGenie uses AI to understand your skills, interests, and career goals, then helps you discover internships that match your profile. Analyze your resume, identify skill gaps, and plan your career.",
  keywords: [
    "AI internship recommendation",
    "India internships",
    "student internships",
    "resume analysis",
    "skill gap analysis",
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
    title: "InternGenie — AI-Powered Internship Discovery Platform",
    description:
      "Find the internship that fits you. InternGenie uses AI to match your skills and interests to internships, analyze your resume, and guide your career.",
    siteName: "InternGenie",
    type: "website",
    url: "https://interngenie.vercel.app",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "InternGenie — AI-Powered Internship Discovery Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InternGenie — AI-Powered Internship Discovery Platform",
    description: "Find the internship that fits you.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
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
        className={`${plusJakarta.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
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
