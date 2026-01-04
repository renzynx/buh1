import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { getSettings } from "@/lib/settings";
import "./globals.css";
import { connection } from "next/server";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: process.env.APP_NAME || "Buh",
  description: "A file storage app",
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  await connection();

  const baseUrl = process.env.AUTH_BASE_URL ?? "";
  const appName = process.env.APP_NAME || "Buh";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${spaceMono.variable} antialiased`}>
        <Providers settings={settings} baseUrl={baseUrl} appName={appName}>
          {children}
          <Toaster position="bottom-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
