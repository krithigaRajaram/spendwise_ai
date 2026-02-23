export function detectBankEmail(fullMessage) {
  const headers = fullMessage.payload?.headers || [];

  const subject = headers.find(h => h.name.toLowerCase() === "subject")?.value?.toLowerCase() || "";
  const from = headers.find(h => h.name.toLowerCase() === "from")?.value?.toLowerCase() || "";

  const hdfcIndicators = ["hdfc", "alerts@hdfcbank.net"];
  const transactionKeywords = ["debit", "credit", "transaction", "payment", "withdrawal", "credited", "debited"];
  const isFromHdfc = hdfcIndicators.some(indicator => from.includes(indicator));
  const isTransaction = transactionKeywords.some(keyword => subject.includes(keyword));

  if (isFromHdfc || isTransaction) {
    return { isBankCandidate: true, bankName: "HDFC" };
  }

  return { isBankCandidate: false, bankName: null };
}