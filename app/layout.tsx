import type { Metadata } from "next";
import { Geist, Noto_Serif_Devanagari } from "next/font/google";
import { AuthProvider } from "@/lib/store/auth";
import { LeadsProvider } from "@/lib/store/leads";
import { SidebarProvider } from "@/components/ui/SidebarState";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const devanagari = Noto_Serif_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "AstroLaabh — Operations Portal",
  description: "Operations portal: Admin, Astrologer/Gemologist, and Affiliate portals.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${devanagari.variable} antialiased`}>
        <AuthProvider><LeadsProvider><SidebarProvider>{children}</SidebarProvider></LeadsProvider></AuthProvider>
      </body>
    </html>
  );
}
