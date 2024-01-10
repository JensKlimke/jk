import {catchAsync} from "../utils/catchAsync";
import {Request, Response} from "express";
import {v4} from "uuid";
import {dbItems} from "../middlewares/database";

const generateId = catchAsync(async (req: Request, res: Response) => {
  // get client
  const client = dbItems.meta;
  // get ID from database
  let id = (await client.findOne({key: 'whois'}))?.value || undefined;
    // check id
  if (!id) {
    // generate id
    id = v4();
    // save id
    await client.insertOne({key: 'whois', value: id});
  }
  // send users
  res.send(id);
});

export const whoIsController = {
  generateId
}
