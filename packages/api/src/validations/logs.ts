import Joi from 'joi'

// define stock body
const body = Joi.object().keys({
  level: Joi.string().required(),
  loggerName: Joi.string().required(),
  messages: Joi.array().items(Joi.string()).required()
})

const query = Joi.object().keys({
  loggerName: Joi.string().required(),
  date: Joi.string().required()
})

// generate contract validation
export const logsValidation = {
  post: {body},
  get: {query}
};
