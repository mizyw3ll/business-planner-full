const CURRENCY_NAMES: Record<string, string> = {
  RUB: "Рубль",
  USD: "Доллар США",
  EUR: "Евро",
  CNY: "Юань",
  GBP: "Фунт стерлингов",
  JPY: "Японская иена",
  KRW: "Вон",
  TRY: "Турецкая лира",
  KZT: "Казахстанский тенге",
  BYN: "Белорусский рубль",
  UAH: "Гривна",
  INR: "Индийская рупия",
  BRL: "Бразильский реал",
  AUD: "Австралийский доллар",
  CAD: "Канадский доллар",
  CHF: "Швейцарский франк",
  // Crypto
  BTC: "Биткоин",
  ETH: "Эфириум",
  BNB: "Бинанская монета",
  SOL: "Солана",
  TON: "Тон",
  USDT: "Тетер",
  USDC: "ЮСД коин",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
  CNY: "¥",
  GBP: "£",
  JPY: "¥",
  KRW: "₩",
  TRY: "₺",
  KZT: "₸",
  BYN: "Br",
  UAH: "₴",
  INR: "₹",
  BRL: "R$",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  BTC: "₿",
  ETH: "Ξ",
  BNB: "BNB",
  SOL: "SOL",
  TON: "TON",
  USDT: "₮",
  USDC: "USDC",
};

export function getCurrencyRussianName(code: string): string {
  const upper = code.toUpperCase();
  return CURRENCY_NAMES[upper] ?? code;
}

export function getCurrencySymbol(code: string): string {
  const upper = code.toUpperCase();
  return CURRENCY_SYMBOLS[upper] ?? code;
}

export function formatCurrency(amount: number, code: string): string {
  const symbol = getCurrencySymbol(code);
  const formatted = amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  return `${formatted} ${symbol}`;
}

export function formatCurrencyCompact(amount: number, code: string): string {
  const symbol = getCurrencySymbol(code);
  const formatted = amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
  return `${formatted} ${symbol}`;
}

export function currencyOptionLabel(code: string, _name?: string): string {
  const symbol = getCurrencySymbol(code);
  const ruName = getCurrencyRussianName(code);
  return `${symbol} — ${ruName}`;
}
