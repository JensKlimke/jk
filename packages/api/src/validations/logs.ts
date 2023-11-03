import Joi from 'joi'
import {validation} from "../utils/validation";

// define stock body
const body = Joi.object().keys({
  level: Joi.string().required(),
  loggerName: Joi.string().required(),
  messages: Joi.array().items(Joi.string()).required()
})

// generate contract validation
export const logsValidation = validation(body);
