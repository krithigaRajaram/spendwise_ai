export function detectBankEmail(fullMessage) {
  const headers = fullMessage.payload?.headers || [];
  const from = headers.find(h => h.name.toLowerCase() === "from")?.value?.toLowerCase() || "";

  const bankPatterns = [
    { indicators: ["alerts@hdfcbank.net", "alerts@hdfcbank.bank.in", "hdfcbank.com"], bankName: "HDFC" },
    { indicators: ["alerts@yes.bank.in", "yes.bank.in"], bankName: "YES" }
  ];

  for (const bank of bankPatterns) {
    if (bank.indicators.some(indicator => from.includes(indicator))) {
      return { isBankCandidate: true, bankName: bank.bankName };
    }
  }

  return { isBankCandidate: false, bankName: null };
}