import Joi from 'joi'
import {COMMIT_ID, ENTRY_ID, JOI_ID} from "../utils/validation";

// define item body
const body = Joi.object().keys({
  project : Joi.string().required(),
  title : Joi.string().required(),
  description : Joi.string().allow(""),
  labels : Joi.array().items(Joi.string()).default([]),
  rank: Joi.number().default(0),
  links : Joi.array().items(Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required()
  })).default([]),
  tags : Joi.object().default({}),
  fields : Joi.object().default({}),
});

const link = Joi.object().keys({
  type: Joi.string().default('owns'),
  backType: Joi.string().optional()
});

// generate item validation
export const itemValidation = {
  addEntry: {body},
  addEntries: {body: Joi.array().items(body)},
  getEntries: {},
  getEntriesByCommit: {params: COMMIT_ID},
  patchHeadToCommit: {params: COMMIT_ID},
  patchHeadToLatestCommit: {},
  getEntry: {params: ENTRY_ID},
  updateEntry: {params: ENTRY_ID, body},
  patchEntry: {params: ENTRY_ID, body: Joi.object()},
  linkEntry: {params: {source: JOI_ID, target: JOI_ID}, body: link},
  unlinkEntry: {params: ENTRY_ID, body: link},
  updateEntries: {body},
  deleteEntry: {params: ENTRY_ID},
  deleteEntries: {}
}
