import express from "express";
import {logsController} from "../controllers/logs";
import {logsValidation} from "../validations/logs";
import {validate} from "../middlewares/validate";
import {auth} from "../middlewares/auth";

const router = express.Router();

router.route('/')
  .get(auth(['getLogItems']), validate(logsValidation.get), logsController.getLogLinesController)
  .post(validate(logsValidation.post), logsController.saveLogLineController)

// export
export {
  router as logsRouter,
}
