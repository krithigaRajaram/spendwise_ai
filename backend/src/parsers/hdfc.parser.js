const AMOUNT_REGEX = /(Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi;

const DEBIT_REGEX =
  /(debited|spent|purchase|withdrawal|atm withdrawal|cash withdrawal)/i;

const CREDIT_REGEX =
  /(credited|received|refund)/i;

const ATM_REGEX =
  /(atm withdrawal|cash withdrawal)/i;

const DATE_TIME_REGEX =
  /on\s(\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2})/i;

const DATE_ONLY_REGEX =
  /on\s(\d{2}-\d{2}-\d{2,4})/i;


function extractMerchant(snippet) {

  // UPI pattern: VPA merchant@bank NAME on DD-MM-YY
  const vpaMatch = snippet.match(
    /VPA\s([A-Za-z0-9@.\- ]+?)\s+on\s/i
  );
  if (vpaMatch) {
    return cleanMerchant(vpaMatch[1]);
  }

  // Pattern: to MERCHANT on
  const toMatch = snippet.match(
    /to\s([A-Za-z0-9@&.\- ]+?)\s+on\s/i
  );
  if (toMatch) {
    return cleanMerchant(toMatch[1]);
  }

  // Pattern: at MERCHANT on
  const atMatch = snippet.match(
    /at\s([A-Za-z0-9@&.\- ]+?)\s+on\s/i
  );
  if (atMatch) {
    return cleanMerchant(atMatch[1]);
  }

  return null;
}

function cleanMerchant(raw) {
  if (!raw) return null;

  return raw
    .replace(/VPA/i, "")
    .replace(/\s+/g, " ")
    .trim();
}



function detectCategory(merchant, snippet) {

  // ATM override
  if (ATM_REGEX.test(snippet)) {
    return "ATM";
  }

  if (!merchant) return "UNCATEGORIZED";

  const m = merchant.toLowerCase();

  if (m.includes("zomato") || m.includes("swiggy")) {
    return "FOOD";
  }

  if (m.includes("redbus") || m.includes("irctc") || m.includes("uber")) {
    return "TRAVEL";
  }

  if (
    m.includes("netflix") ||
    m.includes("prime") ||
    m.includes("zee5") ||
    m.includes("spotify")
  ) {
    return "SUBSCRIPTION";
  }

  if (
    m.includes("amazon") ||
    m.includes("flipkart") ||
    m.includes("myntra")
  ) {
    return "SHOPPING";
  }

  return "UNCATEGORIZED";
}


export function parseHdfcEmail(emailBody) {
  if (!emailBody) return [];

  const cleanText = emailBody
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  const transactions = [];
  let match;

  while ((match = AMOUNT_REGEX.exec(cleanText)) !== null) {

    const amount = Number(match[2].replace(/,/g, ""));
    if (!amount) continue;

    const snippet = cleanText.slice(
      Math.max(0, match.index - 200),
      match.index + 200
    );

    let type = null;

    if (CREDIT_REGEX.test(snippet)) {
      type = "INCOME";
    } else if (DEBIT_REGEX.test(snippet)) {
      type = "EXPENSE";
    }

    if (!type) continue;

    // Extract merchant
    const merchant = extractMerchant(snippet);

    //Detect category
    const category = detectCategory(merchant, snippet);

    //Extract date
    let date = null;

    const dateTimeMatch = DATE_TIME_REGEX.exec(snippet);
    if (dateTimeMatch) {
      date = new Date(
        dateTimeMatch[1].replace(
          /(\d{2})-(\d{2})-(\d{4})/,
          "$3-$2-$1"
        )
      );
    } else {
      const dateOnlyMatch = DATE_ONLY_REGEX.exec(snippet);
      if (dateOnlyMatch) {
        const raw = dateOnlyMatch[1];
        const normalized =
          raw.length === 8
            ? raw.replace(/(\d{2})-(\d{2})-(\d{2})/, "20$3-$2-$1")
            : raw.replace(/(\d{2})-(\d{2})-(\d{4})/, "$3-$2-$1");
        date = new Date(normalized);
      }
    }

    transactions.push({
      amount,
      type,
      category,
      merchant,
      date
    });
  }

  return transactions;
}