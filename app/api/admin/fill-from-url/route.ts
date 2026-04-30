import { NextResponse } from "next/server";
import { chromium as playwrightChromium, type Browser, type Page } from "playwright";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";

type FillResponse =
  | {
      ok: true;
      data: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
    };

const FISH_KEYWORDS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "Короп", patterns: [/\bкороп\b/i] },
  { name: "Сазан", patterns: [/\bsazan\b/i, /\bсазан\b/i] },
  { name: "Білий амур", patterns: [/\bамур\b/i, /\bбілий\s+амур\b/i] },
  { name: "Товстолоб", patterns: [/\bтовстолоб\b/i, /\bтовстолобик\b/i] },
  { name: "Щука", patterns: [/\bщук[аи]\b/i] },
  { name: "Судак", patterns: [/\bсудак\b/i] },
  { name: "Окунь", patterns: [/\bокун[ья]\b/i] },
  { name: "Сом", patterns: [/\bсом\b/i] },
  { name: "Лин", patterns: [/\bлин\b/i] },
  { name: "Карась", patterns: [/\bкарась\b/i] },
  { name: "Голець", patterns: [/\bголець\b/i, /\bгольц[яьі]\b/i] },
  { name: "Плітка", patterns: [/\bплітк[аи]\b/i, /\bплотв[аи]\b/i] },
  { name: "Лящ", patterns: [/\bлящ\b/i] },
  { name: "Форель", patterns: [/\bфорел[ьяі]\b/i] },
  { name: "Осетер", patterns: [/\bосетер\b/i] },
  { name: "Стерлядь", patterns: [/\bстерляд[ьяі]\b/i] },
  { name: "Білизна", patterns: [/\bбелизна\b/i, /\bбілизн[аи]\b/i] },
  { name: "Краснопірка", patterns: [/\bкраснопірк[аи]\b/i] },
  { name: "Рак", patterns: [/\brak\b/i, /\bрак\b/i] },
];

const AMENITY_KEYWORDS: Array<{ key: string; label: string; patterns: RegExp[] }> = [
  { key: "parking", label: "Парковка", patterns: [/\bпарковк/i, /\bparking\b/i] },
  { key: "toilet", label: "Туалет", patterns: [/\bтуалет\b/i] },
  { key: "shower", label: "Душ", patterns: [/\bдуш\b/i] },
  { key: "electricity", label: "Електрика на секторі", patterns: [/\bелектрик/i, /\bрозетк/i] },
  { key: "drinking_water", label: "Питна вода", patterns: [/\bпитн(а|ої)\s+вод/i, /\bwater\b/i] },
  { key: "wifi", label: "Wi-Fi", patterns: [/\bw-?fi\b/i, /\bвай[-\s]?фай\b/i] },
  { key: "gazebos", label: "Альтанки", patterns: [/\bальтанк/i, /\bбеседк/i] },
  { key: "houses", label: "Будиночки", patterns: [/\bбудиночк/i, /\bдомик/i, /\bcabin\b/i] },
  { key: "piers", label: "Містки", patterns: [/\bмістк/i, /\bпірс/i, /\bpier\b/i] },
  { key: "grill", label: "Мангал", patterns: [/\bмангал\b/i, /\bgrill\b/i] },
  { key: "firewood", label: "Дрова", patterns: [/\bдров/i, /\bfirewood\b/i] },
  { key: "cafe", label: "Кафе", patterns: [/\bкафе\b/i, /\bcafe\b/i] },
  { key: "bait_shop", label: "Магазин наживки", patterns: [/\bнаживк/i, /\bмагазин\s+наживк/i, /\bbait\b/i] },
  { key: "gear_rental", label: "Прокат снастей", patterns: [/\bпрокат\s+снаст/i, /\bоренда\s+снаст/i, /\bgear\s+rental\b/i] },
  { key: "boat_rental", label: "Оренда човна", patterns: [/\bчовн/i, /\bоренда\s+човн/i, /\bboat\b/i] },
  { key: "fish_cleaning", label: "Чистка риби", patterns: [/\bчистк[аи]\s+риб/i, /\bcleaning\b/i] },
  { key: "card_payment", label: "Оплата картою", patterns: [/\bкартою\b/i, /\bcard\b/i, /\bterminal\b/i] },
  { key: "playground", label: "Дитячий майданчик", patterns: [/\bмайданчик\b/i, /\bplayground\b/i] },
  { key: "mats", label: "Мат", patterns: [/\bмат\b/i, /\bкарпов[ийо]\s+мат\b/i] },
  { key: "keepnet", label: "Садок", patterns: [/\bсадок\b/i] },
  { key: "landing_net", label: "Підсака", patterns: [/\bпідсак/i, /\bпідсака\b/i, /\bсак\b/i] },
];

