import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Account, Transaction, Item, Contract, Balance, Stock } from '../models';
import { Account as AccountType, Balance as BalanceType, Contract as ContractType, Deposit as DepositType, Expense as ExpenseType, Item as ItemType, Order as OrderType, Stock as StockType, Transfer as TransferType } from '../interface/types';

// MongoDB connection URI and database name
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'finance';

// Main converter class
class DataConverter {
  private filePath: string;
  private data: string;
  private accountMap: Map<string, string> = new Map(); // Maps account UUIDs to names

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = fs.readFileSync(this.filePath, 'utf8');
  }

  // Parse the dump file and extract sections
  private parseDumpFile(): Record<string, Record<string, any>> {
    const sections: Record<string, Record<string, any>> = {};
    let currentSection = '';
    let timestamp = '';

    const lines = this.data.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) continue;

      // Check if this is a section header
      const sectionMatch = trimmedLine.match(/^([a-z-]+):(\d+)$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        timestamp = sectionMatch[2];
        sections[currentSection] = {};
        continue;
      }

      // Parse entry line
      const entryMatch = trimmedLine.match(/^\s*([0-9a-f-]+):\s*(.+)$/);
      if (entryMatch && currentSection) {
        const uuid = entryMatch[1];
        const jsonStr = entryMatch[2];
        try {
          sections[currentSection][uuid] = JSON.parse(jsonStr);
        } catch (error) {
          console.error(`Error parsing JSON for ${uuid} in section ${currentSection}:`, error);
        }
      }
    }

    return sections;
  }

  // Convert and import data to MongoDB
  public async convert(): Promise<void> {
    try {
      // Connect to MongoDB using mongoose
      await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);
      console.log('Connected to MongoDB');

      // Parse the dump file
      const sections = this.parseDumpFile();

      // Process accounts first to build the account map
      if (sections.accounts) {
        const accountDocuments = [];

        for (const [uuid, data] of Object.entries(sections.accounts)) {
          const account = data as AccountType;
          this.accountMap.set(uuid, account.name);

          accountDocuments.push({
            uuid,
            name: account.name
          });
        }

        if (accountDocuments.length > 0) {
          await Account.insertMany(accountDocuments);
          console.log(`Imported ${accountDocuments.length} accounts`);
        }
      }

      // Process items
      if (sections.items) {
        const itemDocuments = [];

        for (const [uuid, data] of Object.entries(sections.items)) {
          const item = data as ItemType;

          itemDocuments.push({
            uuid,
            description: item.description,
            group: item.group,
            units: item.units,
            unitPrice: item.unitPrice,
            area: item.area,
            areaPrice: item.areaPrice,
            comment: item.comment
          });
        }

        if (itemDocuments.length > 0) {
          await Item.insertMany(itemDocuments);
          console.log(`Imported ${itemDocuments.length} items`);
        }
      }

      // Process contracts
      if (sections.contracts) {
        const contractDocuments = [];

        for (const [uuid, data] of Object.entries(sections.contracts)) {
          const contract = data as ContractType;

          contractDocuments.push({
            uuid,
            name: contract.name,
            creditor: contract.creditor,
            amount: contract.amount,
            shared: contract.shared,
            months: contract.months
          });
        }

        if (contractDocuments.length > 0) {
          await Contract.insertMany(contractDocuments);
          console.log(`Imported ${contractDocuments.length} contracts`);
        }
      }

      // Process balances
      if (sections.balances) {
        const balanceDocuments = [];

        for (const [uuid, data] of Object.entries(sections.balances)) {
          const balance = data as BalanceType;
          const accountName = this.accountMap.get(balance.account) || 'Unknown Account';

          balanceDocuments.push({
            uuid,
            amount: balance.amount,
            date: new Date(balance.date),
            description: balance.description,
            account: {
              uuid: balance.account,
              name: accountName
            }
          });
        }

        if (balanceDocuments.length > 0) {
          await Balance.insertMany(balanceDocuments);
          console.log(`Imported ${balanceDocuments.length} balances`);
        }
      }

      // Process stocks
      if (sections.stocks) {
        const stockDocuments = [];

        for (const [uuid, data] of Object.entries(sections.stocks)) {
          const stock = data as StockType;

          stockDocuments.push({
            uuid,
            symbol: stock.symbol,
            name: stock.name,
            purchase: stock.purchase,
            quantity: stock.quantity,
            value: stock.value
          });
        }

        if (stockDocuments.length > 0) {
          await Stock.insertMany(stockDocuments);
          console.log(`Imported ${stockDocuments.length} stocks`);
        }
      }

      // Process transactions (deposits, expenses, orders, transfers)
      const transactionDocuments = [];

      // Process deposits
      if (sections.deposits) {
        for (const [uuid, data] of Object.entries(sections.deposits)) {
          const deposit = data as DepositType;

          transactionDocuments.push({
            uuid,
            type: 'deposit',
            amount: deposit.amount,
            date: new Date(deposit.date),
            description: deposit.comment,
            account: {
              uuid: '', // No account UUID in the deposit data
              name: 'Unknown Account'
            },
            payer: deposit.payer
          });
        }
      }

      // Process expenses
      if (sections.expenses) {
        for (const [uuid, data] of Object.entries(sections.expenses)) {
          const expense = data as ExpenseType;

          transactionDocuments.push({
            uuid,
            type: 'expense',
            amount: expense.amount,
            date: new Date(expense.date),
            description: expense.description,
            account: {
              uuid: '', // No account UUID in the expense data
              name: expense.account
            },
            payer: expense.payer,
            creditor: expense.creditor,
            category: expense.category,
            invoice: expense.invoice === 'yes',
            item: expense.item
          });
        }
      }

      // Process orders
      if (sections.orders) {
        for (const [uuid, data] of Object.entries(sections.orders)) {
          const order = data as OrderType;
          const accountName = this.accountMap.get(order.account) || 'Unknown Account';

          transactionDocuments.push({
            uuid,
            type: 'order',
            amount: order.amount,
            date: new Date(order.date),
            description: order.description,
            account: {
              uuid: order.account,
              name: accountName
            },
            orderType: order.type
          });
        }
      }

      // Process transfers
      if (sections.transfers) {
        for (const [uuid, data] of Object.entries(sections.transfers)) {
          const transfer = data as TransferType;

          transactionDocuments.push({
            uuid,
            type: 'transfer',
            amount: transfer.amount,
            date: new Date(), // No date in the transfer data, using current date
            description: transfer.description,
            account: {
              uuid: '', // No account UUID in the transfer data
              name: 'Unknown Account'
            }
          });
        }
      }

      if (transactionDocuments.length > 0) {
        await Transaction.insertMany(transactionDocuments);
        console.log(`Imported ${transactionDocuments.length} transactions`);
      }

      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error during data migration:', error);
    } finally {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the converter if this script is executed directly
if (require.main === module) {
  const dumpFilePath = process.argv[2] || path.join(__dirname, '../data/2025-07-16_dump.txt');

  const converter = new DataConverter(dumpFilePath);
  converter.convert()
    .then(() => {
      console.log('Conversion completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Conversion failed:', error);
      process.exit(1);
    });
}

export default DataConverter;
