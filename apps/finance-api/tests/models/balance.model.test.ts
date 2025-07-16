import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Balance from '../../src/models/balance.model';

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

describe('Balance Model Test', () => {
  // Clear the database before each test
  beforeEach(async () => {
    await Balance.deleteMany({});
  });

  it('should create & save a balance successfully', async () => {
    const balanceData = {
      uuid: '123e4567-e89b-12d3-a456-426614174030',
      amount: 1500.75,
      date: new Date('2023-01-15'),
      description: 'Monthly balance check',
      account: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Checking Account'
      }
    };

    const validBalance = new Balance(balanceData);
    const savedBalance = await validBalance.save();

    // Object Id should be defined when successfully saved to MongoDB
    expect(savedBalance._id).toBeDefined();
    expect(savedBalance.uuid).toBe(balanceData.uuid);
    expect(savedBalance.amount).toBe(balanceData.amount);
    expect(savedBalance.date.toISOString()).toBe(balanceData.date.toISOString());
    expect(savedBalance.description).toBe(balanceData.description);
    expect(savedBalance.account.uuid).toBe(balanceData.account.uuid);
    expect(savedBalance.account.name).toBe(balanceData.account.name);
    expect(savedBalance.createdAt).toBeDefined();
    expect(savedBalance.updatedAt).toBeDefined();
  });

  it('should fail when required fields are missing', async () => {
    const balanceWithoutRequiredField = new Balance({
      uuid: '123e4567-e89b-12d3-a456-426614174031',
      amount: 1500.75,
      date: new Date('2023-01-15'),
      // Missing description
      account: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Checking Account'
      }
    });

    let err: any;
    try {
      await balanceWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.description).toBeDefined();
  });

  it('should fail when account fields are missing', async () => {
    const balanceWithoutAccountUuid = new Balance({
      uuid: '123e4567-e89b-12d3-a456-426614174032',
      amount: 1500.75,
      date: new Date('2023-01-15'),
      description: 'Missing account uuid',
      account: {
        // Missing uuid
        name: 'Checking Account'
      }
    });

    let err1: any;
    try {
      await balanceWithoutAccountUuid.save();
    } catch (error) {
      err1 = error;
    }

    expect(err1).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err1.errors['account.uuid']).toBeDefined();

    const balanceWithoutAccountName = new Balance({
      uuid: '123e4567-e89b-12d3-a456-426614174033',
      amount: 1500.75,
      date: new Date('2023-01-15'),
      description: 'Missing account name',
      account: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        // Missing name
      }
    });

    let err2: any;
    try {
      await balanceWithoutAccountName.save();
    } catch (error) {
      err2 = error;
    }

    expect(err2).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err2.errors['account.name']).toBeDefined();
  });

  it('should fail when uuid is not unique', async () => {
    // Create the first balance
    const balanceData = {
      uuid: '123e4567-e89b-12d3-a456-426614174034',
      amount: 1500.75,
      date: new Date('2023-01-15'),
      description: 'First balance',
      account: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Checking Account'
      }
    };

    await new Balance(balanceData).save();

    // Try to create another balance with the same uuid
    const duplicateBalance = new Balance({
      uuid: '123e4567-e89b-12d3-a456-426614174034',
      amount: 2000.50,
      date: new Date('2023-02-15'),
      description: 'Second balance',
      account: {
        uuid: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Savings Account'
      }
    });

    let err: any;
    try {
      await duplicateBalance.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should update a balance successfully', async () => {
    const balanceData = {
      uuid: '123e4567-e89b-12d3-a456-426614174035',
      amount: 1500.75,
      date: new Date('2023-01-15'),
      description: 'Original description',
      account: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Original Account'
      }
    };

    const balance = await new Balance(balanceData).save();

    // Update the balance
    balance.amount = 2000.50;
    balance.description = 'Updated description';
    balance.account.name = 'Updated Account';

    const updatedBalance = await balance.save();

    expect(updatedBalance.amount).toBe(2000.50);
    expect(updatedBalance.description).toBe('Updated description');
    expect(updatedBalance.account.name).toBe('Updated Account');
    expect(updatedBalance.updatedAt).not.toEqual(updatedBalance.createdAt);
  });
});
