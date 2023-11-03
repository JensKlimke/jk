import {Request, Response} from "express";
import jwt from "jsonwebtoken";
import HttpStatusCode from "../utils/HttpStatusCode";
import httpStatusCode from "../utils/HttpStatusCode";
import {v4} from "uuid";
import {catchAsync} from "../utils/catchAsync";
import {checkToken, loadUserData} from "../utils/auth";
import {authClient} from "../config/redis";
import {
  AUTH_DB_KEY,
  AUTH_PATH,
  GITHUB_AUTHORIZE_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_TOKEN_URL,
  HOST_URL,
  SESSION_SECRET,
  STATE_SECRET,
  SUPER_ADMIN_ID,
  USER_DB_KEY
} from "../config/env";
import {UserData} from "../types/session";


/**
 * Logout: Destroys the current session
 * @param req Express request
 * @param res Express response
 */
const logout = catchAsync(async (req: Request, res: Response) => {
  // check
  if (!req.auth.clientToken)
    return res.sendStatus(httpStatusCode.UNAUTHORIZED);
  // unset
  await authClient.hDel('auth', req.auth.clientToken);
  // send status code
  res.sendStatus(httpStatusCode.OK);
});


/**
 * Login: Redirects the user to the GitHub auth page
 * @param req Express request
 * @param res Express response
 */
const login = (req: Request, res: Response) => {
  // get redirect
  const origin = req?.query?.redirect || '';
  const redirect = HOST_URL + AUTH_PATH;
  // generate state
  const state = jwt.sign(origin, STATE_SECRET);
  // generate url
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.append('client_id', GITHUB_CLIENT_ID);
  url.searchParams.append('redirect_uri', redirect);
  url.searchParams.append('state', state);
  // redirect
  res.redirect(url.toString());
}


const fakeSession = async (req: Request, res: Response) => {
  // get redirect url and data
  const redirect = req?.query?.redirect || '';
  const type = req?.query?.type || 'user';
  // set user data
  let user: UserData;
  if (type === 'admin') {
    user = {
      id: '0',
      name: 'Fake Admin',
      email: 'admin@example.com',
      role: 'admin'
    }
  } else {
    user = {
      id: '1',
      name: 'Fake User',
      email: 'user@example.com',
      role: 'user'
    }
  }
  await authClient.hSet(USER_DB_KEY, user.id, JSON.stringify(user));
  // create data to store
  const authData = {
    accessToken: '',
    user: user.id,
  }
  // save access token to database
  const clientKey = v4();
  const clientToken = jwt.sign(clientKey, SESSION_SECRET);
  // save session
  await authClient.hSet(AUTH_DB_KEY, clientKey, JSON.stringify(authData));
  // check url
  if (redirect) {
    // create uri
    const redirectUri = new URL(redirect.toString());
    redirectUri.searchParams.set('token', clientToken);
    // redirect to url
    res.redirect(redirectUri.toString());
  } else {
    // send status
    res.status(200).send({'token': clientToken});
  }
}


/**
 * Requests the access token with the given code
 * @param req Express request
 * @param res Express response
 */
const code = (req: Request, res: Response) => {
  // get parameters
  const code = (req?.query?.code || '').toString();
  const state = req?.query?.state || '';
  // verify state
  const redirect = checkToken(state.toString(), STATE_SECRET);
  if (!state || !redirect) {
    res.send(HttpStatusCode.BAD_REQUEST);
    return;
  }
  // variables
  const client_id = GITHUB_CLIENT_ID;
  const client_secret = GITHUB_CLIENT_SECRET;
  // create uri
  const redirectUri = new URL(redirect.toString());
  // fetch token
  fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({client_id, client_secret, code})
  })
    .then(r => r.json())
    .then(async (accessToken : any) => {
      if (accessToken.error) {
        console.error(accessToken);
        res.sendStatus(HttpStatusCode.UNAUTHORIZED);
        return;
      }
      // update user data
      const user = await loadUserData(accessToken.access_token);
      // update role
      user.role = (user.email !== null && user.email.toString() === SUPER_ADMIN_ID) ? 'super_admin' : user.role;
      // log
      if (user.role === 'super_admin')
        console.log(`${user.name} logged in with super_admin role`);
      // save user
      await authClient.hSet(USER_DB_KEY, user.id.toString(), JSON.stringify(user));
      // create data to store
      const authData = {
        accessToken: accessToken.access_token,
        user: user.id,
      }
      // save access token to database
      const clientKey = v4();
      const clientToken = jwt.sign(clientKey, SESSION_SECRET);
      return authClient.hSet(AUTH_DB_KEY, clientKey, JSON.stringify(authData))
        .then(() => clientToken);
    })
    .then(token => {
      redirectUri.searchParams.set('token', token || '');
      res.redirect(redirectUri.toString());
    })
    .catch(e => {
      console.error(e);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR);
      res.redirect(redirectUri.toString());
    });
}

export const authController = {
  login,
  logout,
  code,
  fakeSession
};
