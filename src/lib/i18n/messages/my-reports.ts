import type { Dict } from "@/lib/i18n";

type MyReportsCopy = {
  pageTitle: string;
  pageIntro: string;
  loadError: (reason: string) => string;
  empty: string;
  reportCta: string;
  rejected: string;
  merged: (id: string) => string;
  handledBy: (team: string) => string;
  awaitingTeam: string;
  progress: string;
  received: string;
  reviewedByAi: string;
};

export const MY_REPORTS: Dict<MyReportsCopy> = {
  en: {
    pageTitle: "My reports",
    pageIntro: "Reports you submitted from this device, and where each one is now. No account needed.",
    loadError: (reason) => `Couldn't load your reports: ${reason}. Refresh to try again.`,
    empty: "You haven't reported anything from this device yet.",
    reportCta: "Report an issue",
    rejected: "This report was closed without action. It may have been outside the team's responsibility.",
    merged: (id) => `Merged with an earlier report of the same issue (#${id}), which moved it up the queue.`,
    handledBy: (team) => `Handled by ${team}.`,
    awaitingTeam: "Waiting for a team to be assigned.",
    progress: "Progress",
    received: "Received",
    reviewedByAi: "Reviewed by AI",
  },
  hi: {
    pageTitle: "मेरी शिकायतें",
    pageIntro: "इस फ़ोन/डिवाइस से भेजी गई शिकायतें और हर एक की अभी की स्थिति। कोई अकाउंट नहीं चाहिए।",
    loadError: (reason) => `आपकी शिकायतें नहीं खुल पाईं: ${reason}। पेज रीफ़्रेश करें।`,
    empty: "आपने इस डिवाइस से अभी तक कोई शिकायत नहीं भेजी है।",
    reportCta: "शिकायत करें",
    rejected: "यह शिकायत बिना कार्रवाई के बंद कर दी गई। हो सकता है यह टीम की ज़िम्मेदारी में न हो।",
    merged: (id) => `इसी समस्या की पुरानी शिकायत (#${id}) में जोड़ दी गई, जिससे वह कतार में ऊपर आ गई।`,
    handledBy: (team) => `${team} देख रहा है।`,
    awaitingTeam: "टीम सौंपे जाने का इंतज़ार है।",
    progress: "प्रगति",
    received: "मिल गई",
    reviewedByAi: "AI ने जाँची",
  },
};
