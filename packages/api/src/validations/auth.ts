import Joi from "joi";

const fakeSessionScheme = {
  type: Joi.string,
  redirect: Joi.string
};

export {
  fakeSessionScheme
}