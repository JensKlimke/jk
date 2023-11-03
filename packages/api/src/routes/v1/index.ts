import express from "express";
import {authRoute} from "./auth";
import {router as userRouter} from "./user";
import {databaseRouter} from "./database";

const router = express.Router();

router.use('/auth', authRoute);
router.use('/user', userRouter);
router.use('/database', databaseRouter);

export const routes = router;
