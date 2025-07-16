# Finance API Database Specification

## Overview
This document specifies the structure of the financial data elements from the database dump and outlines how they should be migrated to MongoDB. The specification includes data types, relationships, and schema design.

## Original Data Structure
The database dump contains the following sections, each with a specific structure:

1. **deposits** - Financial deposits
2. **items** - Budget items or categories
3. **balances** - Account balance snapshots
4. **contracts** - Recurring payment contracts
5. **orders** - Investment orders
6. **transfers** - Money transfers
7. **fake-invoices** - Simulated invoices for testing
8. **accounts** - Financial accounts
9. **expenses** - Expense transactions
10. **stocks** - Stock investments

Each section follows the format:
```
sectionName:timestamp
    uuid: {json object with section-specific properties}
```

## Data Types

### Deposits
```typescript
interface Deposit {
  amount: number;
  date: string; // ISO date format
  payer: string;
  comment: string;
}
```

### Items
```typescript
interface Item {
  description: string;
  group: string;
  units: number;
  unitPrice: number;
  area: number;
  areaPrice: number;
  comment: string;
}
```

### Balances
```typescript
interface Balance {
  amount: number;
  date: string; // ISO date format
  description: string;
  account: string; // UUID reference to an account
}
```

### Contracts
```typescript
interface Contract {
  name: string;
  creditor: string;
  amount: number;
  shared: boolean;
  months: boolean[]; // Array of 12 booleans representing months when payment is due
}
```

### Orders
```typescript
interface Order {
  amount: number;
  date: string; // ISO date format
  description: string;
  type: string; // "purchase", "sale", "dividend", "savings_plan", "other"
  account: string; // UUID reference to an account
}
```

### Transfers
```typescript
interface Transfer {
  amount: number;
  description: string;
}
```

### Fake Invoices
```typescript
interface FakeInvoice {
  description: string;
  creditor: string;
  amount: number;
  date: string; // ISO date format
}
```

### Accounts
```typescript
interface Account {
  name: string;
}
```

### Expenses
```typescript
interface Expense {
  description: string;
  category: string;
  creditor: string;
  amount: number;
  account: string; // Account name, not UUID
  date: string; // ISO date format
  invoice: string; // "yes" or "no"
  payer: string;
  item: string; // Reference to an item
}
```

### Stocks
```typescript
interface Stock {
  symbol: string;
  name: string;
  purchase: number;
  quantity: number;
  value: number;
}
```

## MongoDB Schema Design

### Collections
The data will be organized into the following MongoDB collections:

1. **accounts** - Financial accounts
2. **transactions** - All financial transactions (deposits, expenses, orders)
3. **items** - Budget items or categories
4. **contracts** - Recurring payment contracts
5. **balances** - Account balance snapshots
6. **stocks** - Stock investments

### Schema Definitions

#### Accounts Collection
```javascript
{
  _id: ObjectId,
  uuid: String,
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Transactions Collection
```javascript
{
  _id: ObjectId,
  uuid: String,
  type: String, // "deposit", "expense", "order", "transfer"
  amount: Number,
  date: Date,
  description: String,
  account: {
    uuid: String,
    name: String
  },
  payer: String, // For deposits and expenses
  creditor: String, // For expenses
  category: String, // For expenses
  invoice: Boolean, // For expenses
  item: String, // For expenses
  orderType: String, // For orders: "purchase", "sale", "dividend", "savings_plan", "other"
  createdAt: Date,
  updatedAt: Date
}
```

#### Items Collection
```javascript
{
  _id: ObjectId,
  uuid: String,
  description: String,
  group: String,
  units: Number,
  unitPrice: Number,
  area: Number,
  areaPrice: Number,
  comment: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Contracts Collection
```javascript
{
  _id: ObjectId,
  uuid: String,
  name: String,
  creditor: String,
  amount: Number,
  shared: Boolean,
  months: [Boolean], // Array of 12 booleans
  createdAt: Date,
  updatedAt: Date
}
```

#### Balances Collection
```javascript
{
  _id: ObjectId,
  uuid: String,
  amount: Number,
  date: Date,
  description: String,
  account: {
    uuid: String,
    name: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Stocks Collection
```javascript
{
  _id: ObjectId,
  uuid: String,
  symbol: String,
  name: String,
  purchase: Number,
  quantity: Number,
  value: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Data Relationships
- Transactions reference accounts by UUID
- Expenses reference items by name
- Balances reference accounts by UUID

## Indexes
The following indexes should be created to optimize query performance:

1. **accounts**: `uuid` (unique)
2. **transactions**: `uuid` (unique), `type`, `date`, `account.uuid`
3. **items**: `uuid` (unique), `group`
4. **contracts**: `uuid` (unique)
5. **balances**: `uuid` (unique), `date`, `account.uuid`
6. **stocks**: `uuid` (unique), `symbol`

## Data Migration Strategy
1. Parse the database dump file section by section
2. Convert each entry to the appropriate MongoDB document format
3. Insert the documents into their respective collections
4. Create the necessary indexes
5. Validate the data integrity after migration