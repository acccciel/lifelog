import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "LifeLog · 生活手账",
  description: "记录每一天的生存状态，更好地了解自己",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeLog",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFB5C2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-dvh">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}