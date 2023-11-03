import ApiError from "./ApiError";
import HttpStatusCode from "./HttpStatusCode";
import Joi from "joi";

export function isValidUUID(uuid: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  if (!uuidRegex.test(uuid))
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Invalid ID');
  else
    return uuid;
}

export interface RequestValidator {
  body?: any,
  params?: any,
  query?: any,
}

export interface DefaultValidator {
  addEntry: RequestValidator,
  addEntries: RequestValidator
  getEntries: RequestValidator,
  getEntry: RequestValidator
  updateEntry: RequestValidator
  deleteEntry: RequestValidator
  deleteEntries: RequestValidator
}

const entryId = {
  id: Joi.string().custom(isValidUUID),
};

export function validation(body: Joi.ObjectSchema, queryDef ?: any, paramsDef ?: any): DefaultValidator {
  // get elements
  const q = queryDef || {};
  const p = paramsDef || {};
  // add if for parameters
  const paramsWithId = Joi.object().keys({...p, ...entryId});
  // define parameters and query
  const params = Joi.object().keys(p);
  const query = Joi.object().keys(q);
  // generate structure
  return {
    addEntry: {
      body,
      query,
    },
    addEntries: {
      body: Joi.array().items(body),
      query
    },
    getEntries: {
      query,
      params
    },
    getEntry: {
      params: paramsWithId,
    },
    updateEntry: {
      params: paramsWithId,
      body,
    },
    deleteEntry: {
      params: paramsWithId,
    },
    deleteEntries: {
      query
    }
  }
}
