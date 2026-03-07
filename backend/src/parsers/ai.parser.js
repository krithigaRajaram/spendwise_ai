const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";

export async function parseWithAI(emailText) {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        {
          role: "user",
            content: `You are a financial data extractor for Indian bank emails.

            Extract transaction details and return ONLY a valid JSON object with these exact fields:

            {
            "amount": <number with decimals, e.g. 2.00 not 2000>,
            "type": <"EXPENSE" or "INCOME">,
            "merchant": <clean short name only, see rules>,
            "category": <one of: "FOOD", "TRAVEL", "SHOPPING", "SUBSCRIPTION", "GROCERIES", "TRANSFER", "UNCATEGORIZED">,
            "date": <"DD-MM-YY" or null>
            }

            Rules:
            - "debited" = EXPENSE, "credited" = INCOME
            - Amount: "Rs. 2.00" = 2.00, "Rs. 163.00" = 163.00. Never remove decimal point.
            - merchant: extract shortest recognizable name only. Remove VPA handles, @domain, Ltd, Limited, Technologies, Pvt. Examples: "username@okicici JOHN DOE" → "John Doe", "ZOMATO TECHNOLOGIES LIMITED" → "Zomato", "9876543210@upi" → null
            - If merchant is a person name or phone number, category = TRANSFER
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