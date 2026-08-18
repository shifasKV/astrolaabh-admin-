"use client";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";

interface BackLinkProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/* Subtle bookmark pill — floats above detail pages as the way back */
const BACK_CLASS =
  "group inline-flex items-center gap-1.5 text-[12.5px] font-medium h-8 pl-2 pr-3 rounded-full transition-all duration-200 hover:-translate-x-0.5 cursor-pointer";
const BACK_STYLE = { color: T.muted, background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow } as const;

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5">
      <path d="M10 3.5 5.5 8 10 12.5" />
    </svg>
  );
}

export function BackLink({ label, href, onClick, className = "" }: BackLinkProps) {
  const router = useRouter();

  // Prefer going to the actual previous page. Fall back to href when there's
  // no in-app history (deep link / fresh tab), so back is never a dead end.
  const goBack = () => {
    if (onClick) return onClick();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (href) router.push(href);
  };

  return (
    <a
      href={href ?? "#"}
      onClick={(e) => { e.preventDefault(); goBack(); }}
      className={`${BACK_CLASS} ${className}`}
      style={BACK_STYLE}
    >
      <Chevron />
      {label}
    </a>
  );
}
