const HF_API_URL = "https://models.inference.ai.azure.com/chat/completions";

export async function parseWithAI(emailText) {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a financial data extractor for Indian bank transaction alert emails.

          Extract transaction details and return ONLY a valid JSON object:

          {
            "amount": <transaction amount as number with decimals>,
            "type": <"EXPENSE" or "INCOME">,
            "merchant": <clean short merchant name, max 3 words>,
            "category": <category from rules below>,
            "date": <"DD-MM-YY" or null>
          }

          Amount rules:
          - Look for patterns like "Rs.299.00", "Rs. 108.57", "INR 299.00", "INR 1,000.00"
          - Preserve decimals exactly. "Rs.299.00" = 299.00, "INR 1,000.00" = 1000.00
          - Do NOT extract card numbers, phone numbers, reference numbers, or balance amounts

          Type rules:
          - "debited", "deducted", "paid", "debited from" = EXPENSE
          - "credited", "received", "refund", "credited to" = INCOME

          Merchant rules:
          - Extract ONLY the shortest recognizable name — never more than 3 words
          - NEVER include "your account", "by vpa", "on account of", account numbers, balance info, or UPI reference numbers
          - For UPI credits (INCOME): pattern is "credited...by VPA <upi-id> <Name>" — extract ONLY the Name after the UPI ID
            - "by vpa akshayerode@okicici s akshay" → "Akshay"
            - "by vpa 7639584466@axl dhivya bharathi r" → "Dhivya Bharathi"
            - "by vpa 8870864882@pthdfc thusneem banu a" → "Thusneem Banu"
            - Ignore trailing single letters after the name
          - For UPI debits (EXPENSE): pattern is "To:<upi-id>" — extract name from UPI ID if recognizable
            - "To:akshayerode@okicici" → "Akshay"
            - "To:zomato@icici" → "Zomato"
            - "To:q116634843@ybl" → "q116634843@ybl" (keep full UPI ID if no recognizable name)
            - "To:7708891810@pthdfc" → "7708891810@pthdfc" (keep if only numbers)
          - For brand/merchant payments: extract shortest recognizable brand name
            - "ZOMATO TECHNOLOGIES LIMITED" → "Zomato"
            - "YOUTUBEGOOGLE" → "YouTube"
            - "gpayrefund-online@axisbank Google India Digital Services Pvt Ltd" → "Google Pay"
            - "sm bangalore airport road" → "Bangalore Airport"
          - Remove: @domain suffixes, VPA, Ltd, Limited, Technologies, Pvt, Private, bank footer text
          - If UPI refund from Google/PhonePe/Paytm → "Google Pay" / "PhonePe" / "Paytm"

          Category rules:
          - FOOD: Zomato, Swiggy, restaurants, food delivery, cafes
          - TRAVEL: Uber, Ola, RedBus, IRCTC, MakeMyTrip, airlines, cab, bus, train, rapido, airport
          - SHOPPING: Amazon, Flipkart, Myntra, Meesho, Ajio, retail stores
          - SUBSCRIPTION: Netflix, Spotify, Prime, Hotstar, JioCinema, YouTube, Google, Apple, SaaS, e-mandate, auto payment
          - GROCERIES: Zepto, Blinkit, BigBasket, More, Dunzo, Swiggy Instamart
          - INVESTMENT: Zerodha, Groww, Motilal Oswal, PPFAS, mutual fund, SIP, demat, stocks
          - TRANSFER: person names, phone numbers, UPI to individuals, refunds from payment apps
          - UNCATEGORIZED: anything that doesn't fit above

          Important:
          - Focus only on the transaction details, ignore bank footer/disclaimer text
          - The email may contain HTML — ignore all tags and focus on the text content
          - Return ONLY the JSON object, no explanation, no markdown

          Email: "${emailText}"`
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HF API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.amount || !parsed.type) throw new Error("Incomplete AI response");

  return {
    amount: Number(parsed.amount),
    type: parsed.type,
    merchant: parsed.merchant || null,
    category: parsed.category || "UNCATEGORIZED",
    date: parsed.date ? parseDate(parsed.date) : null
  };
}

function parseDate(raw) {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length !== 3) return null;
  const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
  return new Date(`${year}-${parts[1]}-${parts[0]}`);
}