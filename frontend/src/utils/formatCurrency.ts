const cents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const whole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCurrency = (amount: number) => cents.format(amount);
export const formatCurrencyWhole = (amount: number) => whole.format(amount);