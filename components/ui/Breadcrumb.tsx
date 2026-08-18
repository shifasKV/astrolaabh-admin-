"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";

export interface Crumb {
  label: string;
  href?: string;
}

/* Subtle breadcrumb trail with a back chevron on the first crumb. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const router = useRouter();
  const goBack = (href?: string) => {
    if (typeof window !== "undefined" && window.history.length > 1) { router.back(); return; }
    if (href) router.push(href);
  };
  return (
    <nav className="flex items-center gap-1 flex-wrap mb-4 text-[12.5px]" aria-label="Breadcrumb">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1">
            {i === 0 && c.href && (
              <a
                href={c.href}
                onClick={(e) => { e.preventDefault(); goBack(c.href); }}
                className="inline-flex items-center gap-1.5 h-8 pl-2 pr-3 rounded-full font-medium transition-all duration-200 hover:-translate-x-0.5 cursor-pointer"
                style={{ color: T.muted, background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M10 3.5 5.5 8 10 12.5" />
                </svg>
                {c.label}
              </a>
            )}
            {i > 0 && (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mx-0.5" style={{ color: T.faint }}>
                  <path d="m9 18 6-6-6-6" />
                </svg>
                {c.href && !last ? (
                  <Link href={c.href} className="font-medium hover:underline underline-offset-4" style={{ color: T.muted }}>
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-semibold" style={{ color: T.text }}>{c.label}</span>
                )}
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}
