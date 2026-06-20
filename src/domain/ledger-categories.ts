export const T776_CATEGORIES = [
  "advertising",
  "insurance",
  "interest_and_bank_charges",
  "office_expenses",
  "professional_fees",
  "repairs_and_maintenance",
  "salaries_wages_and_benefits",
  "property_taxes",
  "travel",
  "utilities",
  "other_expenses",
] as const;
export type T776Category = (typeof T776_CATEGORIES)[number];

export const RENTAL_INCOME_CATEGORIES = [
  "rent",
  "other_income",
  "laundry",
  "parking",
  "fees",
  "recoveries",
] as const;
export type RentalIncomeCategory = (typeof RENTAL_INCOME_CATEGORIES)[number];
