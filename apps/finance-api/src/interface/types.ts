
// Define interfaces for the data types
export interface Deposit {
  amount: number;
  date: string;
  payer: string;
  comment: string;
}

export interface Item {
  description: string;
  group: string;
  units: number;
  unitPrice: number;
  area: number;
  areaPrice: number;
  comment: string;
}

export interface Balance {
  amount: number;
  date: string;
  description: string;
  account: string;
}

export interface Contract {
  name: string;
  creditor: string;
  amount: number;
  shared: boolean;
  months: boolean[];
}

export interface Order {
  amount: number;
  date: string;
  description: string;
  type: string;
  account: string;
}

export interface Transfer {
  amount: number;
  description: string;
}

export interface FakeInvoice {
  description: string;
  creditor: string;
  amount: number;
  date: string;
}

export interface Account {
  name: string;
}

export interface Expense {
  description: string;
  category: string;
  creditor: string;
  amount: number;
  account: string;
  date: string;
  invoice: string;
  payer: string;
  item: string;
}

export interface Stock {
  symbol: string;
  name: string;
  purchase: number;
  quantity: number;
  value: number;
}
