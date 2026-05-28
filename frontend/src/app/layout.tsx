import type { Metadata, Viewport } from "next";
import "./globals.css";
import StoreProvider from "@/store/provider";

export const metadata: Metadata = {
  title: "VedaAI — AI Assessment Creator",
  description:
    "Generate structured question papers with AI-powered assessment creation",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
