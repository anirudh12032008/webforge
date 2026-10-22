import type { Dict } from "@/lib/i18n";

type AdminCopy = {
  // Shared console chrome
  keyNumbers: string;
  justNow: string;
  ago: (wait: string) => string;
  hours: string;
  days: string;
  band: Record<string, string>;
  orgNav: string;
  orgAll: string;
  orgManit: string;
  orgBmc: string;
  loading: string;
  errorTitle: string;
  errorBody: string;
  tryAgain: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToTriage: string;
  saveError: string;
  // Dashboard
  dashEyebrow: string;
  dashTitle: string;
  dashIntro: string;
  open: string;
  openHint: string;
  urgent: string;
  urgentHint: string;
  noneFlagged: string;
  overdue: (h: number) => string;
  overdueHint: string;
  withinTarget: string;
  dupesMerged: string;
  dupesHint: string;
  // Analytics
  anEyebrow: string;
  anTitle: string;
  anIntro: string;
  exportCsv: string;
  resolved: string;
  avgResolve: string;
  openPast: (h: number) => string;
  targetMissed: string;
  trendTitle: string;
  trendDesc: string;
  reported: string;
  perDay: string;
  byCatTitle: string;
  byCatDesc: string;
  byTeamTitle: string;
  byTeamDesc: string;
  resolveTitle: string;
  resolveDesc: string;
  average: string;
  hotspots: string;
  hotspotsDesc: string;
  hotspotsEmpty: string;
  recurring: string;
  reportsN: (n: number) => string;
  last: (ago: string) => string;
  nothingToChart: string;
  trendEmpty: string;
  // Complaint page
  jumpToActions: string;
  priority: string;
  reportedLabel: string;
  by: (name: string) => string;
  report: string;
  photoAlt: (title: string) => string;
  noPhoto: string;
  location: string;
  aiAssessment: string;
  aiFallback: string;
  confident: (pct: number) => string;
  severity: string;
  safety: string;
  impact: string;
  whyScores: (score: number) => string;
  duplicates: string;
  duplicatesEmpty: string;
  related: string;
  relatedEmpty: string;
  similar: (pct: number) => string;
  override: string;
  overrideDesc: string;
  merge: string;
  mergedDesc: string;
  mergeDesc: string;
  activity: string;
  // Explain priority
  explainIntro: string;
  explainButton: string;
  asking: string;
  explainUnavailable: string;
  whyRankBefore: string;
  whyRankAfter: string;
  suggested: string;
  // Override controls
  status: string;
  category: string;
  team: string;
  assignedTeam: string;
  unassigned: string;
  categoryNote: string;
  updated: (field: string) => string;
  saving: string;
  // Merge controls
  unmerged: string;
  unmergeFrom: (id: string) => string;
  noMergeTargets: string;
  mergeIntoReport: string;
  mergeInto: string;
  mergedToast: string;
  // Audit timeline
  actions: Record<string, string>;
  unknown: string;
  noTeam: string;
  aiSummary: (category: string, fallback: boolean, score: number, team: string) => string;
  activityEmpty: string;
  ai: string;
  // Bulk actions
  bulkActions: string;
  selected: (n: number) => string;
  setStatus: string;
  newStatus: string;
  apply: string;
  clearSelection: string;
  bulkDone: (n: number, status: string) => string;
  bulkError: string;
  // Priority map and hotspots
  heat: string;
  hotspotsLayer: string;
  loadingHotspots: string;
  noHotspots: string;
  mapLayers: string;
  priorityMap: string;
  openN: (n: number) => string;
  mapUnavailable: string;
  mapItem: (category: string, score: number) => string;
  openComplaint: string;
  noOpenToPlot: string;
  low: string;
  highConcentration: string;
  priorityLegend: string;
  hotspot: string;
  unnamedLocation: string;
  recentReports: (n: number) => string;
  recurringSuffix: string;
  lastReport: (wait: string) => string;
  // Street View
  streetViewAria: string;
  streetViewLoading: string;
  streetViewNone: (m: number) => string;
  streetViewUnavailable: string;
  // Triage table
  colIssue: string;
  colReports: string;
  colWaiting: string;
  bandPriority: (band: string) => string;
  moreReports: (n: number) => string;
  waitingLonger: (h: number) => string;
  allStatuses: string;
  allCategories: string;
  clear: string;
  sort: string;
  sortPriority: string;
  sortOldest: string;
  sortNewest: string;
  triageQueue: string;
  noMatch: string;
  queueClear: string;
  clearFilters: string;
  range: (from: number, to: number, total: number) => string;
  zeroOf: (total: number) => string;
  previous: string;
  next: string;
  selectAll: string;
  selectRow: (title: string) => string;
};

