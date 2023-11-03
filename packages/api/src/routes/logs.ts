import express from "express";
import {logsController} from "../controllers/logs";
import {logsValidation} from "../validations/logs";
import {validate} from "../middlewares/validate";

const router = express.Router();

router.route('/')
  .post(validate(logsValidation), logsController.saveLogLineController)

// export
export {
  router as logsRouter,
}
