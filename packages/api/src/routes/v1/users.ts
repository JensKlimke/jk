import express from "express";
import {auth} from "../../middlewares/auth";
import {userController} from "../../controllers/users";

const router = express.Router();

router.route('/').get(auth(['getUsers']), userController.getUsers);

export {router}
