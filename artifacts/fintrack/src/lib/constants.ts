export const CATEGORIES = {
  Expense: [
    "Housing",
    "Food & Dining",
    "Transportation",
    "Utilities",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Education",
    "Personal Care",
    "EMI/Loan",
    "Subscriptions",
    "Miscellaneous",
  ],
  Income: [
    "Salary",
    "Freelance",
    "Bonus",
    "Interest",
    "Dividend",
    "Other Income",
  ],
  Investment: [
    "Mutual Fund",
    "Stocks",
    "FD/RD",
    "PPF/EPF",
    "Gold",
    "Real Estate",
    "Crypto",
    "Other Investment",
  ],
  Saving: ["Emergency Fund", "General Savings"],
} as const;

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};
