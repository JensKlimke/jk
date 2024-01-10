import express from "express";
import {authRoute} from "./auth";
import {router as userRouter} from "./users";
import {itemsRouter} from "./items";

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRouter);
router.use('/items', itemsRouter);

export const routes = router;
