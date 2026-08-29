import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MangoCycle Smart Platform",
  description:
    "Digital management, traceability, sustainability, and AI-assisted decision-support platform for mango waste valorization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body className="font-sans antialiased bg-bg text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}
