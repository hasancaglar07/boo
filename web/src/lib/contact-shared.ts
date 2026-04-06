export const CONTACT_SUBJECT_OPTIONS = [
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing" },
  { value: "account", label: "Account Access" },
  { value: "content", label: "Content Production" },
  { value: "other", label: "Other" },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECT_OPTIONS)[number]["value"];

export const PUBLIC_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@bookgenerator.net";
export const PUBLIC_BILLING_EMAIL = process.env.NEXT_PUBLIC_BILLING_EMAIL || "billing@bookgenerator.net";

export function contactSubjectLabel(subject: ContactSubject) {
  return CONTACT_SUBJECT_OPTIONS.find((item) => item.value === subject)?.label || "Other";
}