function jsonReply(payload: FillResponse, status = 200) {
  return NextResponse.json(payload, { status });
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

function normalizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  url.hash = "";
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((param) => {
    url.searchParams.delete(param);
  });
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url;
}

function isSameOrigin(candidate: URL, base: URL) {
  return candidate.origin === base.origin;
}

function linkScore(url: URL) {
  const path = `${url.pathname}${url.search}`.toLowerCase();
  const keywords = [
    ["about", 40],
    ["pro-nas", 40],
    ["contacts", 40],
    ["contact", 40],
    ["price", 30],
    ["prices", 30],
    ["tarif", 30],
    ["rules", 26],
    ["fish", 24],
    ["trophy", 24],
    ["gallery", 18],
    ["services", 18],
    ["infrastructure", 18],
    ["faq", 16],
    ["map", 12],
    ["location", 12],
  ] as const;
  return keywords.reduce((score, [needle, value]) => score + (path.includes(needle) ? value : 0), 0);
}

function extractLinks(html: string, pageUrl: URL) {
  const links = new Set<string>();
  const hrefRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html))) {
    const href = match[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      const resolved = normalizeUrl(new URL(href, pageUrl).toString());
      if (isSameOrigin(resolved, pageUrl)) {
        links.add(resolved.toString());
      }
    } catch {
      // ignore bad links
    }
  }
  return Array.from(links);
}

function getPresetUrls(base: URL, hint: string | null = null) {
  const host = base.hostname.toLowerCase();
  const normalizedHint = normalizeHintText(hint ?? "");
  const candidates = new Set<string>([
    "/", "/about", "/contacts", "/contact", "/prices", "/price", "/rules", "/fish", "/trophies",
    "/gallery", "/services", "/infrastructure", "/map", "/location", "/faq", "/about-us",
  ]);

  if (host.includes("avanfish.com")) {
    ["/", "/about", "/contacts", "/price", "/trophies"].forEach((path) => candidates.add(path));
  }

  if (host.includes("belie-kamni.com")) {
    [
      "/", "/price", "/rules", "/contacts", "/gallery", "/riba", "/norma", "/corp", "/cafe",
      "/do", "/bk1", "/bk11", "/bk13",
    ].forEach((path) => candidates.add(path));

    if (/форел|bk[-\s]?1|бк[-\s]?1/.test(normalizedHint)) candidates.add("/bk1");
    if (/щуч|bk[-\s]?1\.1|1\.1/.test(normalizedHint)) candidates.add("/bk11");
    if (/лин|линов|bk[-\s]?1\.3|1\.3/.test(normalizedHint)) candidates.add("/bk13");
    if (/дит|child|do\b/.test(normalizedHint)) candidates.add("/do");
  }

  return Array.from(candidates).map((path) => new URL(path, base).toString());
}

function normalizeHintText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’'".,()/\\_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pageScore(page: CrawledPage, hint: string | null) {
  if (!hint) return 0;
  const haystack = normalizeHintText([page.url, page.title ?? "", page.text].join(" "));
  const needle = normalizeHintText(hint);
  const tokens = needle.split(" ").filter((token) => token.length > 1);
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) score += 25;
  }

  if (/форел/i.test(needle) && /bk1|форел/i.test(haystack)) score += 120;
  if (/щуч/i.test(needle) && /bk11|щуч/i.test(haystack)) score += 120;
  if (/лин/i.test(needle) && /bk13|лин/i.test(haystack)) score += 120;
  if (/дит/i.test(needle) && /do|дит/i.test(haystack)) score += 120;
  if (/avanfish|аванф/i.test(needle) && /avanfish|аванф/i.test(haystack)) score += 120;

  return score;
}

function dedupeStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim())));
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(html: string) {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|section|article|header|footer|tr|td)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(withoutNoise)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index, arr) => arr.indexOf(line) === index);
}

function firstMatch(lines: string[], patterns: RegExp[]) {
  for (const line of lines) {
    if (patterns.some((pattern) => pattern.test(line))) return line;
  }
  return null;
}

function collectPhones(text: string) {
  const matches = text.match(/(?:\+?38[\s().-]?)?(?:0\d{2})[\s().-]?\d{3}[\s().-]?\d{2}[\s().-]?\d{2}/g) ?? [];
  const normalized = matches
    .map((m) => m.replace(/[^\d+]/g, ""))
    .map((m) => (m.startsWith("+") ? m : `+${m}`))
    .filter((m) => {
      const digits = m.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 12;
    });
  return Array.from(new Set(normalized));
}

function guessCoordinates(text: string) {
  const patterns = [
    /широта[:\s]*([0-9]{1,2}\.[0-9]+)[^\n]*довгота[:\s]*([0-9]{1,3}\.[0-9]+)/i,
    /довгота[:\s]*([0-9]{1,3}\.[0-9]+)[^\n]*широта[:\s]*([0-9]{1,2}\.[0-9]+)/i,
    /([0-9]{1,2}\.[0-9]+)[,\s]+([0-9]{1,3}\.[0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const first = parseFloat(match[1]);
    const second = parseFloat(match[2]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) continue;
    const lat = first >= 45 && first <= 55 ? first : second;
    const lng = first >= 20 && first <= 40 ? first : second;
    if (lat >= 45 && lat <= 55 && lng >= 20 && lng <= 40) {
      return { lat, lng };
    }
  }

  return null;
}

function extractMeta(html: string, name: string) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  return html.match(re)?.[1] ?? null;
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
}

function guessCity(text: string) {
  const lines = text.split("\n");
  const candidates = lines.filter((line) => /(область|район|с\.|село|місто|смт|м\.|вул\.|метро|київ|kyiv)/i.test(line));
  return candidates.find((line) => line.length <= 90) ?? candidates[0] ?? null;
}

function guessLocation(text: string) {
  const lines = text.split("\n");
  const candidates = lines.filter((line) => /(адрес|розташован|вул\.|метро|м\.|gps|координат)/i.test(line));
  return candidates.find((line) => line.length <= 110) ?? null;
}

function selectBestPage(pages: CrawledPage[], hint: string | null) {
  if (pages.length === 0) return null;
  if (!hint) return pages[0] ?? null;
  return pages
    .slice()
    .sort((a, b) => pageScore(b, hint) - pageScore(a, hint))[0] ?? pages[0] ?? null;
}

function guessSchedule(text: string) {
  const normalized = text.toLowerCase();
  const is24h = /цілодобово|24\s*\/\s*7|24\s*год/i.test(normalized);
  const bookingRequired = /брон/i.test(normalized);
  const seasonal = /сезон/i.test(normalized);
  const winterFishing = /зимов/i.test(normalized) ? true : null;
  const nightFishing = /нічн/i.test(normalized) ? true : null;
  const openTime = text.match(/\b(0?\d|1\d|2[0-3]):[0-5]\d\b/)?.[0] ?? null;
  const closeTime = text.match(/\b(0?\d|1\d|2[0-3]):[0-5]\d\b(?=[^\n]*закрит|[^\n]*до)/i)?.[0] ?? null;
  return {
    is24h,
    bookingRequired,
    seasonal,
    winterFishing,
    nightFishing,
    openTime,
    closeTime,
    note: firstMatch(text.split("\n"), [/цілодобово/i, /без вихідних/i, /нічн/i, /брон/i]),
  };
}

function guessFish(text: string) {
  const found = FISH_KEYWORDS.filter((item) => item.patterns.some((pattern) => pattern.test(text))).map((item) => item.name);
  return Array.from(new Set(found));
}

function guessAmenities(text: string) {
  return AMENITY_KEYWORDS.filter((item) => item.patterns.some((pattern) => pattern.test(text))).map((item) => ({
    key: item.key,
    label: item.label,
    available: true,
    note: null,
  }));
}

function guessRules(text: string) {
  const lines = text.split("\n");
  return {
    booking_required: { value: /брон/i.test(text) ? true : null, note: null },
    own_boat_allowed: { value: /власн(ий|і)\s+човн/i.test(text) ? true : null, note: null },
    bait_boat_allowed: { value: /кораблик|bait boat/i.test(text) ? true : null, note: null },
    fire_allowed: { value: /мангал/i.test(text) ? true : null, note: null },
    swimming_allowed: { value: /купан/i.test(text) ? false : null, note: null },
    night_entry_allowed: { value: /нічн/i.test(text) ? true : null, note: null },
    noise_limited: { value: /тишын|тишин|шум/i.test(text) ? true : null, note: null },
    landing_net_required: { value: /підсак/i.test(text) ? true : null, note: null },
    carp_mat_required: { value: /мат/i.test(text) ? true : null, note: null },
    keepnet_required: { value: /садок/i.test(text) ? true : null, note: null },
    notes: lines.slice(0, 6).join(" "),
  };
}

function guessPrices(text: string) {
  const lines = text
    .split("\n")
    .filter((line) => /грн|₴|доба|ніч|півдн|день|погодин|год/i.test(line));
  return lines.slice(0, 12).join("\n") || null;
}

function guessQuota(text: string) {
  return text.split("\n").find((line) => /норм|кг|відпуск/i.test(line)) ?? null;
}

function guessServices(text: string) {
  const values = [
    /альтанк/i.test(text) ? "Альтанки" : null,
    /мангал/i.test(text) ? "Мангал" : null,
    /освітл/i.test(text) ? "Освітлення" : null,
    /підтримк/i.test(text) ? "Цілодобова підтримка" : null,
  ].filter(Boolean);
  return Array.from(new Set(values)).join("\n") || null;
}

function guessDescription(text: string, title: string | null) {
  const candidate = text.split("\n").find((line) => line.length > 60 && !/^(про нас|контакти|ціни|графік роботи|соцмережі)$/i.test(line));
  if (candidate) return candidate;
  return title ? `Інформація з сайту ${title}` : null;
}

function buildStructured(text: string) {
  const fish = guessFish(text);
  const structuredFish = Object.fromEntries(fish.map((name) => [name, { present: true, trophy: false, releaseFromKg: null }]));
  const amenities = Object.fromEntries(guessAmenities(text).map((item) => [item.key, { label: item.label, available: item.available, note: item.note }]));
  return {
    version: 1,
    fish: structuredFish,
    pricing: {},
    catchQuota: {
      note: guessQuota(text),
      totalKg: null,
      peacefulKg: null,
      predatorKg: null,
      overLimitPriceUah: null,
      trophyReleaseFromKg: null,
      catchAndRelease: /спіймав-відпусти|catch\s*&\s*release/i.test(text) ? true : null,
    },
    schedule: guessSchedule(text),
    stocking: {
      status: /зарибл/i.test(text) ? true : null,
      frequency: /регуляр/i.test(text) ? "regular" : null,
      lastDate: null,
      lastSpecies: [],
      lastAmount: null,
      note: firstMatch(text.split("\n"), [/зарибл/i]),
    },
    rules: guessRules(text),
    amenities,
    verified: {
      source: "website",
      lastVerifiedAt: null,
      completion: {
        basic: true,
        fish: fish.length > 0,
        pricing: false,
        quota: /норм|кг/i.test(text),
        schedule: true,
        stocking: /зарибл/i.test(text),
        rules: true,
        photos: false,
        called: false,
      },
      internalNote: null,
    },
  };
}

type CrawledPage = {
  url: string;
  title: string | null;
  html: string;
  text: string;
  lines: string[];
  rendered: boolean;
};

const TAB_LABELS = [
  "Риболовля",
  "Альтанки",
  "Додаткові послуги",
  "Послуги",
  "Інфраструктура",
  "Ціни",
  "Опис",
  "Фото",
  "Галерея",
  "Контакти",
  "Про нас",
];

const TAB_BLACKLIST = new Set([
  "Головна",
  "Трофеї",
  "Як доїхати",
  "Навігатор",
  "Завантажити",
  "Зберегти",
  "Скасувати",
  "Закрити",
  "Детальніше",
]);

function cleanPlainText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index, arr) => arr.indexOf(line) === index);
}

