import Joi from "joi";
import ApiError from "../utils/ApiError";
import HttpStatusCode from "../utils/HttpStatusCode";
import {pick} from "../utils/pick";
import {NextFunction, Request, Response} from "express";

export const validate = (schema: any) => (req: Request, _: Response, next: NextFunction) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const {value, error} = Joi.compile(validSchema)
    .prefs({errors: {label: 'key'}, abortEarly: false})
    .validate(object);
  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(HttpStatusCode.BAD_REQUEST, errorMessage));
  }
  Object.assign(req, value);
  return next();
};
