"use client";
import { useState } from "react";
import { Card, GhostBtn, Modal } from "@/components/ui";
import { T } from "@/lib/theme";

const GoogleCalendarLogo = () => (
  <svg viewBox="0 0 48 48" width={28} height={28}>
    <path d="M34 42H14c-4.4 0-8-3.6-8-8V14c0-4.4 3.6-8 8-8h20c4.4 0 8 3.6 8 8v20c0 4.4-3.6 8-8 8z" fill="#fff"/>
    <path d="M34 6H24v10h18V14c0-4.4-3.6-8-8-8z" fill="#EA4335"/>
    <path d="M42 16H24v10h18z" fill="#FBBC04"/>
    <path d="M42 26H24v10h18z" fill="#34A853"/>
    <path d="M24 26H6v8c0 4.4 3.6 8 8 8h10z" fill="#188038"/>
    <path d="M6 16h18v10H6z" fill="#4285F4"/>
    <path d="M14 6H6.6C6.2 6 6 6.4 6 6.6V14h18V6z" fill="#1967D2"/>
    <path d="M31.2 18.4l-1.2-1 .8-1c.3-.4.2-.6-.2-.6h-.8l-.5 1.2-.5-1.2h-.9c-.3 0-.5.3-.2.6l.9 1-1.2 1c-.3.3-.1.6.3.6h.8l.6-1.4.6 1.4h.8c.5 0 .6-.3.3-.6zM22 23v-5h-1.5v3.8L18 20h-1v5h1.5v-3.8l2.5 3.8zM16.5 22.5H15V20h-1.5v5h3c.3 0 .5-.2.5-.5v-1.5c0-.3-.2-.5-.5-.5z" fill="#fff" opacity="0.8"/>
  </svg>
);

/**
 * Google Calendar integration card for admin profile.
 * Two states: disconnected (connect button) and connected (shows account + disconnect).
 */
export function CalendarIntegrationCard() {
  const [connected, setConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [showConnectWarning, setShowConnectWarning] = useState(false);
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);
  const [toast, setToast] = useState("");

  const confirmConnect = () => {
    setConnected(true);
    setConnectedEmail("admin@astrolaabh.com");
    setShowConnectWarning(false);
    setToast("Google Calendar connected");
    setTimeout(() => setToast(""), 2500);
  };

  const confirmDisconnect = () => {
    setConnected(false);
    setConnectedEmail("");
    setShowDisconnectWarning(false);
    setToast("Google Calendar disconnected");
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <>
      <Card className="!p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>
              Calendar integration
            </h2>
            <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: T.muted }}>
              Connect Google Calendar to sync consultation bookings, energisation schedules, and team availability.
            </p>
          </div>
        </div>

        {connected ? (
          <div
            className="flex items-center gap-4 mt-4 px-4 py-3.5 rounded-[12px]"
            style={{ background: "rgba(95,112,64,0.06)", border: `1px solid rgba(95,112,64,0.15)` }}
          >
            <GoogleCalendarLogo />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold" style={{ color: T.text }}>Google Calendar</span>
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(95,112,64,0.13)", color: T.good }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Connected
                </span>
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{connectedEmail}</div>
            </div>
            <button
              type="button"
              onClick={() => setShowDisconnectWarning(true)}
              className="h-8 px-3.5 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(163,73,63,0.08)]"
              style={{ color: T.danger, border: `1px solid rgba(163,73,63,0.2)` }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConnectWarning(true)}
            className="flex items-center gap-3 mt-4 px-4 py-3.5 rounded-[12px] w-full text-left cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.04)]"
            style={{ border: `1px dashed ${T.border}` }}
          >
            <GoogleCalendarLogo />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium" style={{ color: T.text }}>Google Calendar</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: T.faint }}>Not connected</div>
            </div>
            <span
              className="h-8 px-4 rounded-[8px] inline-flex items-center text-[12px] font-semibold"
              style={{ background: T.accent, color: T.accentInk }}
            >
              Connect
            </span>
          </button>
        )}
      </Card>

      <Modal open={showConnectWarning} onClose={() => setShowConnectWarning(false)} title="Connect Google Calendar?">
        <div className="space-y-3">
          <p className="text-[13.5px] leading-relaxed" style={{ color: T.muted }}>
            Google Calendar will be used to sync consultation bookings and energisation schedules across the platform.
          </p>
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-[10px]"
            style={{ background: "rgba(160,125,56,0.08)", border: `1px solid rgba(160,125,56,0.18)` }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0" style={{ color: T.gold }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <div className="text-[12.5px] font-semibold" style={{ color: T.text }}>Use the admin account</div>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: T.muted }}>
                Integrate from <strong style={{ color: T.text }}>admin@astrolaabh.com</strong> to make sure everything works properly.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 mt-6">
          <GhostBtn onClick={() => setShowConnectWarning(false)}>Cancel</GhostBtn>
          <button
            type="button"
            onClick={confirmConnect}
            className="h-10 px-5 rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110"
            style={{ background: T.accent, color: T.accentInk }}
          >
            Continue
          </button>
        </div>
      </Modal>

      <Modal open={showDisconnectWarning} onClose={() => setShowDisconnectWarning(false)} title="Disconnect Google Calendar?">
        <div className="space-y-3">
          <p className="text-[13.5px] leading-relaxed" style={{ color: T.muted }}>
            Disconnecting will stop syncing consultation bookings and energisation schedules with Google Calendar.
          </p>
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-[10px]"
            style={{ background: "rgba(163,73,63,0.06)", border: `1px solid rgba(163,73,63,0.12)` }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0" style={{ color: T.danger }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <div className="text-[12.5px] font-semibold" style={{ color: T.danger }}>This may cause scheduling issues</div>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: T.muted }}>
                Consultation slots and energisation events will no longer sync automatically.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 mt-6">
          <GhostBtn onClick={() => setShowDisconnectWarning(false)}>Cancel</GhostBtn>
          <button
            type="button"
            onClick={confirmDisconnect}
            className="h-10 px-5 rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110"
            style={{ background: T.danger, color: "#fdf6ea" }}
          >
            Disconnect
          </button>
        </div>
      </Modal>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {toast}
        </div>
      )}
    </>
  );
}
