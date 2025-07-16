import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Item from '../../src/models/item.model';

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

describe('Item Model Test', () => {
  // Clear the database before each test
  beforeEach(async () => {
    await Item.deleteMany({});
  });

  it('should create & save an item successfully', async () => {
    const itemData = {
      uuid: '123e4567-e89b-12d3-a456-426614174010',
      description: 'Test Item',
      group: 'Test Group',
      units: 10,
      unitPrice: 5.99,
      area: 100,
      areaPrice: 0.5,
      comment: 'Test comment'
    };

    const validItem = new Item(itemData);
    const savedItem = await validItem.save();

    // Object Id should be defined when successfully saved to MongoDB
    expect(savedItem._id).toBeDefined();
    expect(savedItem.uuid).toBe(itemData.uuid);
    expect(savedItem.description).toBe(itemData.description);
    expect(savedItem.group).toBe(itemData.group);
    expect(savedItem.units).toBe(itemData.units);
    expect(savedItem.unitPrice).toBe(itemData.unitPrice);
    expect(savedItem.area).toBe(itemData.area);
    expect(savedItem.areaPrice).toBe(itemData.areaPrice);
    expect(savedItem.comment).toBe(itemData.comment);
    expect(savedItem.createdAt).toBeDefined();
    expect(savedItem.updatedAt).toBeDefined();
  });

  it('should create an item without a comment', async () => {
    const itemData = {
      uuid: '123e4567-e89b-12d3-a456-426614174011',
      description: 'Item without comment',
      group: 'Test Group',
      units: 5,
      unitPrice: 10.99,
      area: 50,
      areaPrice: 1.0
    };

    const validItem = new Item(itemData);
    const savedItem = await validItem.save();

    expect(savedItem._id).toBeDefined();
    expect(savedItem.uuid).toBe(itemData.uuid);
    expect(savedItem.comment).toBeUndefined();
  });

  it('should fail when required fields are missing', async () => {
    const itemWithoutRequiredField = new Item({
      uuid: '123e4567-e89b-12d3-a456-426614174012',
      description: 'Missing fields item',
      // Missing group
      units: 5,
      unitPrice: 10.99,
      area: 50,
      areaPrice: 1.0
    });

    let err: any;
    try {
      await itemWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.group).toBeDefined();
  });

  it('should fail when uuid is not unique', async () => {
    // Create the first item
    const itemData = {
      uuid: '123e4567-e89b-12d3-a456-426614174013',
      description: 'First Item',
      group: 'Test Group',
      units: 10,
      unitPrice: 5.99,
      area: 100,
      areaPrice: 0.5,
      comment: 'First item comment'
    };

    await new Item(itemData).save();

    // Try to create another item with the same uuid
    const duplicateItem = new Item({
      uuid: '123e4567-e89b-12d3-a456-426614174013',
      description: 'Second Item',
      group: 'Another Group',
      units: 5,
      unitPrice: 10.99,
      area: 50,
      areaPrice: 1.0,
      comment: 'Second item comment'
    });

    let err: any;
    try {
      await duplicateItem.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should update an item successfully', async () => {
    const itemData = {
      uuid: '123e4567-e89b-12d3-a456-426614174014',
      description: 'Original Description',
      group: 'Original Group',
      units: 10,
      unitPrice: 5.99,
      area: 100,
      areaPrice: 0.5,
      comment: 'Original comment'
    };

    const item = await new Item(itemData).save();

    // Update the item
    item.description = 'Updated Description';
    item.group = 'Updated Group';
    item.units = 20;
    const updatedItem = await item.save();

    expect(updatedItem.description).toBe('Updated Description');
    expect(updatedItem.group).toBe('Updated Group');
    expect(updatedItem.units).toBe(20);
    expect(updatedItem.updatedAt).not.toEqual(updatedItem.createdAt);
  });
});
