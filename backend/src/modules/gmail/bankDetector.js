export function detectBankEmail(fullMessage) {
  const headers = fullMessage.payload?.headers || [];

  const from = headers.find(h => h.name.toLowerCase() === "from")?.value?.toLowerCase() || "";

  const hdfcIndicators = ["alerts@hdfcbank.net", "alerts@hdfcbank.bank.in", "hdfcbank.com"];

  const isFromHdfc = hdfcIndicators.some(indicator => from.includes(indicator));

  if (isFromHdfc) {
    return { isBankCandidate: true, bankName: "HDFC" };
  }

  return { isBankCandidate: false, bankName: null };
}