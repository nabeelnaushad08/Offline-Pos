import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

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
      <body className="font-sans antialiased">
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
