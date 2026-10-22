import type { Dict } from "@/lib/i18n";

type ReportCopy = {
  pageTitle: string;
  pageIntro: string;
  useMyLocation: string;
  finding: string;
  locationError: string;
  mapUnavailable: string;
  pinnedAt: (lat: string, lng: string) => string;
  whereLegend: string;
  lookingUpAddress: string;
  whoFixes: string;
  campusHandled: string;
  cityHandled: string;
  goesTo: (org: string) => string;
  notCovered: string;
  whatLegend: string;
  titleLabel: string;
  titlePlaceholder: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  photoLabel: string;
  takePhoto: string;
  photoAlt: string;
  removePhoto: string;
  photoReadError: string;
  nameLabel: string;
  contactLabel: string;
  needPhotoOrText: string;
  pinToSubmit: string;
  pinFirst: string;
  submit: string;
  uploading: string;
  analysing: string;
  uploadFailed: (reason: string) => string;
  submitted: string;
  submitError: string;
  another: string;
  voiceStart: string;
  voiceStop: string;
  voiceDenied: string;
  voiceError: string;
  received: (id: string) => string;
  queue: (rank: number, score: number) => string;
  fallback: string;
  sure: (pct: number) => string;
  severity: string;
  safety: string;
  people: string;
  whyRanks: string;
  duplicateOf: (id: string) => string;
  similar: (n: number) => string;
  firstReport: string;
};

