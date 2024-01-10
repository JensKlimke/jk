import {Request, Response} from "express";
import {catchAsync} from "../utils/catchAsync";
import {getNonFakeUsers} from "../middlewares/auth";

/**
 * Returns the users
 * @param req Express request
 * @param res Express response
 */
const getUsers = catchAsync(async (req: Request, res: Response) => {
  // send users
  res.send(await getNonFakeUsers());
});

export const userController = {
  getUsers
};
