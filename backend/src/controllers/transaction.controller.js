import prisma from "../config/prisma.js";

//POST /transactions
export const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, description } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        category,
        merchant,
        description,
        userId: req.userId, // comes from JWT middleware
      },
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create transaction" });
  }
};


//GET /transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

//GET /transactions/summary?month=9&year=2024
export const getSummary = async (req, res) => {
  try {
    const userId = req.userId;

    const { month, year } = req.query;

    let dateFilter = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    const income = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "INCOME",
        ...dateFilter
      },
      _sum: { amount: true }
    });

    const expense = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        ...dateFilter
      },
      _sum: { amount: true }
    });

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;

    res.json({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};

// Update transaction (category)
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { amount, type, category, description, date } = req.body;

    const existingTx = await prisma.transaction.findFirst({
      where: {
        id: Number(id),
        userId
      }
    });

    if (!existingTx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        amount,
        type,
        category,
        description,
        date
      }
    });

    //merchant - category mapping
    if (category && existingTx.merchant) {
      await prisma.merchantCategory.upsert({
        where: {
          userId_merchantKeyword: {
            userId,
            merchantKeyword: existingTx.merchant.toLowerCase()
          }
        },
        update: {
          category
        },
        create: {
          userId,
          merchantKeyword: existingTx.merchant.toLowerCase(),
          category
        }
      });
    }

    res.json({ message: "Transaction updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update transaction" });
  }
};


export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const deleted = await prisma.transaction.deleteMany({
      where: {
        id: Number(id),
        userId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};


export const getMerchantCategories = async (req, res) => {
  try {
    const userId = req.userId;

    const mappings = await prisma.merchantCategory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(mappings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch mappings" });
  }
};