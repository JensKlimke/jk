import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Stock from '../../src/models/stock.model';

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

describe('Stock Model Test', () => {
  // Clear the database before each test
  beforeEach(async () => {
    await Stock.deleteMany({});
  });

  it('should create & save a stock successfully', async () => {
    const stockData = {
      uuid: '123e4567-e89b-12d3-a456-426614174040',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      purchase: 150.75,
      quantity: 10,
      value: 1600.50
    };

    const validStock = new Stock(stockData);
    const savedStock = await validStock.save();

    // Object Id should be defined when successfully saved to MongoDB
    expect(savedStock._id).toBeDefined();
    expect(savedStock.uuid).toBe(stockData.uuid);
    expect(savedStock.symbol).toBe(stockData.symbol);
    expect(savedStock.name).toBe(stockData.name);
    expect(savedStock.purchase).toBe(stockData.purchase);
    expect(savedStock.quantity).toBe(stockData.quantity);
    expect(savedStock.value).toBe(stockData.value);
    expect(savedStock.createdAt).toBeDefined();
    expect(savedStock.updatedAt).toBeDefined();
  });

  it('should fail when required fields are missing', async () => {
    const stockWithoutRequiredField = new Stock({
      uuid: '123e4567-e89b-12d3-a456-426614174041',
      symbol: 'MSFT',
      // Missing name
      purchase: 250.25,
      quantity: 5,
      value: 1300.75
    });

    let err: any;
    try {
      await stockWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail when uuid is not unique', async () => {
    // Create the first stock
    const stockData = {
      uuid: '123e4567-e89b-12d3-a456-426614174042',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      purchase: 150.75,
      quantity: 10,
      value: 1600.50
    };

    await new Stock(stockData).save();

    // Try to create another stock with the same uuid
    const duplicateStock = new Stock({
      uuid: '123e4567-e89b-12d3-a456-426614174042',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      purchase: 250.25,
      quantity: 5,
      value: 1300.75
    });

    let err: any;
    try {
      await duplicateStock.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should update a stock successfully', async () => {
    const stockData = {
      uuid: '123e4567-e89b-12d3-a456-426614174043',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      purchase: 150.75,
      quantity: 10,
      value: 1600.50
    };

    const stock = await new Stock(stockData).save();

    // Update the stock
    stock.symbol = 'AAPL.US';
    stock.purchase = 160.25;
    stock.quantity = 15;
    stock.value = 2500.75;

    const updatedStock = await stock.save();

    expect(updatedStock.symbol).toBe('AAPL.US');
    expect(updatedStock.purchase).toBe(160.25);
    expect(updatedStock.quantity).toBe(15);
    expect(updatedStock.value).toBe(2500.75);
    expect(updatedStock.updatedAt).not.toEqual(updatedStock.createdAt);
  });

  it('should handle numeric values correctly', async () => {
    const stockData = {
      uuid: '123e4567-e89b-12d3-a456-426614174044',
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      purchase: 800.50,
      quantity: 2.5, // Fractional shares
      value: 2100.75
    };

    const validStock = new Stock(stockData);
    const savedStock = await validStock.save();

    expect(savedStock.purchase).toBe(800.50);
    expect(savedStock.quantity).toBe(2.5);
    expect(savedStock.value).toBe(2100.75);

    // Calculate the total value and compare
    const calculatedValue = savedStock.purchase * savedStock.quantity;
    expect(calculatedValue).toBe(2001.25); // 800.50 * 2.5 = 2001.25

    // This is different from the stored value, which is fine for this model
    expect(calculatedValue).not.toBe(savedStock.value);
  });
});
