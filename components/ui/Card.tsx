"use client";
import { T } from "@/lib/theme";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Card({ children, className = "", id }: CardProps) {
  return (
    <div
      id={id}
      className={`rounded-[16px] p-5 ${className}`}
      style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
  /** Dark sage hero card — one per stat row, mirrors the side panel ground */
  featured?: boolean;
}

export function StatCard({ label, value, sub, trend, onClick, featured }: StatCardProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-[16px] p-5 text-left transition-all duration-300 ${onClick ? "cursor-pointer hover:-translate-y-[2px] hover:shadow-[0_2px_6px_rgba(43,42,34,0.05),0_16px_32px_-16px_rgba(43,42,34,0.18)]" : ""} ${onClick && !featured ? "card-interactive" : ""}`}
      style={
        featured
          ? { background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)", boxShadow: T.shadow }
          : { background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }
      }
    >
      <div
        className="text-[11px] font-medium tracking-[0.09em] uppercase"
        style={{ color: featured ? "#8a6a2f" : T.faint }}
      >
        {label}
      </div>
      <div
        className="font-title text-[28px] font-semibold mt-2 tracking-[-0.02em] tabular-nums flex items-baseline gap-2"
        style={{ color: T.text }}
      >
        {value}
        {trend && trend !== "neutral" && (
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded-[5px]"
            style={
              featured
                ? {
                    color: trend === "up" ? T.good : T.danger,
                    background: "rgba(160,125,56,0.12)",
                  }
                : {
                    color: trend === "up" ? T.good : T.danger,
                    background: trend === "up" ? "rgba(95,112,64,0.12)" : "rgba(163,73,63,0.10)",
                  }
            }
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {sub && (
        <div className="text-[12.5px] mt-1.5" style={{ color: T.muted }}>
          {sub}
        </div>
      )}
    </Wrapper>
  );
}

export function DetailCard({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[16px] p-6 ${className}`}
      style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}
    >
      {children}
    </div>
  );
}
