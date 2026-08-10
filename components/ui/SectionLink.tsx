"use client";
import Link from "next/link";
import { T } from "@/lib/theme";

interface SectionLinkProps {
  href: string;
  children?: React.ReactNode;
}

export function SectionLink({ href, children = "View all →" }: SectionLinkProps) {
  return (
    <Link
      href={href}
      className="text-[11px] px-2.5 py-1 rounded-[9px] transition-all duration-200 hover:brightness-125"
      style={{ color: T.accent, border: `1px solid ${T.accentBorder}` }}
    >
      {children}
    </Link>
  );
}
