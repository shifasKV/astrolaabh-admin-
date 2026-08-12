/** Shopify brand palette — bag green + darker text-safe green */
export const SHOPIFY_GREEN = "#95BF47";
export const SHOPIFY_GREEN_DARK = "#5E8E3E";
export const SHOPIFY_TINT = "rgba(149,191,71,0.12)";
export const SHOPIFY_BORDER = "rgba(94,142,62,0.4)";

export function ShopifyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        fill="#95BF47"
        d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.359 1.875.359l-.965 2.727zm-.91-8.98c.12 0 .24.045.36.135-.885.42-1.815 1.471-2.221 3.586-.574.181-1.145.359-1.669.524.464-1.59 1.575-4.245 3.53-4.245zm1.096 2.581v.211c-.674.21-1.409.435-2.13.66.42-1.575 1.185-2.34 1.86-2.626.165.42.27 1.005.27 1.755zm.63-1.891c.615.075 1.011.78 1.26 1.575-.3.091-.63.181-.99.301v-.211c0-.645-.09-1.185-.27-1.665zm2.281 2.116s-.075-.03-.135-.015c-.045 0-.945.075-.945.075s-1.545-1.5-1.71-1.665c-.165-.166-.48-.121-.6-.076-.015 0-.33.105-.855.27-.51-1.47-1.409-2.821-2.999-2.821h-.135c-.45-.585-1.02-.855-1.5-.855-3.75 0-5.545 4.68-6.105 7.065-1.455.45-2.49.765-2.625.81-.81.255-.84.285-.945 1.05C.35 9.895 0 21.62 0 21.62l16.815 3.15.9-21.639z"
      />
    </svg>
  );
}

/** Neutral secondary button that opens a Shopify admin page — the bag mark carries the brand. */
export function ShopifyButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="group inline-flex items-center gap-2 h-10 text-[13px] font-medium px-4 rounded-[9px] transition-all duration-200 hover:-translate-y-px"
      style={{
        background: "#fffdf5",
        border: "1px solid rgba(89, 82, 54, 0.16)",
        color: "#2e2b1f",
        boxShadow: "0 1px 2px rgba(43,42,34,0.05)",
      }}
    >
      <ShopifyIcon />
      {children}
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" style={{ color: "#98907a" }}>
        <path d="M6.5 3.5h6v6M12.5 3.5 7 9M6 4H4.5A1.5 1.5 0 0 0 3 5.5v6A1.5 1.5 0 0 0 4.5 13h6a1.5 1.5 0 0 0 1.5-1.5V10" />
      </svg>
    </a>
  );
}
