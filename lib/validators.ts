/* Shared field validators — return an error string, or "" when valid. */

export const required = (v: string, field = "This field") => (v.trim() ? "" : `${field} is required.`);

export const email = (v: string) => {
  if (!v.trim()) return "Email is required.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address.";
};

export const phone = (v: string) => {
  if (!v.trim()) return "Phone number is required.";
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 10 && /^[+\d][\d\s-]+$/.test(v.trim()) ? "" : "Enter a valid phone number.";
};

export const positiveNumber = (v: string, field = "This value") => {
  if (!v.trim()) return `${field} is required.`;
  return Number(v) > 0 && !isNaN(Number(v)) ? "" : `${field} must be a positive number.`;
};

export const optionalNumber = (v: string, field = "This value") => {
  if (!v.trim()) return "";
  return !isNaN(Number(v)) && Number(v) >= 0 ? "" : `${field} must be a number.`;
};

export const ifsc = (v: string) => {
  if (!v.trim()) return "";
  return /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(v.trim()) ? "" : "Enter a valid IFSC code.";
};

/** True when every error string in the map is empty. */
export const isClean = (errors: Record<string, string>) => Object.values(errors).every((e) => !e);
