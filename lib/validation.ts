export const V = {
  required: (v: string) => (v.trim() ? "" : "This field is required"),
  email: (v: string) => {
    if (!v.trim()) return "Email is required";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email";
  },
  phone: (v: string) => {
    if (!v.trim()) return "Phone is required";
    const digits = v.replace(/[\s\-+()]/g, "");
    return digits.length >= 10 && digits.length <= 15 ? "" : "Enter a valid phone number";
  },
  percent: (v: string) => {
    if (!v.trim()) return "Required";
    const n = Number(v);
    return isNaN(n) || n < 0 || n > 100 ? "Enter 0–100" : "";
  },
  positiveAmount: (v: string) => {
    if (!v.trim()) return "Amount is required";
    const n = Number(v.replace(/[₹,\s]/g, ""));
    return isNaN(n) || n <= 0 ? "Enter a valid amount" : "";
  },
  password: (v: string) => {
    if (!v) return "Password is required";
    return v.length >= 6 ? "" : "At least 6 characters";
  },
  passwordMatch: (pw: string, confirm: string) => {
    if (!confirm) return "Please confirm password";
    return pw === confirm ? "" : "Passwords do not match";
  },
  accountMatch: (acc: string, confirm: string) => {
    if (!confirm) return "Please confirm account number";
    return acc === confirm ? "" : "Account numbers do not match";
  },
  url: (v: string) => {
    if (!v.trim()) return "";
    try { new URL(v); return ""; } catch { return "Enter a valid URL"; }
  },
  ifsc: (v: string) => {
    if (!v.trim()) return "IFSC is required";
    return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v) ? "" : "Enter a valid IFSC code";
  },
};

export type ValidationErrors = Record<string, string>;

export function validate(rules: Record<string, string>): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const [key, msg] of Object.entries(rules)) {
    if (msg) errors[key] = msg;
  }
  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((e) => e !== "");
}
