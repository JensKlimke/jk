import express from "express";
import {authController} from "../../controllers/auth";
import {validate} from "../../middlewares/validate";
import {API_ENV, CODE_KEY} from "../../config/env";
import {fakeSessionScheme} from "../../validations/auth";
import {env} from "../../middlewares/auth";

const router = express.Router();

router.route('/').get(authController.user)
router.route('/login').get(authController.login);
router.route('/logout').get(authController.logout)
router.route(`/${CODE_KEY}`).get(authController.code);
router.route('/fake').get(env(['dev', 'test']), validate(fakeSessionScheme), authController.fake);

export const authRoute = router;
