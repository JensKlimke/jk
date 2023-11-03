import {catchAsync} from "../utils/catchAsync";
import {Request, Response} from "express";
import {authClient} from "../config/redis";
import {WHO_IS_DB_KEY} from "../config/whois";
import {v4} from "uuid";

const generateId = catchAsync(async (req: Request, res: Response) => {
  // get id
  let id = await authClient.hGet(WHO_IS_DB_KEY, 'id');
  // check id
  if (!id) {
    // generate id
    id = v4();
    // save id
    await authClient.hSet(WHO_IS_DB_KEY, 'id', id);
  }
  // send users
  res.send(id);
});

export const whoIsController = {
  generateId
}
