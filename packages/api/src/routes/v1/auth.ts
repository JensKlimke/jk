import express from "express";
import {authController} from "../../controllers/auth";
import {validate} from "../../middlewares/validate";
import {API_ENV} from "../../config/env";
import Joi from "joi";

const router = express.Router();

const fakeSessionScheme = {
  type: Joi.string,
  redirect: Joi.string
};

router.route('/login').get(authController.login);
router.route('/logout').get(authController.logout)
router.route('/auth').get(authController.code);

if (API_ENV === 'dev') {
  router.route('/fake').get(validate(fakeSessionScheme), authController.fakeSession);
}

export const authRoute = router;
