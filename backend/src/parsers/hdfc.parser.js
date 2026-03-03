const AMOUNT_REGEX = /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i;

const DEBIT_REGEX = /(has been debited|is debited|debited)/i;
const CREDIT_REGEX = /(has been credited|credited)/i;

const VPA_REGEX = /to\s+VPA\s+[^\s]+\s+(.+?)\s+on/i;
const TO_REGEX = /to\s+(.+?)\s+on/i;
const AT_REGEX = /at\s+(.+?)\s+on/i;

const DATE_REGEX = /on\s+(\d{2}-\d{2}-\d{2,4})/i;

function normalizeDate(rawDate) {
  if (!rawDate) return null;

  const parts = rawDate.split("-");
  if (parts[2].length === 2) {
    return new Date(`20${parts[2]}-${parts[1]}-${parts[0]}`);
  }

  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
}

function detectCategory(merchant) {
  if (!merchant) return "UNCATEGORIZED";

  const m = merchant.toLowerCase();

  if (m.includes("zomato") || m.includes("swiggy")) return "FOOD";
  if (m.includes("uber") || m.includes("ola") || m.includes("irctc") || m.includes("redbus")) return "TRAVEL";
  if (m.includes("amazon") || m.includes("flipkart") || m.includes("myntra")) return "SHOPPING";
  if (m.includes("netflix") || m.includes("spotify") || m.includes("prime")) return "SUBSCRIPTION";
  if (m.includes("zepto") || m.includes("blinkit")) return "GROCERIES";

  return "UNCATEGORIZED";
}

function extractMerchant(text) {
  let match;

  match = text.match(VPA_REGEX);
  if (match) return match[1].trim();

  match = text.match(TO_REGEX);
  if (match) return match[1].trim();

  match = text.match(AT_REGEX);
  if (match) return match[1].trim();

  return null;
}

export function parseHdfcEmail(emailBody) {
  if (!emailBody) return [];

  const cleanText = emailBody
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const amountMatch = cleanText.match(AMOUNT_REGEX);
  if (!amountMatch) return [];

  const amount = Number(amountMatch[1].replace(/,/g, ""));
  if (!amount) return [];

  let type = null;

  if (DEBIT_REGEX.test(cleanText)) type = "EXPENSE";
  else if (CREDIT_REGEX.test(cleanText)) type = "INCOME";

  if (!type) return [];

  const merchant = extractMerchant(cleanText);
  const category = detectCategory(merchant);

  let date = null;
  const dateMatch = cleanText.match(DATE_REGEX);
  if (dateMatch) {
    date = normalizeDate(dateMatch[1]);
  }

  return [
    {
      amount,
      type,
      category,
      merchant,
      date
    }
  ];
}