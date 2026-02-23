import prisma from "../config/prisma.js";
export const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required"
      });
    }

    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (
      isNaN(monthNumber) ||
      isNaN(yearNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return res.status(400).json({
        message: "Invalid month or year"
      });
    }

    // Define date range
    const startDate = new Date(yearNumber, monthNumber - 1, 1);
    const endDate = new Date(yearNumber, monthNumber, 1);

    // Fetch transactions for that month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory = {};

    for (const tx of transactions) {
      if (tx.type === "INCOME") {
        totalIncome += tx.amount;
      }

      if (tx.type === "EXPENSE") {
        totalExpense += tx.amount;

        if (!expenseByCategory[tx.category]) {
          expenseByCategory[tx.category] = 0;
        }

        expenseByCategory[tx.category] += tx.amount;
      }
    }

    return res.json({
      month: monthNumber,
      year: yearNumber,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      expenseByCategory
    });

  } catch (err) {
    console.error("Monthly Report Error:", err);
    return res.status(500).json({
      message: "Failed to generate monthly report"
    });
  }
};