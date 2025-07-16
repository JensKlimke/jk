import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Transaction from '../../src/models/transaction.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Transaction Model Test', () => {
  // Clear the database before each test
  beforeEach(async () => {
    await Transaction.deleteMany({});
  });

  it('should create & save a deposit transaction successfully', async () => {
    const transactionData = {
      uuid: '123e4567-e89b-12d3-a456-426614174001',
      type: 'deposit',
      amount: 1000,
      date: new Date(),
      description: 'Salary deposit',
      account: {
        uuid: '',
        name: 'Checking Account'
      },
      payer: 'Employer'
    };

    const validTransaction = new Transaction(transactionData);
    const savedTransaction = await validTransaction.save();

    // Object Id should be defined when successfully saved to MongoDB
    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.uuid).toBe(transactionData.uuid);
    expect(savedTransaction.type).toBe(transactionData.type);
    expect(savedTransaction.amount).toBe(transactionData.amount);
    expect(savedTransaction.description).toBe(transactionData.description);
    expect(savedTransaction.account.name).toBe(transactionData.account.name);
    expect(savedTransaction.payer).toBe(transactionData.payer);
    expect(savedTransaction.createdAt).toBeDefined();
    expect(savedTransaction.updatedAt).toBeDefined();
  });

  it('should create & save an expense transaction successfully', async () => {
    const transactionData = {
      uuid: '123e4567-e89b-12d3-a456-426614174002',
      type: 'expense',
      amount: 50,
      date: new Date(),
      description: 'Grocery shopping',
      account: {
        uuid: '',
        name: 'Credit Card'
      },
      creditor: 'Supermarket',
      category: 'Food',
      invoice: true,
      item: 'Groceries'
    };

    const validTransaction = new Transaction(transactionData);
    const savedTransaction = await validTransaction.save();

    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.uuid).toBe(transactionData.uuid);
    expect(savedTransaction.type).toBe(transactionData.type);
    expect(savedTransaction.amount).toBe(transactionData.amount);
    expect(savedTransaction.description).toBe(transactionData.description);
    expect(savedTransaction.account.name).toBe(transactionData.account.name);
    expect(savedTransaction.creditor).toBe(transactionData.creditor);
    expect(savedTransaction.category).toBe(transactionData.category);
    expect(savedTransaction.invoice).toBe(transactionData.invoice);
    expect(savedTransaction.item).toBe(transactionData.item);
  });

  it('should create & save an order transaction successfully', async () => {
    const transactionData = {
      uuid: '123e4567-e89b-12d3-a456-426614174003',
      type: 'order',
      amount: 500,
      date: new Date(),
      description: 'Stock purchase',
      account: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Investment Account'
      },
      orderType: 'purchase'
    };

    const validTransaction = new Transaction(transactionData);
    const savedTransaction = await validTransaction.save();

    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.uuid).toBe(transactionData.uuid);
    expect(savedTransaction.type).toBe(transactionData.type);
    expect(savedTransaction.amount).toBe(transactionData.amount);
    expect(savedTransaction.description).toBe(transactionData.description);
    expect(savedTransaction.account.name).toBe(transactionData.account.name);
    expect(savedTransaction.orderType).toBe(transactionData.orderType);
  });

  it('should fail when required fields are missing', async () => {
    const transactionWithoutRequiredField = new Transaction({
      uuid: '123e4567-e89b-12d3-a456-426614174004',
      type: 'deposit',
      // Missing amount
      date: new Date(),
      description: 'Test transaction',
      account: {
        uuid: '',
        name: 'Test Account'
      }
    });

    let err: any;
    try {
      await transactionWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).toBeDefined();
  });

  it('should fail when type is not in enum', async () => {
    const transactionWithInvalidType = new Transaction({
      uuid: '123e4567-e89b-12d3-a456-426614174005',
      type: 'invalid-type', // Invalid type
      amount: 100,
      date: new Date(),
      description: 'Test transaction',
      account: {
        uuid: '',
        name: 'Test Account'
      }
    });

    let err: any;
    try {
      await transactionWithInvalidType.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.type).toBeDefined();
  });

  it('should fail when orderType is not in enum', async () => {
    const transactionWithInvalidOrderType = new Transaction({
      uuid: '123e4567-e89b-12d3-a456-426614174006',
      type: 'order',
      amount: 100,
      date: new Date(),
      description: 'Test transaction',
      account: {
        uuid: '',
        name: 'Test Account'
      },
      orderType: 'invalid-order-type' // Invalid orderType
    });

    let err: any;
    try {
      await transactionWithInvalidOrderType.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.orderType).toBeDefined();
  });

  it('should fail when uuid is not unique', async () => {
    // Create the first transaction
    const transactionData = {
      uuid: '123e4567-e89b-12d3-a456-426614174007',
      type: 'deposit',
      amount: 100,
      date: new Date(),
      description: 'First transaction',
      account: {
        uuid: '',
        name: 'Test Account'
      }
    };

    await new Transaction(transactionData).save();

    // Try to create another transaction with the same uuid
    const duplicateTransaction = new Transaction({
      uuid: '123e4567-e89b-12d3-a456-426614174007',
      type: 'expense',
      amount: 50,
      date: new Date(),
      description: 'Second transaction',
      account: {
        uuid: '',
        name: 'Another Account'
      }
    });

    let err: any;
    try {
      await duplicateTransaction.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });
});
