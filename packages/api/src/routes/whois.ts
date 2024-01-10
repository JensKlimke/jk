import express from "express";
import {validate} from "../middlewares/validate";
import {whoisValidation} from "../validations/whois";
import {whoIsController} from "../controllers/whois";

const router = express.Router();

router.route('/').get(validate(whoisValidation), whoIsController.generateId)

// export
export {
  router as whoIsRouter,
}
