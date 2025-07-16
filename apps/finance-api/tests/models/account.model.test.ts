import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Account from '../../src/models/account.model';

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

describe('Account Model Test', () => {
  // Clear the database before each test
  beforeEach(async () => {
    await Account.deleteMany({});
  });

  it('should create & save an account successfully', async () => {
    const accountData = {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Account'
    };

    const validAccount = new Account(accountData);
    const savedAccount = await validAccount.save();

    // Object Id should be defined when successfully saved to MongoDB
    expect(savedAccount._id).toBeDefined();
    expect(savedAccount.uuid).toBe(accountData.uuid);
    expect(savedAccount.name).toBe(accountData.name);
    expect(savedAccount.createdAt).toBeDefined();
    expect(savedAccount.updatedAt).toBeDefined();
  });

  it('should fail when required fields are missing', async () => {
    const accountWithoutRequiredField = new Account({ name: 'Test Account' });
    let err: any;

    try {
      await accountWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.uuid).toBeDefined();
  });

  it('should fail when uuid is not unique', async () => {
    // Create the first account
    const accountData = {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'First Account'
    };

    await new Account(accountData).save();

    // Try to create another account with the same uuid
    const duplicateAccount = new Account({
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Second Account'
    });

    let err: any;
    try {
      await duplicateAccount.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should update an account successfully', async () => {
    const accountData = {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Original Name'
    };

    const account = await new Account(accountData).save();

    // Update the account
    account.name = 'Updated Name';
    const updatedAccount = await account.save();

    expect(updatedAccount.name).toBe('Updated Name');
    expect(updatedAccount.updatedAt).not.toEqual(updatedAccount.createdAt);
  });
});
