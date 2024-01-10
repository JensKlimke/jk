import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {AuthData} from "./types/session";
import {verifyToken} from "./middlewares/auth";
import {errorHandler} from "./middlewares/error";
import ApiError from "./utils/ApiError";
import HttpStatusCode from "./utils/HttpStatusCode";
import {routes} from "./routes/v1";
import {whoIsRouter} from "./routes/whois";
import {logsRouter} from "./routes/logs";
import {addDbItem, db} from "./middlewares/database";
import {MongoClient} from "mongodb";
import {MONGO_URL} from "./config/env";
import {
  DBClient,
  COMMITS_COLLECTION_NAME,
  DOCUMENTS_COLLECTION_NAME,
  ITEMS_COLLECTION_NAME
} from "./utils/mongo";

// configure dotenv
dotenv.config();

declare global {
  namespace Express {
    export interface Request {
      auth: AuthData
      db: {[key:string]: DBClient}
    }
  }
}

const mongoClient = new MongoClient(MONGO_URL);
export const apiDb = mongoClient.db('jk-api');

DBClient.commitsCollection = apiDb.collection(COMMITS_COLLECTION_NAME);
DBClient.itemsCollection = apiDb.collection(ITEMS_COLLECTION_NAME);
DBClient.documentsCollection = apiDb.collection(DOCUMENTS_COLLECTION_NAME);

export const init = async () => {
  await mongoClient.connect();
  addDbItem('meta', apiDb);
  addDbItem('users', apiDb);
  addDbItem('auth', apiDb);
  addDbItem(DOCUMENTS_COLLECTION_NAME, apiDb);
  addDbItem(ITEMS_COLLECTION_NAME, apiDb);
  addDbItem(COMMITS_COLLECTION_NAME, apiDb);
}

export const terminate = async () => {
  await mongoClient.close();
}

// create express lifecycle_app
const App = express();

App.use(express.json({limit: '5mb'}));
App.use(express.urlencoded({extended: true, limit: '5mb'}));

// enable cors
App.use(cors());
App.options('*', cors());

// verify user by token
App.use(verifyToken);

// add database
App.use(db)

// routes
App.use('/whois', whoIsRouter);
App.use('/v1', routes);
App.use('/logs', logsRouter);

App.use((_, __, next) => {
  next(new ApiError(HttpStatusCode.NOT_FOUND, 'Not found'));
});

App.use(errorHandler);

export default App;