async function collectBrowserText(page: Page) {
  const snapshots = new Set<string>();
  const capture = async () => {
    const text = await page.locator("body").innerText({ timeout: 4000 }).catch(() => "");
    const normalized = cleanPlainText(text).join("\n");
    if (normalized) snapshots.add(normalized);
  };

  await capture();

  const buttons = page.locator("button, [role='tab']");
  const count = await buttons.count().catch(() => 0);
  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i);
    const label = (await button.innerText().catch(() => "")).trim();
    if (!label || label.length > 40 || TAB_BLACKLIST.has(label) || !TAB_LABELS.includes(label)) continue;
    if (!(await button.isVisible().catch(() => false))) continue;
    await button.click({ timeout: 4000, force: true }).catch(() => {});
    await page.waitForTimeout(450).catch(() => {});
    await capture();
  }

  return Array.from(snapshots);
}

async function fetchPageWithBrowser(browser: Browser, url: URL, timeoutMs = 25000): Promise<CrawledPage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
    userAgent: "Mozilla/5.0 (OZERA Admin)",
  });
  try {
    await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 12000) }).catch(() => {});
    await page.evaluate(() => {
      document.querySelectorAll("details").forEach((node) => {
        (node as HTMLDetailsElement).open = true;
      });
    }).catch(() => {});
    await page.waitForTimeout(1200).catch(() => {});
    const html = await page.content();
    const renderedSnapshots = await collectBrowserText(page);
    const lines = dedupeStrings([
      ...cleanText(html),
      ...renderedSnapshots.flatMap((snapshot) => cleanPlainText(snapshot)),
    ]);
    return {
      url: url.toString(),
      title: extractTitle(html),
      html,
      text: lines.join("\n"),
      lines,
      rendered: true,
    };
  } catch {
    return null;
  } finally {
    await page.close().catch(() => {});
    clearTimeout(timeout);
  }
}

