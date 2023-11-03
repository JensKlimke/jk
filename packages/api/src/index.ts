import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {AuthData} from "./types/session";
import {verifyToken} from "./middlewares/auth";
import {errorHandler} from "./middlewares/error";
import ApiError from "./utils/ApiError";
import HttpStatusCode from "./utils/HttpStatusCode";
import {API_ENV, PORT} from "./config/env";
import {routes} from "./routes/v1";
import {whoIsRouter} from "./routes/whois";
import {logsRouter} from "./routes/logs";

// configure dotenv
dotenv.config();

declare global {
  namespace Express {
    export interface Request {
      auth: AuthData
    }
  }
}


// create express lifecycle_app
const app = express();

// parse body
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended: true, limit: '5mb'}));

// enable cors
app.use(cors());
app.options('*', cors());


// verify user by token
app.use(verifyToken);

// routes
app.use('/whois', whoIsRouter);
app.use('/v1', routes);
app.use('/logs', logsRouter);

app.use((_, __, next) => {
  next(new ApiError(HttpStatusCode.NOT_FOUND, 'Not found'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT} in ${API_ENV === 'dev' ? 'dev' : 'prod'} mode`);
});
