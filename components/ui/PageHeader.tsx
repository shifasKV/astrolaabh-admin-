"use client";
import Link from "next/link";
import { T } from "@/lib/theme";

interface PageHeaderProps {
  title?: string;
  sub?: string;
  action?: React.ReactNode;
  back?: { label: string; onClick?: () => void; href?: string };
}

export function PageHeader({ title, sub, action, back }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && (
        back.href ? (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 hover:opacity-80 transition-opacity duration-200"
            style={{ color: T.accent }}
          >
            ← {back.label}
          </Link>
        ) : (
          <button
            onClick={back.onClick}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 hover:opacity-80 cursor-pointer transition-opacity duration-200"
            style={{ color: T.accent }}
          >
            ← {back.label}
          </button>
        )
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {title && <h1 className="text-[17px] font-semibold" style={{ color: T.text }}>{title}</h1>}
          {sub && <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
