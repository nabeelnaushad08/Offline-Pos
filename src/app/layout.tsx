import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

// next/font/google downloads fonts at BUILD time and self-hosts them in the
// static output — they do NOT require a live internet connection at runtime.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
  fallback: ["ui-monospace", "Consolas", "Courier New", "monospace"],
});

export const metadata: Metadata = {
  title: "Offline POS",
  description: "Offline Point of Sale and Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {/*
          AuthProvider handles three phases:
            1. booting  — Zustand rehydrates from sessionStorage
            2. login    — shows LoginView (full-screen)
            3. app      — shows AppShell + page children
        */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