export const ADMIN: Dict<AdminCopy> = {
  en: {
    keyNumbers: "Key numbers",
    justNow: "just now",
    ago: (wait) => `${wait} ago`,
    hours: "h",
    days: "d",
    band: { Urgent: "Urgent", Elevated: "Elevated", Routine: "Routine" },
    orgNav: "Organisation",
    orgAll: "All",
    orgManit: "MANIT campus",
    orgBmc: "Bhopal city",
    loading: "Loading",
    errorTitle: "Couldn't load this page",
    errorBody: "The complaint data didn't come through. Check your connection and try again.",
    tryAgain: "Try again",
    notFoundTitle: "Complaint not found",
    notFoundBody: "This link doesn't match any complaint. It may have been mistyped.",
    backToTriage: "Back to triage",
    saveError: "Couldn't save the change.",
    dashEyebrow: "Ops console · live queue",
    dashTitle: "Triage",
    dashIntro: "Open complaints across campus and city, ranked by AI priority. Open any row to review, assign or override.",
    open: "Open",
    openHint: "In the queue now",
    urgent: "Safety risk 4 to 5",
    urgentHint: "Check these first",
    noneFlagged: "None flagged",
    overdue: (h) => `Waiting over ${h} h`,
    overdueHint: "Past the response target",
    withinTarget: "All within target",
    dupesMerged: "Duplicates merged",
    dupesHint: "Reports folded into one",
    anEyebrow: "Ops console · last 30 days",
    anTitle: "Analytics",
    anIntro: "How fast problems are reported and fixed, which teams are stretched, and where issues keep coming back.",
    exportCsv: "Export CSV",
    resolved: "Resolved",
    avgResolve: "Avg. time to resolve",
    openPast: (h) => `Open past ${h} h`,
    targetMissed: "Response target missed",
    trendTitle: "Reported vs resolved",
    trendDesc: "Complaints per day, last 30 days",
    reported: "Reported",
    perDay: "Complaints / day",
    byCatTitle: "Open by category",
    byCatDesc: "Number of open complaints",
    byTeamTitle: "Open by team",
    byTeamDesc: "Number of open complaints assigned",
    resolveTitle: "Time to resolve",
    resolveDesc: "Average hours from report to fix, by category",
    average: "Average",
    hotspots: "Hotspots",
    hotspotsDesc: "Places where 2+ reports landed within 60 m",
    hotspotsEmpty: "No clusters yet. Hotspots appear when 2 or more reports land within 60 m.",
    recurring: "Recurring",
    reportsN: (n) => `${n} reports`,
    last: (ago) => `last ${ago}`,
    nothingToChart: "Nothing to chart yet.",
    trendEmpty: "No complaints reported or resolved in the last 30 days.",
    jumpToActions: "Jump to actions",
    priority: "Priority",
    reportedLabel: "Reported",
    by: (name) => ` by ${name}`,
    report: "Report",
    photoAlt: (title) => `Photo of ${title}`,
    noPhoto: "No photo attached to this report.",
    location: "Location",
    aiAssessment: "AI assessment",
    aiFallback: "The AI couldn't classify this report. Set the category in Override.",
    confident: (pct) => `${pct}% confident`,
    severity: "Severity",
    safety: "Safety",
    impact: "Impact",
    whyScores: (score) => `Why it scores ${score}`,
    duplicates: "Duplicate reports",
    duplicatesEmpty: "Nobody else has reported this exact issue.",
    related: "Related nearby",
    relatedEmpty: "No similar reports within 75 m in the last 30 days.",
    similar: (pct) => `${pct}% similar`,
    override: "Override",
    overrideDesc: "Each change saves immediately and is logged in Activity.",
    merge: "Merge",
    mergedDesc: "Merged as a duplicate of another report.",
    mergeDesc: "Fold this into a nearby report of the same issue.",
    activity: "Activity",
    explainIntro: "Ask the AI why this complaint sits at its place in the queue and which crew to send.",
    explainButton: "Why this rank?",
    asking: "Asking the AI…",
    explainUnavailable: "Explanation unavailable.",
    whyRankBefore: "Why this is",
    whyRankAfter: "in the queue",
    suggested: "Suggested resources: ",
    status: "Status",
    category: "Category",
    team: "Team",
    assignedTeam: "Assigned team",
    unassigned: "Unassigned",
    categoryNote: "Changing the category overrides the AI and is recorded in Activity.",
    updated: (field) => `${field} updated`,
    saving: "Saving",
    unmerged: "Unmerged",
    unmergeFrom: (id) => `Unmerge from #${id}`,
    noMergeTargets: "No nearby reports to merge with.",
    mergeIntoReport: "Merge into report",
    mergeInto: "Merge into",
    mergedToast: "Merged as a duplicate",
    actions: { ai_analysis: "AI analysed the report", status_change: "Status changed", assign: "Team assigned", category_override: "Category overridden" },
    unknown: "Unknown",
    noTeam: "no team",
    aiSummary: (category, fallback, score, team) => `${category}${fallback ? " (fallback, needs review)" : ""}, priority ${score}, routed to ${team}`,
    activityEmpty: "No activity yet. AI analysis and every override will appear here.",
    ai: "AI",
    bulkActions: "Bulk actions",
    selected: (n) => `${n} selected`,
    setStatus: "Set status",
    newStatus: "New status",
    apply: "Apply",
    clearSelection: "Clear selection",
    bulkDone: (n, status) => `${n} complaint${n === 1 ? "" : "s"} set to ${status}`,
    bulkError: "Couldn't update the complaints.",
    heat: "Heat",
    hotspotsLayer: "Hotspots",
    loadingHotspots: "Loading hotspots",
    noHotspots: "No hotspots yet",
    mapLayers: "Map layers",
    priorityMap: "Priority map",
    openN: (n) => `${n} open`,
    mapUnavailable: "Map unavailable: the Google Maps key isn't configured.",
    mapItem: (category, score) => `${category}, priority ${score}`,
    openComplaint: "Open complaint",
    noOpenToPlot: "No open complaints to plot",
    low: "Low",
    highConcentration: "High concentration",
    priorityLegend: "Priority legend",
    hotspot: "Hotspot",
    unnamedLocation: "Unnamed location",
    recentReports: (n) => `${n} report${n === 1 ? "" : "s"} in the last 30 days`,
    recurringSuffix: ": recurring",
    lastReport: (wait) => `Last report ${wait} ago`,
    streetViewAria: "Street View of the reported location",
    streetViewLoading: "Loading Street View…",
    streetViewNone: (m) => `No Street View imagery within ${m} m of this spot.`,
    streetViewUnavailable: "Street View unavailable: the Google Maps key isn't configured.",
    colIssue: "Issue",
    colReports: "Reports",
    colWaiting: "Waiting",
    bandPriority: (band) => `${band} priority`,
    moreReports: (n) => `${n} more report(s) of this issue`,
    waitingLonger: (h) => `Waiting longer than ${h} h`,
    allStatuses: "All statuses",
    allCategories: "All categories",
    clear: "Clear",
    sort: "Sort",
    sortPriority: "Highest priority",
    sortOldest: "Waiting longest",
    sortNewest: "Newest",
    triageQueue: "Triage queue",
    noMatch: "No complaints match these filters.",
    queueClear: "The queue is clear.",
    clearFilters: "Clear filters",
    range: (from, to, total) => `${from} to ${to} of ${total}`,
    zeroOf: (total) => `0 of ${total}`,
    previous: "Previous",
    next: "Next",
    selectAll: "Select all complaints on this page",
    selectRow: (title) => `Select ${title}`,
  },
  hi: {
    keyNumbers: "मुख्य आँकड़े",
    justNow: "अभी",
    ago: (wait) => `${wait} पहले`,
    hours: "घंटे",
    days: "दिन",
    band: { Urgent: "अति आवश्यक", Elevated: "ऊँची", Routine: "सामान्य" },
    orgNav: "संस्था",
    orgAll: "सभी",
    orgManit: "मैनिट कैंपस",
    orgBmc: "भोपाल शहर",
    loading: "लोड हो रहा है",
    errorTitle: "यह पेज लोड नहीं हो पाया",
    errorBody: "शिकायतों का डेटा नहीं आ पाया। अपना कनेक्शन जाँचें और फिर कोशिश करें।",
    tryAgain: "फिर कोशिश करें",
    notFoundTitle: "शिकायत नहीं मिली",
    notFoundBody: "यह लिंक किसी शिकायत से मेल नहीं खाता। शायद गलत टाइप हुआ है।",
    backToTriage: "ट्राइएज पर वापस",
    saveError: "बदलाव सेव नहीं हो पाया।",
    dashEyebrow: "ऑप्स कंसोल · लाइव कतार",
    dashTitle: "ट्राइएज",
    dashIntro: "कैंपस और शहर की खुली शिकायतें, AI प्राथमिकता के क्रम में। देखने, सौंपने या बदलने के लिए कोई भी पंक्ति खोलें।",
    open: "खुली",
    openHint: "अभी कतार में",
    urgent: "सुरक्षा जोखिम 4 से 5",
    urgentHint: "इन्हें पहले देखें",
    noneFlagged: "कोई नहीं",
    overdue: (h) => `${h} घंटे से ज़्यादा इंतज़ार`,
    overdueHint: "जवाब की समय सीमा पार",
    withinTarget: "सभी समय सीमा में",
    dupesMerged: "जोड़ी गई दोहरी शिकायतें",
    dupesHint: "एक में मिलाई गई शिकायतें",
    anEyebrow: "ऑप्स कंसोल · पिछले 30 दिन",
    anTitle: "आँकड़े",
    anIntro: "समस्याएँ कितनी जल्दी दर्ज और ठीक होती हैं, किन टीमों पर ज़्यादा बोझ है, और कहाँ समस्याएँ बार बार लौटती हैं।",
    exportCsv: "CSV डाउनलोड करें",
    resolved: "ठीक हुईं",
    avgResolve: "ठीक होने का औसत समय",
    openPast: (h) => `${h} घंटे से ज़्यादा खुली`,
    targetMissed: "जवाब की समय सीमा छूटी",
    trendTitle: "दर्ज बनाम ठीक हुईं",
    trendDesc: "प्रति दिन शिकायतें, पिछले 30 दिन",
    reported: "दर्ज",
    perDay: "शिकायतें प्रति दिन",
    byCatTitle: "श्रेणी के अनुसार खुली",
    byCatDesc: "खुली शिकायतों की संख्या",
    byTeamTitle: "टीम के अनुसार खुली",
    byTeamDesc: "सौंपी गई खुली शिकायतों की संख्या",
    resolveTitle: "ठीक होने में समय",
    resolveDesc: "शिकायत से सुधार तक औसत घंटे, श्रेणी के अनुसार",
    average: "औसत",
    hotspots: "हॉटस्पॉट",
    hotspotsDesc: "वे जगहें जहाँ 60 मीटर के भीतर 2 या ज़्यादा शिकायतें आईं",
    hotspotsEmpty: "अभी कोई समूह नहीं। 60 मीटर के भीतर 2 या ज़्यादा शिकायतें आने पर हॉटस्पॉट दिखते हैं।",
    recurring: "बार बार",
    reportsN: (n) => `${n} शिकायतें`,
    last: (ago) => `आख़िरी ${ago}`,
    nothingToChart: "दिखाने के लिए अभी कुछ नहीं।",
    trendEmpty: "पिछले 30 दिनों में कोई शिकायत दर्ज या ठीक नहीं हुई।",
    jumpToActions: "कार्रवाई पर जाएँ",
    priority: "प्राथमिकता",
    reportedLabel: "दर्ज हुई",
    by: (name) => `, ${name} द्वारा`,
    report: "शिकायत",
    photoAlt: (title) => `${title} की फ़ोटो`,
    noPhoto: "इस शिकायत के साथ कोई फ़ोटो नहीं है।",
    location: "जगह",
    aiAssessment: "AI आकलन",
    aiFallback: "AI इस शिकायत की श्रेणी तय नहीं कर पाया। बदलाव वाले हिस्से में श्रेणी चुनें।",
    confident: (pct) => `${pct}% भरोसा`,
    severity: "गंभीरता",
    safety: "सुरक्षा",
    impact: "असर",
    whyScores: (score) => `स्कोर ${score} क्यों है`,
    duplicates: "दोहरी शिकायतें",
    duplicatesEmpty: "किसी और ने यही समस्या दर्ज नहीं की है।",
    related: "आस पास की मिलती जुलती",
    relatedEmpty: "पिछले 30 दिनों में 75 मीटर के भीतर कोई मिलती जुलती शिकायत नहीं।",
    similar: (pct) => `${pct}% मिलती`,
    override: "बदलाव",
    overrideDesc: "हर बदलाव तुरंत सेव होता है और गतिविधि में दर्ज होता है।",
    merge: "जोड़ें",
    mergedDesc: "दूसरी शिकायत की दोहरी शिकायत के रूप में जोड़ी गई।",
    mergedToast: "दोहरी शिकायत के रूप में जोड़ी गई",
    mergeDesc: "इसे आस पास की उसी समस्या वाली शिकायत में मिलाएँ।",
    activity: "गतिविधि",
    explainIntro: "AI से पूछें कि यह शिकायत कतार में इस जगह क्यों है और कौन सी टीम भेजें।",
    explainButton: "यह रैंक क्यों?",
    asking: "AI से पूछ रहे हैं…",
    explainUnavailable: "जानकारी उपलब्ध नहीं है।",
    whyRankBefore: "यह कतार में",
    whyRankAfter: "पर क्यों है",
    suggested: "सुझाए गए संसाधन: ",
    status: "स्थिति",
    category: "श्रेणी",
    team: "टीम",
    assignedTeam: "सौंपी गई टीम",
    unassigned: "किसी को नहीं सौंपी",
    categoryNote: "श्रेणी बदलने से AI का फ़ैसला बदल जाता है और यह गतिविधि में दर्ज होता है।",
    updated: (field) => `${field} अपडेट हुई`,
    saving: "सेव हो रहा है",
    unmerged: "अलग की गई",
    unmergeFrom: (id) => `#${id} से अलग करें`,
    noMergeTargets: "जोड़ने के लिए आस पास कोई शिकायत नहीं।",
    mergeIntoReport: "किस शिकायत में जोड़ें",
    mergeInto: "इसमें जोड़ें",
    actions: { ai_analysis: "AI ने शिकायत जाँची", status_change: "स्थिति बदली", assign: "टीम सौंपी गई", category_override: "श्रेणी बदली गई" },
    unknown: "अज्ञात",
    noTeam: "कोई टीम नहीं",
    aiSummary: (category, fallback, score, team) => `${category}${fallback ? " (फ़ॉलबैक, जाँच ज़रूरी)" : ""}, प्राथमिकता ${score}, ${team} को भेजी गई`,
    activityEmpty: "अभी कोई गतिविधि नहीं। AI जाँच और हर बदलाव यहाँ दिखेगा।",
    ai: "AI",
    bulkActions: "एक साथ कार्रवाई",
    selected: (n) => `${n} चुनी गईं`,
    setStatus: "स्थिति तय करें",
    newStatus: "नई स्थिति",
    apply: "लागू करें",
    clearSelection: "चुनाव हटाएँ",
    bulkDone: (n, status) => `${n} शिकायतों की स्थिति: ${status}`,
    bulkError: "शिकायतें अपडेट नहीं हो पाईं।",
    heat: "हीट",
    hotspotsLayer: "हॉटस्पॉट",
    loadingHotspots: "हॉटस्पॉट लोड हो रहे हैं",
    noHotspots: "अभी कोई हॉटस्पॉट नहीं",
    mapLayers: "नक्शे की परतें",
    priorityMap: "प्राथमिकता नक्शा",
    openN: (n) => `${n} खुली`,
    mapUnavailable: "नक्शा उपलब्ध नहीं: Google Maps की कुंजी सेट नहीं है।",
    mapItem: (category, score) => `${category}, प्राथमिकता ${score}`,
    openComplaint: "शिकायत खोलें",
    noOpenToPlot: "नक्शे पर दिखाने के लिए कोई खुली शिकायत नहीं",
    low: "कम",
    highConcentration: "ज़्यादा घनत्व",
    priorityLegend: "प्राथमिकता के रंग",
    hotspot: "हॉटस्पॉट",
    unnamedLocation: "बिना नाम की जगह",
    recentReports: (n) => `पिछले 30 दिनों में ${n} शिकायतें`,
    recurringSuffix: ", बार बार",
    lastReport: (wait) => `आख़िरी शिकायत ${wait} पहले`,
    streetViewAria: "शिकायत वाली जगह का स्ट्रीट व्यू",
    streetViewLoading: "स्ट्रीट व्यू लोड हो रहा है…",
    streetViewNone: (m) => `इस जगह के ${m} मीटर के भीतर स्ट्रीट व्यू उपलब्ध नहीं।`,
    streetViewUnavailable: "स्ट्रीट व्यू उपलब्ध नहीं: Google Maps की कुंजी सेट नहीं है।",
    colIssue: "समस्या",
    colReports: "शिकायतें",
    colWaiting: "इंतज़ार",
    bandPriority: (band) => `${band} प्राथमिकता`,
    moreReports: (n) => `इसी समस्या की ${n} और शिकायतें`,
    waitingLonger: (h) => `${h} घंटे से ज़्यादा इंतज़ार`,
    allStatuses: "सभी स्थितियाँ",
    allCategories: "सभी श्रेणियाँ",
    clear: "हटाएँ",
    sort: "क्रम",
    sortPriority: "सबसे ज़्यादा प्राथमिकता",
    sortOldest: "सबसे लंबा इंतज़ार",
    sortNewest: "सबसे नई",
    triageQueue: "ट्राइएज कतार",
    noMatch: "इन फ़िल्टर से कोई शिकायत मेल नहीं खाती।",
    queueClear: "कतार खाली है।",
    clearFilters: "फ़िल्टर हटाएँ",
    range: (from, to, total) => `${total} में से ${from} से ${to}`,
    zeroOf: (total) => `${total} में से 0`,
    previous: "पिछला",
    next: "अगला",
    selectAll: "इस पेज की सभी शिकायतें चुनें",
    selectRow: (title) => `${title} चुनें`,
  },
};
