"use client";
import { useState } from "react";
import { Card, GoldBtn, GhostBtn, Input } from "@/components/ui";
import { T } from "@/lib/theme";

/**
 * Shared password-reset card for all role profile pages.
 */
export function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setPw({ current: "", next: "", confirm: "" });
    setError("");
    setOpen(false);
  };

  const savePassword = () => {
    if (!pw.current || !pw.next) {
      setError("Fill in your current and new password.");
      return;
    }
    if (pw.next !== pw.confirm) {
      setError("New passwords don't match.");
      return;
    }
    if (pw.next.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    setSuccess("Password updated");
    setTimeout(() => setSuccess(""), 2500);
    resetForm();
  };

  return (
    <Card className="!p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Password</h2>
          <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>
            Change the password you use to sign in.
          </p>
        </div>
        {success && (
          <span className="text-[12px] font-medium shrink-0" style={{ color: T.good }}>✓ {success}</span>
        )}
      </div>

      {!open ? (
        <GhostBtn className="!mt-4" onClick={() => setOpen(true)}>
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Change password
          </span>
        </GhostBtn>
      ) : (
        <div className="space-y-3 mt-5">
          <Input
            value={pw.current}
            onChange={(v) => {
              setPw((p) => ({ ...p, current: v }));
              setError("");
            }}
            label="Current password"
            type="password"
            placeholder="••••••••"
          />
          <Input
            value={pw.next}
            onChange={(v) => {
              setPw((p) => ({ ...p, next: v }));
              setError("");
            }}
            label="New password"
            type="password"
            placeholder="At least 6 characters"
          />
          <Input
            value={pw.confirm}
            onChange={(v) => {
              setPw((p) => ({ ...p, confirm: v }));
              setError("");
            }}
            label="Confirm new password"
            type="password"
            placeholder="Repeat new password"
          />
          {error && <p className="text-[12px]" style={{ color: T.danger }}>{error}</p>}
          <div className="flex gap-2.5 pt-1">
            <GoldBtn onClick={savePassword}>Update password</GoldBtn>
            <GhostBtn onClick={resetForm}>Cancel</GhostBtn>
          </div>
        </div>
      )}
    </Card>
  );
}
