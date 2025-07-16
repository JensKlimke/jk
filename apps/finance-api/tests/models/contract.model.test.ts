import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Contract from '../../src/models/contract.model';

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

describe('Contract Model Test', () => {
  // Clear the database before each test
  beforeEach(async () => {
    await Contract.deleteMany({});
  });

  it('should create & save a contract successfully', async () => {
    const contractData = {
      uuid: '123e4567-e89b-12d3-a456-426614174020',
      name: 'Test Contract',
      creditor: 'Test Creditor',
      amount: 100.50,
      shared: true,
      months: [true, true, true, true, true, true, true, true, true, true, true, true]
    };

    const validContract = new Contract(contractData);
    const savedContract = await validContract.save();

    // Object Id should be defined when successfully saved to MongoDB
    expect(savedContract._id).toBeDefined();
    expect(savedContract.uuid).toBe(contractData.uuid);
    expect(savedContract.name).toBe(contractData.name);
    expect(savedContract.creditor).toBe(contractData.creditor);
    expect(savedContract.amount).toBe(contractData.amount);
    expect(savedContract.shared).toBe(contractData.shared);
    expect(savedContract.months).toEqual(contractData.months);
    expect(savedContract.createdAt).toBeDefined();
    expect(savedContract.updatedAt).toBeDefined();
  });

  it('should fail when required fields are missing', async () => {
    const contractWithoutRequiredField = new Contract({
      uuid: '123e4567-e89b-12d3-a456-426614174021',
      name: 'Missing Fields Contract',
      // Missing creditor
      amount: 100.50,
      shared: true,
      months: [true, true, true, true, true, true, true, true, true, true, true, true]
    });

    let err: any;
    try {
      await contractWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.creditor).toBeDefined();
  });

  it('should fail when months array does not have exactly 12 elements', async () => {
    // Test with fewer than 12 elements
    const contractWithShortMonths = new Contract({
      uuid: '123e4567-e89b-12d3-a456-426614174022',
      name: 'Short Months Contract',
      creditor: 'Test Creditor',
      amount: 100.50,
      shared: true,
      months: [true, true, true] // Only 3 elements
    });

    let err1: any;
    try {
      await contractWithShortMonths.save();
    } catch (error) {
      err1 = error;
    }

    expect(err1).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err1.errors.months).toBeDefined();

    // Test with more than 12 elements
    const contractWithLongMonths = new Contract({
      uuid: '123e4567-e89b-12d3-a456-426614174023',
      name: 'Long Months Contract',
      creditor: 'Test Creditor',
      amount: 100.50,
      shared: true,
      months: [true, true, true, true, true, true, true, true, true, true, true, true, true, true] // 14 elements
    });

    let err2: any;
    try {
      await contractWithLongMonths.save();
    } catch (error) {
      err2 = error;
    }

    expect(err2).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err2.errors.months).toBeDefined();
  });

  it('should fail when uuid is not unique', async () => {
    // Create the first contract
    const contractData = {
      uuid: '123e4567-e89b-12d3-a456-426614174024',
      name: 'First Contract',
      creditor: 'First Creditor',
      amount: 100.50,
      shared: true,
      months: [true, true, true, true, true, true, true, true, true, true, true, true]
    };

    await new Contract(contractData).save();

    // Try to create another contract with the same uuid
    const duplicateContract = new Contract({
      uuid: '123e4567-e89b-12d3-a456-426614174024',
      name: 'Second Contract',
      creditor: 'Second Creditor',
      amount: 200.75,
      shared: false,
      months: [false, false, false, false, false, false, false, false, false, false, false, false]
    });

    let err: any;
    try {
      await duplicateContract.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should update a contract successfully', async () => {
    const contractData = {
      uuid: '123e4567-e89b-12d3-a456-426614174025',
      name: 'Original Name',
      creditor: 'Original Creditor',
      amount: 100.50,
      shared: true,
      months: [true, true, true, true, true, true, true, true, true, true, true, true]
    };

    const contract = await new Contract(contractData).save();

    // Update the contract
    contract.name = 'Updated Name';
    contract.creditor = 'Updated Creditor';
    contract.amount = 200.75;
    contract.shared = false;
    contract.months = [false, false, false, false, false, false, false, false, false, false, false, false];

    const updatedContract = await contract.save();

    expect(updatedContract.name).toBe('Updated Name');
    expect(updatedContract.creditor).toBe('Updated Creditor');
    expect(updatedContract.amount).toBe(200.75);
    expect(updatedContract.shared).toBe(false);
    expect(updatedContract.months).toEqual([false, false, false, false, false, false, false, false, false, false, false, false]);
    expect(updatedContract.updatedAt).not.toEqual(updatedContract.createdAt);
  });
});
