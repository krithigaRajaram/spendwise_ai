import prisma from "../config/prisma.js";

export const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, merchant, date } = req.body;

    if (!amount || !type || !category) {
      return res.status(400).json({ message: "Amount, type and category are required" });
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: Number(amount),
        type,
        category,
        merchant: merchant ? merchant.trim() : "Manual Entry",
        date: date ? new Date(date) : new Date(),
        userId: req.userId,
        source: "MANUAL"
      }
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create transaction" });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { month, year } = req.query;
    let dateFilter = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = { date: { gte: startDate, lte: endDate } };
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId, ...dateFilter },
      orderBy: { date: "desc" }
    });

    // Apply merchantOverride from MerchantCategory mapping for display
    const mappings = await prisma.merchantCategory.findMany({
      where: { userId: req.userId }
    });

    const mappingMap = {};
    for (const m of mappings) {
      mappingMap[m.merchantKeyword] = m;
    }

    const enriched = transactions.map((tx) => {
      const mapping = tx.merchant ? mappingMap[tx.merchant] : null;
      return {
        ...tx,
        merchantDisplay: mapping?.merchantOverride || tx.merchant
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

export const getSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;
    let dateFilter = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = { date: { gte: startDate, lte: endDate } };
    }

    const income = await prisma.transaction.aggregate({
      where: { userId, type: "INCOME", ...dateFilter },
      _sum: { amount: true }
    });

    const expense = await prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", ...dateFilter },
      _sum: { amount: true }
    });

    res.json({
      totalIncome: income._sum.amount || 0,
      totalExpense: expense._sum.amount || 0,
      netBalance: (income._sum.amount || 0) - (expense._sum.amount || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};

// PUT /transactions/:id — single transaction update (category or merchant)
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, type, category, merchant, date } = req.body;

    const existingTx = await prisma.transaction.findFirst({
      where: { id: Number(id), userId }
    });

    if (!existingTx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        amount: amount ? Number(amount) : existingTx.amount,
        type: type || existingTx.type,
        category: category || existingTx.category,
        merchant: merchant !== undefined ? merchant : existingTx.merchant,
        date: date ? new Date(date) : existingTx.date
      }
    });

    res.json({ message: "Transaction updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update transaction" });
  }
};

// PUT /transactions/bulk-categorize
export const bulkCategorize = async (req, res) => {
  try {
    const userId = req.userId;
    const { merchant, category } = req.body;

    if (!merchant || !category) {
      return res.status(400).json({ message: "Merchant and category are required" });
    }

    await prisma.transaction.updateMany({
      where: { userId, merchant },
      data: { category }
    });

    await prisma.merchantCategory.upsert({
      where: { userId_merchantKeyword: { userId, merchantKeyword: merchant } },
      update: { category },
      create: { userId, merchantKeyword: merchant, category }
    });

    res.json({ message: "Category updated for all transactions from merchant" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to bulk update category" });
  }
};

// PUT /transactions/merchant-mapping — apply merchant override to all transactions from original merchant
export const merchantMapping = async (req, res) => {
  try {
    const userId = req.userId;
    const { merchant, merchantOverride } = req.body;

    if (!merchant || !merchantOverride) {
      return res.status(400).json({ message: "Merchant and merchantOverride are required" });
    }

    await prisma.merchantCategory.upsert({
      where: { userId_merchantKeyword: { userId, merchantKeyword: merchant } },
      update: { merchantOverride },
      create: { userId, merchantKeyword: merchant, category: "UNCATEGORIZED", merchantOverride }
    });

    res.json({ message: "Merchant override saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update merchant mapping" });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const deleted = await prisma.transaction.deleteMany({
      where: { id: Number(id), userId }
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
    const mappings = await prisma.merchantCategory.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(mappings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch mappings" });
  }
};