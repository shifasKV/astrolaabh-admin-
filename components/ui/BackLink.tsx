"use client";
import Link from "next/link";
import { T } from "@/lib/theme";

interface BackLinkProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const BACK_CLASS =
  "group inline-flex items-center gap-1 text-[13px] font-medium -ml-2 pl-1.5 pr-2.5 py-1.5 rounded-[8px] transition-colors duration-200 hover:bg-[rgba(89,82,54,0.06)] cursor-pointer";

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5">
      <path d="M10 3.5 5.5 8 10 12.5" />
    </svg>
  );
}

export function BackLink({ label, href, onClick, className = "" }: BackLinkProps) {
  if (href) {
    return (
      <Link href={href} className={`${BACK_CLASS} ${className}`} style={{ color: T.muted }}>
        <Chevron />
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${BACK_CLASS} ${className}`} style={{ color: T.muted }}>
      <Chevron />
      {label}
    </button>
  );
}
