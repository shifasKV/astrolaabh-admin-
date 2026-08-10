import type { Metadata } from "next";
import { Manrope, Inter, Noto_Serif_Devanagari } from "next/font/google";
import { AuthProvider } from "@/lib/store/auth";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const devanagari = Noto_Serif_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "AstroLaabh — Operations Portal",
  description: "Operations portal: Admin, Astrologer/Gemologist, and Affiliate portals.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} ${devanagari.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
