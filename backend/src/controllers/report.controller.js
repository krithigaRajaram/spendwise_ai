import prisma from "../config/prisma.js";

export const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year, from, to } = req.query;

    let dateFilter = {};
    let periodLabel = {};

    if (from || to) {
      dateFilter = {
        date: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(new Date(to).setHours(23, 59, 59)) })
        }
      };
      periodLabel = { from, to };
    } else if (month && year) {
      const monthNumber = Number(month);
      const yearNumber = Number(year);

      if (isNaN(monthNumber) || isNaN(yearNumber) || monthNumber < 1 || monthNumber > 12) {
        return res.status(400).json({ message: "Invalid month or year" });
      }

      const startDate = new Date(yearNumber, monthNumber - 1, 1);
      const endDate = new Date(yearNumber, monthNumber, 1);
      dateFilter = { date: { gte: startDate, lt: endDate } };
      periodLabel = { month: monthNumber, year: yearNumber };
    } else {
      return res.status(400).json({ message: "Either month/year or from/to is required" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId, ...dateFilter }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory = {};

    for (const tx of transactions) {
      if (tx.type === "INCOME") totalIncome += tx.amount;
      if (tx.type === "EXPENSE") {
        totalExpense += tx.amount;
        expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
      }
    }

    return res.json({
      ...periodLabel,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      expenseByCategory,
      transactionCount: transactions.length
    });
  } catch (err) {
    console.error("Report Error:", err);
    return res.status(500).json({ message: "Failed to generate report" });
  }
};