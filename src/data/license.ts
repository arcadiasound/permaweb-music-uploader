export const udl = {
  type: ["public-use", "attribution", "allowed", "noncommercial"] as const,
  derivationOpts: [
    "with-credit",
    "with-indication",
    "with-passthrough",
    "with-revenue-share",
  ] as const,
  commercialOpts: ["with-credit", "with-fee"] as const,
  feeRecurrenceOpts: ["one-time", "monthly"] as const,
  currencyOpts: ["AR", "U"] as const,
  paymentModeOpts: ["global", "random"] as const,
};

export type UDLValues = typeof udl;
