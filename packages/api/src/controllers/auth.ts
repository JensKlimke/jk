import {NextFunction, Request, Response} from "express";
import HttpStatusCode from "../utils/HttpStatusCode";
import {AUTH_URL, GITHUB_AUTHORIZE_URL, GITHUB_CLIENT_ID, STATE_SECRET, SUPER_ADMIN_ID} from "../config/env";
import jwt from "jsonwebtoken";
import {dbItems} from "../middlewares/database";
import {users} from "../config/fake";
import {checkToken, createSession, getAccessToken, getUserData, resolveSession, updateUserData} from "../utils/auth";


const user = (req : Request, res : Response) => {
  // check if user is set
  if (!req.auth.user)
    return res.sendStatus(HttpStatusCode.UNAUTHORIZED);
  // send user
  res.send(req.auth.user);
}

const login = (req : Request, res : Response) => {
  // generate url
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.append('client_id', GITHUB_CLIENT_ID);
  url.searchParams.append('redirect_uri', AUTH_URL);
  url.searchParams.append('state', jwt.sign((req?.query?.redirect?.toString() || ''), STATE_SECRET));
  // redirect
  res.redirect(url.toString());
}

const logout = async (req: Request, res: Response) => {
  // check
  if (!req.auth.clientToken)
    return res.sendStatus(HttpStatusCode.UNAUTHORIZED);
  // unset
  await dbItems.auth.deleteMany({clientKey: req.auth.clientToken});
  // send status code
  res.sendStatus(HttpStatusCode.OK);
}

const code = async (req: Request, res: Response, next : NextFunction) => {
  // get state
  const state = req?.query?.state?.toString() || '';
  // verify state
  const redirect = checkToken(state, STATE_SECRET);
  if (!redirect) return res.sendStatus(HttpStatusCode.BAD_REQUEST);
  // get and check code
  const code = req?.query?.code?.toString();
  if (!code) return res.sendStatus(HttpStatusCode.NOT_FOUND);
  try {
    // get access token
    const accessToken = await getAccessToken(req?.query?.code?.toString());
    // get user data
    const userData = await getUserData(accessToken);
    // check super admin role
    if (userData.email === SUPER_ADMIN_ID)
      userData.role = 'super_admin';
    // update user
    const {user, mode} = await updateUserData(userData, userData.role === 'super_admin');
    // check mode (user must be available)
    if (mode === 'not_found') return res.sendStatus(HttpStatusCode.NOT_FOUND);
    // generate and save token
    const token = await createSession(user.id);
    // create and resolve session
    resolveSession(res, redirect, token, mode);
  } catch(e) {
    // next with error
    next(e);
  }
}

const fake = async (req: Request, res: Response) => {
  // get redirect url and data
  const type = req?.query?.type?.toString() || 'user';
  // set user data and store
  const {user, mode} = await updateUserData(users[type], true);
  // generate and save token
  const token = await createSession(user.id);
  // create and resolve session
  resolveSession(res, req?.query?.redirect?.toString(), token, mode);
}

export const authController = {
  user,   // (A)
  login,  // (B)
  logout, // (I)
  code,   // (C)->(D)->(E)->(F)
  fake    // (H)->(F)
};