"use client";
import { T } from "@/lib/theme";
import { BackLink } from "./BackLink";

interface PageHeaderProps {
  title?: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  back?: { label: string; onClick?: () => void; href?: string };
}

/* On mobile the sticky app bar already names the page, so list pages
   (no back-link) hide the big duplicate title — one less row before content.
   Detail/flow pages (with `back`) keep their title everywhere. */
export function PageHeader({ title, sub, action, back }: PageHeaderProps) {
  const hideTitleOnMobile = !back;
  return (
    <div className={hideTitleOnMobile && !action && !sub ? "mb-1 md:mb-6" : "mb-4 md:mb-6"}>
      {back && <BackLink label={back.label} href={back.href} onClick={back.onClick} className="mb-4" />}
      <div className="flex flex-wrap items-end justify-between gap-3 md:gap-4">
        <div className={hideTitleOnMobile ? "hidden md:block" : ""}>
          {title && <h1 className="font-title text-[24px] font-semibold tracking-[-0.02em]" style={{ color: T.text }}>{title}</h1>}
          {sub && <p className="text-[13.5px] mt-1.5" style={{ color: T.muted }}>{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
