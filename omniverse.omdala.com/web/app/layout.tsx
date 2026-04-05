import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "AI Omniverse — Control your entire physical world",
  description:
    "Smart home. Smart office. Smart venue. One app. Control all your devices with AI Omniverse.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-950 text-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
