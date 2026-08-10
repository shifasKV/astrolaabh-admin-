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
      className={`rounded-[12px] p-5 ${className}`}
      style={{ background: T.card, border: `1px solid ${T.border}` }}
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
}

export function StatCard({ label, value, sub, trend, onClick }: StatCardProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-[12px] p-5 text-left transition-all duration-200 ${onClick ? "cursor-pointer hover:border-[rgba(195,160,88,0.2)]" : ""}`}
      style={{ background: T.card, border: `1px solid ${T.border}` }}
    >
      <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>
        {label}
      </div>
      <div className="text-[22px] font-semibold mt-1.5 tabular-nums flex items-center gap-2" style={{ color: T.text }}>
        {value}
        {trend && trend !== "neutral" && (
          <span className="text-[11px]" style={{ color: trend === "up" ? T.good : T.danger }}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {sub && (
        <div className="text-[11.5px] mt-1" style={{ color: T.muted }}>
          {sub}
        </div>
      )}
    </Wrapper>
  );
}

export function DetailCard({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[14px] p-6 ${className}`}
      style={{ background: T.panel, border: `1px solid ${T.border}` }}
    >
      {children}
    </div>
  );
}