export const REPORT: Dict<ReportCopy> = {
  en: {
    pageTitle: "Report an issue",
    pageIntro: "Pin where it is and add a photo or a few words. AI sorts your report, checks whether it's already been reported, and sends it to the team that can fix it.",
    useMyLocation: "Use my location",
    finding: "Finding you…",
    locationError: "Couldn't get your location. Allow location access or tap the map instead.",
    mapUnavailable: "The map isn't available right now. Use your current location instead.",
    pinnedAt: (lat, lng) => `Pinned at ${lat}, ${lng}`,
    whereLegend: "Where is it?",
    lookingUpAddress: "Pinned. Looking up the address…",
    whoFixes: "Who should fix it?",
    campusHandled: "Handled by the campus maintenance office",
    cityHandled: "Handled by the municipal corporation",
    goesTo: (org) => `This goes to ${org}.`,
    notCovered: "We can't take reports for this location yet.",
    whatLegend: "What's wrong?",
    titleLabel: "Short title (optional, AI writes one if you skip it)",
    titlePlaceholder: "Open manhole near Hostel 7 gate",
    detailsLabel: "Details",
    detailsPlaceholder: "What you saw, how big it is, since when, anyone hurt?",
    photoLabel: "Photo (helps the AI judge how serious it is)",
    takePhoto: "Take or choose a photo",
    photoAlt: "Selected photo",
    removePhoto: "Remove photo",
    photoReadError: "Couldn't read that photo. Try a JPEG or PNG.",
    nameLabel: "Your name (optional)",
    contactLabel: "Phone or email (optional)",
    needPhotoOrText: "Add a photo or describe the problem (at least 10 characters).",
    pinToSubmit: "Pin the location on the map to submit.",
    pinFirst: "Pin where the problem is on the map first.",
    submit: "Submit report",
    uploading: "Uploading photo…",
    analysing: "AI is reviewing your report…",
    uploadFailed: (reason) => `${reason} Sending your report without the photo.`,
    submitted: "Report submitted",
    submitError: "Couldn't submit the report.",
    another: "Report another issue",
    voiceStart: "Speak to type",
    voiceStop: "Listening… tap to stop",
    voiceDenied: "Microphone access was blocked. Allow it in your browser to use voice typing.",
    voiceError: "Voice typing stopped. Try again or type instead.",
    received: (id) => `Report ${id} received`,
    queue: (rank, score) => `#${rank} in the queue, priority ${score}/100`,
    fallback: "AI couldn't review this one, so a person will categorise it.",
    sure: (pct) => `${pct}% sure`,
    severity: "Severity",
    safety: "Safety risk",
    people: "People affected",
    whyRanks: "Why it ranks here",
    duplicateOf: (id) => `Already reported as ${id}. Your report was added to it, which raises its priority.`,
    similar: (n) => `${n} similar report${n > 1 ? "s" : ""} within 75 m. They're linked so the team sees them together.`,
    firstReport: "First report of this issue nearby.",
  },
  hi: {
    pageTitle: "शिकायत दर्ज करें",
    pageIntro: "नक्शे पर जगह चुनें और फ़ोटो या कुछ शब्द जोड़ें। AI आपकी शिकायत को समझता है, देखता है कि पहले किसी ने बताई है या नहीं, और सही टीम तक पहुँचाता है।",
    useMyLocation: "मेरी लोकेशन लें",
    finding: "लोकेशन ढूँढ रहे हैं…",
    locationError: "आपकी लोकेशन नहीं मिल पाई। लोकेशन की अनुमति दें या नक्शे पर टैप करें।",
    mapUnavailable: "नक्शा अभी उपलब्ध नहीं है। अपनी मौजूदा लोकेशन इस्तेमाल करें।",
    pinnedAt: (lat, lng) => `चुनी गई जगह: ${lat}, ${lng}`,
    whereLegend: "समस्या कहाँ है?",
    lookingUpAddress: "जगह चुन ली गई। पता ढूँढ रहे हैं…",
    whoFixes: "इसे कौन ठीक करे?",
    campusHandled: "कैंपस मेंटेनेंस ऑफ़िस देखेगा",
    cityHandled: "नगर निगम देखेगा",
    goesTo: (org) => `यह शिकायत ${org} को जाएगी।`,
    notCovered: "इस जगह के लिए अभी शिकायत नहीं ली जा सकती।",
    whatLegend: "क्या समस्या है?",
    titleLabel: "छोटा शीर्षक (वैकल्पिक, छोड़ने पर AI लिख देगा)",
    titlePlaceholder: "हॉस्टल 7 गेट के पास खुला मैनहोल",
    detailsLabel: "विवरण",
    detailsPlaceholder: "क्या दिखा, कितना बड़ा है, कब से है, कोई घायल हुआ?",
    photoLabel: "फ़ोटो (AI को गंभीरता समझने में मदद करती है)",
    takePhoto: "फ़ोटो लें या चुनें",
    photoAlt: "चुनी गई फ़ोटो",
    removePhoto: "फ़ोटो हटाएँ",
    photoReadError: "यह फ़ोटो नहीं खुल पाई। JPEG या PNG आज़माएँ।",
    nameLabel: "आपका नाम (वैकल्पिक)",
    contactLabel: "फ़ोन या ईमेल (वैकल्पिक)",
    needPhotoOrText: "फ़ोटो जोड़ें या समस्या लिखें (कम से कम 10 अक्षर)।",
    pinToSubmit: "भेजने के लिए नक्शे पर जगह चुनें।",
    pinFirst: "पहले नक्शे पर समस्या की जगह चुनें।",
    submit: "शिकायत भेजें",
    uploading: "फ़ोटो अपलोड हो रही है…",
    analysing: "AI आपकी शिकायत देख रहा है…",
    uploadFailed: (reason) => `${reason} शिकायत बिना फ़ोटो के भेज रहे हैं।`,
    submitted: "शिकायत भेज दी गई",
    submitError: "शिकायत नहीं भेजी जा सकी।",
    another: "एक और शिकायत करें",
    voiceStart: "बोलकर लिखें",
    voiceStop: "सुन रहे हैं… रोकने के लिए टैप करें",
    voiceDenied: "माइक्रोफ़ोन की अनुमति नहीं मिली। बोलकर लिखने के लिए ब्राउज़र में अनुमति दें।",
    voiceError: "बोलकर लिखना रुक गया। फिर से कोशिश करें या टाइप करें।",
    received: (id) => `शिकायत ${id} मिल गई`,
    queue: (rank, score) => `कतार में #${rank}, प्राथमिकता ${score}/100`,
    fallback: "AI इसे नहीं समझ पाया, इसलिए कोई व्यक्ति इसकी श्रेणी तय करेगा।",
    sure: (pct) => `${pct}% भरोसा`,
    severity: "गंभीरता",
    safety: "सुरक्षा जोखिम",
    people: "प्रभावित लोग",
    whyRanks: "यह इस स्थान पर क्यों है",
    duplicateOf: (id) => `यह पहले ${id} के रूप में दर्ज है। आपकी शिकायत उसमें जोड़ दी गई, जिससे उसकी प्राथमिकता बढ़ गई।`,
    similar: (n) => `75 मीटर के अंदर ${n} मिलती-जुलती शिकायतें हैं। इन्हें जोड़ दिया गया है ताकि टीम एक साथ देखे।`,
    firstReport: "आस-पास इस समस्या की यह पहली शिकायत है।",
  },
};
