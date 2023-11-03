import {financeClient} from "../config/redis";
import {Request, Response} from "express";
import httpStatusCode from "../utils/HttpStatusCode";

const getDatabaseKeys = (async (req: Request, res: Response) => {
  // get keys
  const keys = await financeClient.keys('*');
  // return keys
  res.status(httpStatusCode.OK).send(keys);
});

const getDatabaseEntries = (async (req: Request, res: Response) => {
  // get data
  if (!req.query?.key)
    return res.status(httpStatusCode.NOT_FOUND).send();
  // check data
  const data = await financeClient.hGetAll(req.query.key.toString());
  // check data
  if (!data)
    return res.status(httpStatusCode.NOT_FOUND).send();
  // return keys
  res.status(httpStatusCode.OK).send(data);
});

export {
  getDatabaseKeys,
  getDatabaseEntries
}