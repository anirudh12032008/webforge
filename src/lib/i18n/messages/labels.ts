import { CATEGORY_LABELS, FACTOR_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { Category, Locale, PriorityFactor, Status } from "@/types";

const CATEGORY_HI: Record<Category, string> = {
  pothole: "गड्ढा या टूटी सड़क",
  garbage: "कूड़ा-कचरा",
  water_leak: "पानी का रिसाव",
  streetlight: "स्ट्रीटलाइट",
  electrical: "बिजली का खतरा",
  sanitation: "सफ़ाई या नाली",
  other: "अन्य",
};

const STATUS_HI: Record<Status, string> = {
  new: "नई",
  triaged: "जाँच हो गई",
  assigned: "टीम को सौंपी गई",
  in_progress: "काम चल रहा है",
  resolved: "ठीक हो गई",
  rejected: "बंद की गई",
};

const FACTOR_HI: Record<PriorityFactor["factor"], string> = {
  safety: "सुरक्षा जोखिम",
  severity: "गंभीरता",
  related: "मिलती-जुलती शिकायतें",
  waiting: "इंतज़ार का समय",
  community: "प्रभावित लोग",
};

const ORG_HI: Record<string, string> = {
  bmc: "भोपाल नगर निगम",
  manit: "मैनिट भोपाल कैंपस",
};

const DEPARTMENT_HI: Record<string, string> = {
  "MANIT Estate Office (Civil)": "मैनिट एस्टेट ऑफ़िस (सिविल)",
  "MANIT Electrical Maintenance": "मैनिट विद्युत रखरखाव",
  "MANIT Housekeeping": "मैनिट हाउसकीपिंग",
  "BMC Roads & Public Works": "बीएमसी सड़क एवं लोक निर्माण",
  "BMC Solid Waste Management": "बीएमसी ठोस अपशिष्ट प्रबंधन",
  "BMC Water Supply": "बीएमसी जल आपूर्ति",
  "BMC Street Lighting": "बीएमसी स्ट्रीट लाइटिंग",
  "BMC Health & Sanitation": "बीएमसी स्वास्थ्य एवं स्वच्छता",
};

/** Category / status / priority-factor labels in the reader's language (admin pages keep English). */
export const categoryLabels = (locale: Locale) => (locale === "hi" ? CATEGORY_HI : CATEGORY_LABELS);
export const statusLabels = (locale: Locale) => (locale === "hi" ? STATUS_HI : STATUS_LABELS);
export const factorLabels = (locale: Locale) => (locale === "hi" ? FACTOR_HI : FACTOR_LABELS);

/** Locale tag for dates shown to citizens. */
export const DATE_LOCALE: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

/** Org / department names in the reader's language; unknown names (new seeds) stay as stored. */
export const orgName = (locale: Locale, org: { slug: string; name: string }) => (locale === "hi" ? ORG_HI[org.slug] : undefined) ?? org.name;
export const departmentName = (locale: Locale, name: string) => (locale === "hi" ? DEPARTMENT_HI[name] : undefined) ?? name;
