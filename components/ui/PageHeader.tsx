"use client";
import { T } from "@/lib/theme";
import { BackLink } from "./BackLink";

interface PageHeaderProps {
  title?: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  back?: { label: string; onClick?: () => void; href?: string };
}

export function PageHeader({ title, sub, action, back }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && <BackLink label={back.label} href={back.href} onClick={back.onClick} className="mb-4" />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {title && <h1 className="font-title text-[24px] font-semibold tracking-[-0.02em]" style={{ color: T.text }}>{title}</h1>}
          {sub && <p className="text-[13.5px] mt-1.5" style={{ color: T.muted }}>{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
