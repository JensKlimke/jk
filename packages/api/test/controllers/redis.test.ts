import {createClient, RedisClientType} from "redis";

// constants
const url = `redis://localhost:6379`;
const uid = 'abc-def-ghi-012-345';

// storages
let client: RedisClientType | undefined;

describe("redis controller tests", () => {
  // start redis
  beforeAll(async () => {
    // debug client
    client = createClient({url});
    // connect
    await client.connect();
    // select db
    await client.select(0).catch(console.error);
    // delete all
    await client.flushAll();
  });
  // stop redis
  afterAll(async () => {
    client && await client.disconnect();
  });
  // tests
  describe("Simple entry controller", () => {
    // test steps
    it("Get items (none created)", async () => {
      // get entries
      const items = client && await client.hGetAll(`item:${uid}`);
      expect(items).toMatchObject({});
    });
  });
});
