import express from "express";
import {getDatabaseEntries, getDatabaseKeys} from "../../controllers/database";
import {auth} from "../../middlewares/auth";
import {validate} from "../../middlewares/validate";
import Joi, {string} from "joi";

// create router and define routes
const router = express.Router();

router.route('/keys')
  .get(auth(['getDatabaseItems']), validate(Joi.object().keys({})), getDatabaseKeys);

router.route('/entries')
  .get(auth(['getDatabaseItems']), validate(Joi.object().keys({key: string})), getDatabaseEntries);

// export
export {
  router as databaseRouter,
}
