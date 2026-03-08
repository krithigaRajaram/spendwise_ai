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
            content: `You are a financial data extractor for Indian bank transaction emails.

            Extract transaction details and return ONLY a valid JSON object:

            {
              "amount": <extract the transaction amount as a number with decimals>,
              "type": <"EXPENSE" or "INCOME">,
              "merchant": <clean short name, see rules>,
              "category": <see category rules below>,
              "date": <"DD-MM-YY" or null>
            }

            Amount rules:
            - The transaction amount always appears near "Rs." or "INR" in the email
            - "Rs. 163.00" = 163.00, "Rs. 2.00" = 2.00. Preserve decimals exactly.
            - Do NOT extract unit counts, NAV values, or percentages as the amount

            Type rules:
            - "debited" or "deducted" = EXPENSE
            - "credited" or "received" = INCOME

            Merchant rules:
            - Extract shortest recognizable name only
            - Remove VPA handles, @domain suffixes, Ltd, Limited, Technologies, Pvt, Private
            - "username@okicici JOHN DOE" → "John Doe"
            - "ZOMATO TECHNOLOGIES LIMITED" → "Zomato"

            Category rules (pick the best match):
            - FOOD: Zomato, Swiggy, restaurants, food delivery, cafes
            - TRAVEL: Uber, Ola, RedBus, IRCTC, MakeMyTrip, airlines, cab, bus, train
            - SHOPPING: Amazon, Flipkart, Myntra, Meesho, Ajio, retail stores
            - SUBSCRIPTION: Netflix, Spotify, Prime, Hotstar, JioCinema, YouTube, SaaS
            - GROCERIES: Zepto, Blinkit, BigBasket, More, Dunzo, Swiggy Instamart
            - INVESTMENT: Zerodha, Groww, Motilal Oswal, PPFAS, mutual fund, SIP, demat
            - TRANSFER: person names, phone numbers, UPI to individuals
            - UNCATEGORIZED: anything that doesn't fit above

            Return ONLY the JSON object, no explanation, no markdown.

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