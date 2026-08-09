import type { Metadata } from "next";
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from "@/components/Navbar";
import "./globals.css";
import {Toaster} from "@/components/ui/sonner";
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: "KitabHoshmand | Smart Book Companion",
  description: "KitabHoshmand is an AI-powered smart book companion for uploading PDFs, exploring book knowledge, and discussing content through voice.",
  icons: {
    icon: "/brand/kitabhoshmand-logo-mark.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="relative font-sans antialiased">
        <AuthProvider initialUser={user}>
            <Navbar />
            {children}
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