async function launchBrowser() {
  const executablePath = await chromium.executablePath();
  return playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
}

async function fetchPage(url: URL, browser: Browser | null, timeoutMs = 20000): Promise<CrawledPage | null> {
  if (browser) {
    const rendered = await fetchPageWithBrowser(browser, url, timeoutMs);
    if (rendered) return rendered;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (OZERA Admin)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const lines = cleanText(html);
    return {
      url: url.toString(),
      title: extractTitle(html),
      html,
      text: lines.join("\n"),
      lines,
      rendered: false,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function crawlSite(startUrl: URL, hint: string | null, maxPages = 8) {
  const start = normalizeUrl(startUrl.toString());
  const queue = [start.toString(), ...getPresetUrls(start, hint)];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser().catch(() => null);

    while (queue.length && pages.length < maxPages) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      let url: URL;
      try {
        url = normalizeUrl(current);
      } catch {
        continue;
      }
      if (!isSameOrigin(url, start) || isPrivateHost(url.hostname)) continue;

      const page = await fetchPage(url, browser);
      if (!page) continue;
      pages.push(page);

      const links = extractLinks(page.html, url)
        .filter((candidate) => !visited.has(candidate))
        .sort((a, b) => linkScore(normalizeUrl(b)) - linkScore(normalizeUrl(a)));
      for (const link of links) {
        if (queue.length >= maxPages * 3) break;
        queue.push(link);
      }
    }
  } finally {
    await browser?.close().catch(() => {});
  }

  return pages;
}

export async function POST(request: Request) {
  let body: { url?: string; lake_name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return jsonReply({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) return jsonReply({ ok: false, error: "URL is required" }, 400);

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return jsonReply({ ok: false, error: "Invalid URL" }, 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return jsonReply({ ok: false, error: "Only http/https URLs are allowed" }, 400);
  }
  if (isPrivateHost(parsed.hostname)) {
    return jsonReply({ ok: false, error: "Private or localhost URLs are not allowed" }, 400);
  }

  try {
    const lakeHint = body.lake_name?.trim() ?? null;
    const pages = await crawlSite(parsed, lakeHint, 16);
    if (pages.length === 0) {
      return jsonReply({ ok: false, error: "Не вдалося прочитати сторінки сайту" }, 502);
    }

    const siteText = pages.map((page) => [page.title, page.text].filter(Boolean).join("\n")).join("\n\n");
    const primaryPage = selectBestPage(pages, lakeHint) ?? pages[0];
    const primaryText = [primaryPage?.title, primaryPage?.text].filter(Boolean).join("\n");
    const allLines = pages.flatMap((page) => page.lines);
    const phoneList = dedupeStrings(pages.flatMap((page) => collectPhones(page.text)));
    const city = guessCity(siteText) || guessCity(allLines.join("\n"));
    const location = guessLocation(siteText) || guessLocation(allLines.join("\n"));
    const coordinates = guessCoordinates(siteText) || guessCoordinates(allLines.join("\n"));
    const schedule = guessSchedule(primaryText || siteText);
    const title = pages.find((page) => page.title)?.title ?? extractTitle(pages[0].html);
    const metaDescription = pages.map((page) => extractMeta(page.html, "description")).find((value) => Boolean(value)) ?? null;
    const description = metaDescription || guessDescription(primaryText || siteText, title);
    const fish = guessFish(primaryText || siteText);
    const amenities = guessAmenities(primaryText || siteText);
    const structured = buildStructured(primaryText || siteText);
    const images = dedupeStrings(
      pages.flatMap((page) => {
        const imgRegex = /<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
        const found: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = imgRegex.exec(page.html))) {
          try {
            const resolved = normalizeUrl(new URL(match[1], page.url).toString());
            if (isSameOrigin(resolved, parsed)) found.push(resolved.toString());
          } catch {
            // ignore invalid URLs
          }
        }
        return found;
      }),
    );
    const serviceLines = dedupeStrings(
      pages.flatMap((page) => page.lines.filter((line) => /альтанк|мангал|освітл|підтримк|кафе|наживк|човн|душ|туалет|парковк|wi-?fi|розетк/i.test(line))),
    );
    const quotaLine = [primaryText, siteText].map((text) => guessQuota(text)).find((value) => Boolean(value)) ?? null;
    const priceText = [primaryText, siteText].map((text) => guessPrices(text)).find((value) => Boolean(value)) ?? null;
    const rulesText =
      [primaryPage?.lines ?? [], ...pages.map((page) => page.lines)]
        .map((lines) => firstMatch(lines, [/принцип/i, /правил/i, /спіймав-відпусти/i, /екологіч/i, /тишын/i, /тишин/i]))
        .find((value) => Boolean(value)) ?? null;
    const stockingText =
      [primaryText, siteText]
        .map((text) => text.split("\n").find((line) => /зарибл/i.test(line)) ?? null)
        .find((value) => Boolean(value)) ?? null;

    const data = {
      name: body.lake_name?.trim() || title || null,
      description,
      city,
      location_text: location || city,
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lng ?? null,
      area_ha: null,
      max_depth_m: null,
      image_url: images[0] ?? null,
      location_google_url: coordinates ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : null,
      location_waze_url: coordinates ? `https://waze.com/ul?ll=${coordinates.lat},${coordinates.lng}&navigate=yes` : null,
      work_schedule_summary: schedule.note ?? null,
      base_open_time: schedule.openTime,
      base_close_time: schedule.closeTime,
      price_details_text: priceText,
      catch_quota_text: quotaLine,
      additional_services_text: serviceLines.length ? serviceLines.join("\n") : guessServices(siteText),
      lake_rules_text: rulesText,
      stocking_text: stockingText,
      fish_species: fish,
      amenities,
      contacts: { phone: phoneList, email: null },
      structured,
      sources: pages.map((page) => page.url),
      _meta: {
        source: "url",
        lineCount: allLines.length,
        pagesCrawled: pages.length,
        renderedPages: pages.filter((page) => page.rendered).length,
      },
    };

    return jsonReply({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to crawl site";
    return jsonReply({ ok: false, error: message }, 500);
  }
}
