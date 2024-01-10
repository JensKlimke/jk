import {NextFunction, Request, Response} from "express";
import ApiError from "../utils/ApiError";
import HttpStatusCode from "../utils/HttpStatusCode";

export const errorHandler = (err: Error, req: Request, res: Response, _: NextFunction) => {
  let error: ApiError;
  // check and convert error
  if (!(err instanceof ApiError)) {
    console.error(err);
    error = new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown issue');
  } else
    error = err;
  if (error.message === '') {
    // just the error code
    res.sendStatus(error.statusCode);
  } else {
    // specific error
    res
      .status(error.statusCode)
      .send({status: error.statusCode, message: err.message});
  }
}
