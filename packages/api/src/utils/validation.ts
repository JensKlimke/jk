import ApiError from "./ApiError";
import HttpStatusCode from "./HttpStatusCode";
import Joi from "joi";

export function isValidUUID(uuid: string): string {
  const uuidRegex = /^[0-9a-f]{24}$/;
  if (!uuidRegex.test(uuid))
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Invalid ID');
  else
    return uuid;
}


export const JOI_ID = Joi.string().custom(isValidUUID);

export const ENTRY_ID = {
  id: JOI_ID,
};

export const COMMIT_ID = {
  commitId: JOI_ID.required(),
}
