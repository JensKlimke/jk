import {catchAsync} from "../utils/catchAsync";
import {DBClient} from "../utils/mongo";
import {Collection, Db} from "mongodb";


export const dbItems : {[key: string]: Collection} = {};

export const addDbItem = (key : string, db : Db) => {
  dbItems[key] = db.collection(key);
}

export const db = catchAsync(async (req, _, next) => {
  // set db object
  req.db = {};
  // write to req
  Object.entries(dbItems).forEach(([key, collection]) => {
    // create client
    const db = new DBClient(collection);
    // set user ID
    req.auth.user?.id && db.setAuth(req.auth.user.id);
    // store to request
    req.db[key] = db;
  });
  // next
  next();
});

