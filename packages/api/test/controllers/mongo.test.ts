import {MongoClient} from "mongodb";
import {MONGO_URL} from "../../src/config/env";


describe('Check mongo basic functionality', () => {

  // storages
  let client: Mongo;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    // connect to database
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    // create client
    client = new Mongo(mongoClient.db('items'), 'mongo_test');
    await client.createIndex();
    // delete all
    await client.flushDb();
  });

  afterEach(async () => {
    // delete all
    await client.flushDb();
  })

  afterAll(async () => {
    // delete database
    await client.deleteCollection();
    // disconnect
    await mongoClient.close();
  })

  describe('without filters', () => {

    test('no item (try to get list)', async () => {
      // get entries
      const items = await client.getAll();
      expect(items).toEqual([]);
    });


    test('no item (try to get item)', async () => {
      // get non-existing entry
      let item = await client.getByID('abcdefabcdefabcdefabcdef');
      expect(item).toBeNull();
      // get non-existing entry but set default
      item = await client.getByID('abcdefabcdefabcdefabcdef', {}, {});
      expect(item).toEqual({});
    });

    test('write new items, get, delete', async () => {
      // save and set IDs
      const ids = await client.insertMany([{name: 'Jens', age: 39}, {name: 'Cathrin', age: 41}]);
      expect(ids.length).toBe(2);
      // get items
      let items = await client.getAll();
      expect(items.length).toBe(2);
      // check first item
      expect(items[0]._id.toString()).toEqual(ids[0]);
      expect(items[0].name).toEqual('Jens');
      expect(items[0].age).toBe(39);
      // check second item
      expect(items[1]._id.toString()).toEqual(ids[1]);
      expect(items[1].name).toEqual('Cathrin');
      expect(items[1].age).toBe(41);
      // get item by ID
      let item = await client.getByID(ids[0]);
      // check
      expect(item._id.toString()).toEqual(ids[0]);
      expect(item.name).toEqual('Jens');
      // delete item via set
      await client.deleteById(ids[0]);
      // get items
      items = await client.getAll();
      expect(items.length).toBe(1);
      // get item by ID
      item = await client.getByID(ids[0]);
      expect(item).toBeNull();
      // change item
      await client.updateById(ids[1], {name: 'Cathrin Klimke', age: undefined});
      // get item by ID
      item = await client.getByID(ids[1]);
      // check
      expect(item._id.toString()).toEqual(ids[1]);
      expect(item.name).toEqual('Cathrin Klimke');
      expect(item.age).toBeUndefined();
    })

  });

  describe('with filters', () => {

    test('no item (try to get list)', async () => {
      // get entries
      const items = await client.getAll({type: 'user', project: 'abc012'});
      expect(items).toEqual([]);
    });


    test('no item (try to get item)', async () => {
      // get non-existing entry
      let item = await client.getByID('abcdefabcdefabcdefabcdef', {type: 'user'});
      expect(item).toBeNull();
      // get non-existing entry but set default
      item = await client.getByID('abcdefabcdefabcdefabcdef', {type: 'user'}, {});
      expect(item).toEqual({});
    });

    test('write new items, get, delete', async () => {
      // save and set IDs
      const ids = await client.insertMany([
        {name: 'Jens', age: 40},
        {name: 'Cathrin', age: 41}
      ], {type: 'user', project: 'abc012'});
      expect(ids.length).toBe(2);
      // get items
      let items = await client.getAll({type: 'user', project: 'abc012'});
      expect(items.length).toBe(2);
      // check first item
      expect(items[0]._id.toString()).toEqual(ids[0]);
      expect(items[0].name).toEqual('Jens');
      expect(items[0].age).toBe(40);
      expect(items[0].type).toEqual('user');
      expect(items[0].project).toEqual('abc012');
      // check second item
      expect(items[1]._id.toString()).toEqual(ids[1]);
      expect(items[1].name).toEqual('Cathrin');
      expect(items[1].age).toBe(41);
      expect(items[1].type).toEqual('user');
      expect(items[1].project).toEqual('abc012');
      // get item by ID
      let item = await client.getByID(ids[0], {type: 'user', project: 'abc012'});
      // check
      expect(item._id.toString()).toEqual(ids[0]);
      expect(item.name).toEqual('Jens');
      expect(item.type).toEqual('user');
      expect(item.project).toEqual('abc012');
      // delete item via set
      await client.deleteById(ids[0], {type: 'user', project: 'abc012'});
      // get items
      items = await client.getAll({type: 'user', project: 'abc012'});
      expect(items.length).toBe(1);
      // get item by ID
      item = await client.getByID(ids[0], {type: 'user', project: 'abc012'});
      expect(item).toBeNull();
      // change item
      await client.updateById(ids[1], {name: 'Cathrin Klimke', age: undefined}, {type: 'user', project: 'abc012'});
      // get item by ID
      item = await client.getByID(ids[1], {type: 'user', project: 'abc012'});
      // check
      expect(item._id.toString()).toEqual(ids[1]);
      expect(item.name).toEqual('Cathrin Klimke');
      expect(item.age).toBeUndefined();
      expect(item.type).toEqual('user');
      expect(item.project).toEqual('abc012');
      // insert different
      await client.insert({name: 'Jens', age: 39}, {type: 'user', project: 'xyz123'});
      await client.insert({name: 'John', age: 51}, {type: 'user', project: 'abc012'});
      // check
      items = await client.getAll({type: 'user', project: 'xyz123'});
      expect(items.length).toBe(1);
      items = await client.getAll({type: 'user', project: 'abc012'});
      expect(items.length).toBe(2);
      // delete many
      await client.deleteMany({type: 'user', project: 'abc012'});
      // check
      items = await client.getAll({type: 'user', project: 'xyz123'});
      expect(items.length).toBe(1);
      items = await client.getAll({type: 'user', project: 'abc012'});
      expect(items.length).toBe(0);
    })

  })

  describe('with tags', () => {

    beforeAll(() => {
      client.setTagKeys(['location', 'age', 'type']);
    })

    test('write tags', async () => {
      // save many
      const ids = await client.insertMany([
        {name: 'Abraham', age: 39},
        {name: 'Britney', age: 41}
      ], {location: 'Vallendar', type: 'person'});
      // save one
      const id = await client.insert({name: 'Claire', age: 52}, {location: 'America', type: 'person'});
      // check
      const persons = await client.getAll();
      expect(persons.length).toBe(3);
      // check index
      let index = await client.getTagIndex();
      expect(index.length).toBe(21);
      // delete
      await client.deleteById(ids[0]);
      // check index
      index = await client.getTagIndex();
      expect(index.length).toBe(14);
      // change tags
      await client.updateById(ids[1], {age: undefined, location: 'Koblenz'})
      // check index
      index = await client.getTagIndex();
      expect(index.length).toBe(10);
    });
  });

  describe('with reference', () => {

    let sensorCtrl : Mongo = undefined;
    let locationCtrl : Mongo = undefined;

    beforeEach(async () => {
      // create client for locations
      locationCtrl = new Mongo(mongoClient.db('items'), 'location');
      locationCtrl.setTagKeys(['owner']);
      await locationCtrl.flushDb();
      // create client for sensors
      sensorCtrl = new Mongo(mongoClient.db('items'), 'sensor');
      sensorCtrl.setOwnerKey('location');
      sensorCtrl.setTagKeys(['room', 'type']);
      await sensorCtrl.flushDb();
    });

    afterEach(async () => {
      // delete database location
      await locationCtrl.deleteCollection();
      // delete database sensor
      await sensorCtrl.deleteCollection();
    })

    test('create objects', async () => {
      // create location
      const locHomeId = await locationCtrl.insert({name: 'Home', owner: 'Jens'});
      // create sensors
      const sensorIds = await sensorCtrl.insertMany([
        { name: 'Temperature Sensor Kitchen', location: locHomeId, room: 'kitchen', type: 'temperature' },
        { name: 'Motion Sensor Corridor', location: locHomeId, room: 'corridor', type: 'motion' },
        { name: 'Temperature Sensor Corridor', location: locHomeId, room: 'corridor', type: 'temperature' }
      ]);
      // get home data
      const home = await locationCtrl.getByID(locHomeId, {})
      // TODO: get with children
      console.log(home);
    })

  })

});

