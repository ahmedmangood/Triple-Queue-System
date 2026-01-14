import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triple Queue Management System",
  description: "A comprehensive system for managing queues across three different service points efficiently.",
  keywords: ["queue management", "service points", "efficiency", "customer service", "real-time tracking"],
  authors: [{ name: "Triple Point Est." }],
  openGraph: {
    title: "Triple Queue Management System",
    description: "A comprehensive system for managing queues across three different service points efficiently.",
    url: "https://triplepointsa.com",
    siteName: "Triple Point Est.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Triple Queue Management System",
    description: "A comprehensive system for managing queues across three different service points efficiently.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
