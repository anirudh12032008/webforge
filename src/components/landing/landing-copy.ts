import type { Dict } from "@/lib/i18n";

type LandingCopy = {
  heroTitle: string;
  heroBody: string;
  ctaReport: string;
  ctaDashboard: string;
  ticketLabel: string;
  ticketLive: string;
  ticketExample: string;
  ticketRouted: string;
  ticketUnassigned: string;
  ticketPriority: string;
  statsOpen: string;
  statsUrgent: string;
  statsMerged: string;
  statsResolved: string;
  statsNote: string;
  stepsTitle: string;
  steps: { title: string; body: string }[];
  orgsTitle: string;
  orgsBody: string;
  campusName: string;
  campusBody: string;
  cityName: string;
  cityBody: string;
  orgsOr: string;
  trustTitle: string;
  trust: { title: string; body: string }[];
  footerBuilt: string;
  footerCode: string;
};

export const LANDING_COPY: Dict<LandingCopy> = {
  en: {
    heroTitle: "Report it once. The right team fixes it first.",
    heroBody:
      "Potholes, garbage, leaks, dead streetlights, exposed wires — anywhere in Bhopal or on the MANIT campus. AI reads your report, spots duplicates nearby and ranks it by danger, so the riskiest problems get fixed before the rest.",
    ctaReport: "Report an issue",
    ctaDashboard: "See the live dashboard",
    ticketLabel: "Work order",
    ticketLive: "Live from the queue",
    ticketExample: "Example",
    ticketRouted: "Routed to",
    ticketUnassigned: "Waiting for a team",
    ticketPriority: "Priority",
    statsOpen: "open right now",
    statsUrgent: "with a safety risk",
    statsMerged: "duplicate reports merged",
    statsResolved: "already resolved",
    statsNote: "Live numbers from the same queue the maintenance teams work from.",
    stepsTitle: "What happens after you hit submit",
    steps: [
      { title: "AI reads your report", body: "Claude reads your words and looks at your photo, then names the problem, how bad it is and how dangerous it is — in one sentence you can check." },
      { title: "Duplicates are matched", body: "Reports within 75 m from the last two weeks are compared by meaning. The same problem reported twice becomes one ticket with more weight." },
      { title: "A score you can read", body: "Safety, severity, how many people reported it, how long it has waited and how many people it affects add up to a 0–100 priority — every part shown." },
      { title: "The right team gets it", body: "It goes to the team that handles that kind of problem, and to the least-loaded one when there are two. You can follow it from your phone." },
    ],
    orgsTitle: "Campus or city — you choose",
    orgsBody: "Two organisations work from one system. Inside MANIT you decide who should fix it; outside, it goes straight to the city.",
    campusName: "MANIT campus",
    campusBody: "Estate office, electrical maintenance and housekeeping teams for everything inside the campus boundary.",
    cityName: "Bhopal Municipal Corporation",
    cityBody: "Roads, waste, water supply, street lighting and sanitation for the rest of the city.",
    orgsOr: "or",
    trustTitle: "AI suggests. People decide.",
    trust: [
      { title: "Every decision is explained", body: "Each category, score and routing comes with its reason." },
      { title: "Anything can be overridden", body: "Admins change status, team or category in one click." },
      { title: "Everything is on the record", body: "Every AI decision and human change goes into an audit trail." },
      { title: "Report in your language", body: "Type or speak in Hindi or English — the AI replies in the same language." },
    ],
    footerBuilt: "Built for Web Forge 2026 at MANIT Bhopal",
    footerCode: "Source on GitHub",
  },
  hi: {
    heroTitle: "एक बार शिकायत करें। सही टीम सबसे पहले ठीक करे।",
    heroBody:
      "गड्ढे, कचरा, पानी का रिसाव, बंद स्ट्रीटलाइट, खुले तार — भोपाल में कहीं भी या MANIT कैंपस में। AI आपकी शिकायत पढ़ता है, आस-पास की दोहराई गई शिकायतें पहचानता है और खतरे के हिसाब से प्राथमिकता तय करता है, ताकि सबसे जोखिम वाली समस्याएँ पहले ठीक हों।",
    ctaReport: "शिकायत दर्ज करें",
    ctaDashboard: "लाइव डैशबोर्ड देखें",
    ticketLabel: "कार्य आदेश",
    ticketLive: "कतार से लाइव",
    ticketExample: "उदाहरण",
    ticketRouted: "भेजा गया",
    ticketUnassigned: "टीम का इंतज़ार",
    ticketPriority: "प्राथमिकता",
    statsOpen: "अभी खुली शिकायतें",
    statsUrgent: "सुरक्षा जोखिम वाली",
    statsMerged: "दोहराई गई शिकायतें जोड़ी गईं",
    statsResolved: "हल हो चुकी",
    statsNote: "वही कतार जिससे रखरखाव टीमें काम करती हैं, उसके लाइव आँकड़े।",
    stepsTitle: "जमा करने के बाद क्या होता है",
    steps: [
      { title: "AI आपकी शिकायत पढ़ता है", body: "Claude आपके शब्द पढ़ता है और फ़ोटो देखता है, फिर समस्या, उसकी गंभीरता और खतरा बताता है — एक वाक्य में जिसे आप जाँच सकते हैं।" },
      { title: "दोहराव पहचाना जाता है", body: "पिछले दो हफ़्तों में 75 मीटर के भीतर की शिकायतों का मतलब मिलाया जाता है। एक ही समस्या दो बार आए तो एक टिकट बनता है, ज़्यादा वज़न के साथ।" },
      { title: "पढ़ने लायक स्कोर", body: "सुरक्षा, गंभीरता, कितनों ने बताया, कितना इंतज़ार हुआ और कितने लोग प्रभावित हैं — मिलकर 0–100 की प्राथमिकता, हर हिस्सा दिखता है।" },
      { title: "सही टीम तक पहुँचती है", body: "उस तरह की समस्या संभालने वाली टीम को जाती है, और दो हों तो जिस पर कम काम है उसे। आप फ़ोन से इसकी स्थिति देख सकते हैं।" },
    ],
    orgsTitle: "कैंपस या शहर — आप चुनें",
    orgsBody: "दो संस्थाएँ एक ही सिस्टम से काम करती हैं। MANIT के अंदर आप तय करते हैं कि कौन ठीक करे; बाहर, शिकायत सीधे नगर निगम को जाती है।",
    campusName: "MANIT कैंपस",
    campusBody: "कैंपस सीमा के अंदर हर चीज़ के लिए एस्टेट ऑफ़िस, बिजली रखरखाव और सफ़ाई टीमें।",
    cityName: "भोपाल नगर निगम",
    cityBody: "बाकी शहर के लिए सड़क, कचरा, जल आपूर्ति, स्ट्रीट लाइट और स्वच्छता।",
    orgsOr: "या",
    trustTitle: "AI सुझाव देता है। फ़ैसला इंसान करते हैं।",
    trust: [
      { title: "हर फ़ैसले की वजह बताई जाती है", body: "हर श्रेणी, स्कोर और टीम चयन के साथ उसका कारण।" },
      { title: "कुछ भी बदला जा सकता है", body: "एडमिन एक क्लिक में स्थिति, टीम या श्रेणी बदल सकते हैं।" },
      { title: "सब कुछ रिकॉर्ड में", body: "AI का हर फ़ैसला और हर इंसानी बदलाव ऑडिट ट्रेल में दर्ज होता है।" },
      { title: "अपनी भाषा में शिकायत करें", body: "हिंदी या अंग्रेज़ी में लिखें या बोलें — AI उसी भाषा में जवाब देता है।" },
    ],
    footerBuilt: "MANIT भोपाल में Web Forge 2026 के लिए बनाया गया",
    footerCode: "GitHub पर कोड",
  },
};
