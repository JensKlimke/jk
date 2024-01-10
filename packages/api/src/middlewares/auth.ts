import {NextFunction, Request, Response} from "express";
import ApiError from "../utils/ApiError";
import {roleRights} from "../config/roles";
import HttpStatusCode from "../utils/HttpStatusCode";
import httpStatusCode from "../utils/HttpStatusCode";
import {checkToken, getSession, getUserRole} from "../utils/auth";
import {catchAsync} from "../utils/catchAsync";
import {API_ENV, SESSION_SECRET} from "../config/env";
import {dbItems} from "./database";
import {ObjectId} from "mongodb";

const applyTestUser = (req: Request) => {
  // save data
  req.auth.clientToken = 'abcdefgh1234567890';
  req.auth.accessToken = 'abcdefgh1234567890';
  req.auth.user = {
    id: '6579e52e2dc110a650f0ba83',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin'
  }
}

export const verifyToken = catchAsync(async (req, res, next) => {
  // create session object
  req.auth = {accessToken: undefined, user: undefined, clientToken: undefined};
  // check header for test auth
  if (req.headers.authorization === 'test' && API_ENV === 'test') {
    applyTestUser(req);
    next();
    return
  }
  // check for real
  if (req.headers.authorization) {
    // get token and verify
    const bearer = req.headers.authorization.split(' ');
    const token = checkToken(bearer[1], SESSION_SECRET);
    // abort if token is not set
    if (!token) return next();
    // check token in database
    const tokenData = await getSession(token.toString());
    // check auth
    if (!tokenData) return next();
    // get user
    const user = await dbItems.users.findOne({_id: new ObjectId(tokenData.user.toString())});
    // check user
    if (!user) return next();
    // save data
    req.auth.clientToken = token.toString();
    req.auth.accessToken = tokenData.accessToken;
    // add user
    req.auth.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role
    }
  }
  // next
  next();
});

export const auth = (requiredRights: string[]) => async (req: Request, res: Response, next: NextFunction) => {
  return new Promise<void>(async (resolve, reject) => {
    // check user
    if (!req.auth.user)
      return reject(new ApiError(HttpStatusCode.UNAUTHORIZED, 'Please authenticate'));
    // check rights
    const userRights = roleRights.get(getUserRole(req)) || [];
    // every right must be fulfilled
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    // switch
    if (hasRequiredRights)
      resolve();
    else
      reject(new ApiError(httpStatusCode.UNAUTHORIZED));
  })
    .then(() => next())
    .catch((err) => next(err));
}

export const env = (envs : string[]) => async (_: Request, __: Response, next: NextFunction) => {
  if (envs.findIndex(e => e === API_ENV) !== -1)
    next();
  else
    next(HttpStatusCode.NOT_FOUND);
};

export const getNonFakeUsers = async () => {
  // get users
  return await dbItems.users.find({fake: false}).toArray();
}