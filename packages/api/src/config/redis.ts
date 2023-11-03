// get database constants
import {createClient} from "redis";
import {DATABASE_AUTH, DATABASE_DEBUG, DATABASE_FINANCE, REDIS_HOST, REDIS_PORT} from "./env";

// generate URL
const url = `redis://${REDIS_HOST}:${REDIS_PORT}`;
console.log(`Connecting to redis server ${url}`);

// debug client
const debugClient = createClient({url});
debugClient.connect()
  .then(() => console.log('Redis server connected!'))
  .catch(console.error);
debugClient.select(DATABASE_DEBUG).catch(console.error);

// create client
const authClient = createClient({url});
authClient.connect().catch(console.error);
authClient.select(DATABASE_AUTH).catch(console.error);

// create client
const financeClient = createClient({url});
financeClient.connect().catch(console.error);
financeClient.select(DATABASE_FINANCE).catch(console.error);

export {
  debugClient,
  financeClient,
  authClient
}
