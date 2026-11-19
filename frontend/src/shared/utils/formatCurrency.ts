export const formatCurrency = (amount: number): string => {
  const num = Number(amount) || 0;
  return `${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ETB`;
};

export const formatCurrencyWhole = (amount: number): string => {
  const num = Math.round(Number(amount) || 0);
  return `${num.toLocaleString("en-US")} ETB`;
};