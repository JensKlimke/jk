import ApiError from "./ApiError";
import jwt from "jsonwebtoken";
import {Request, Response} from "express";
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_TOKEN_URL,
  GITHUB_USER_URL,
  SESSION_SECRET,
} from "../config/env";
import {UserData} from "../types/session";
import {dbItems} from "../middlewares/database";
import {v4} from "uuid";
import HttpStatusCode from "./HttpStatusCode";

export const getUserData = async (accessToken : string): Promise<UserData> => {
  return fetch(GITHUB_USER_URL, {
    headers: {'Authorization': `Bearer ${accessToken}`}
  })
    .then(async r => {
      // check status
      if (r.status !== HttpStatusCode.OK)
        throw new ApiError(HttpStatusCode.NOT_FOUND);
      // return json
      return r.json();
    })
    .then((user : any) => ({
      id: user.id,
      email: user.email,
      avatar: user.avatar_url,
      name: user.name,
      role: ''
    }));
}

export const checkToken = (token: string, secret: string): any | undefined => {
  try {
    return jwt.verify(token, secret);
  } catch (e) {
    return undefined;
  }
}

export const getUserId = (req ?: Request) => {
  return req?.auth?.user?.id || '';
}

export const getUserRole = (req ?: Request) => {
  return req?.auth?.user?.role || 'user';
}

export const getAccessToken = async (code : string) => {
  // create body
  const body = {
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    code
  }
  // fetch token
  return fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body)
  })
    .then(async r => {
      // check status
      if (r.status !== HttpStatusCode.OK)
        throw new ApiError(HttpStatusCode.NOT_FOUND);
      // return json
      return r.json();
    })
    .then((r : any) => r.access_token)
}

export const updateUserData = async (user: UserData, upsert : boolean) => {
  // get client, insert user and update ID
  const result = await dbItems.users.updateOne({email: user.email}, {
    "$set": {...user, fake: true, _updated: new Date()},
    "$setOnInsert": {_created: new Date()}
  }, {upsert});
  // check result and save ID
  let mode : string;
  if (result.upsertedCount) {
    // save user ID
    user.id = result.upsertedId.toString();
    // set mode
    mode = 'inserted';
  } else if (result.matchedCount === 0) {
    // set mode
    mode = 'not_found';
  } else {
    // save mode
    mode = result.modifiedCount === 1 ? mode = 'updated' : '';
    // get existing user and save ID
    const existing = await dbItems.users.findOne({email: user.email});
    user.id = existing._id.toString();
  }
  // return updated user
  return {user, mode};
}

export const getSession = async (clientKey : string) => {
  // get session
  return await dbItems.auth.findOne({clientKey});
}


export const createSession = async (uid : string, accessToken ?: string) => {
  // create data to store
  const authData = {
    accessToken: accessToken || '',
    user: uid,
  }
  // save access token to database
  const clientKey = v4();
  // save session
  await dbItems.auth.insertOne({
    ...authData,
    clientKey,
    fake: accessToken === undefined,
    _created: new Date()
  });
  // return token
  return jwt.sign(clientKey, SESSION_SECRET);
}

export const resolveSession = (res : Response, redirect : string, clientToken : string, userDbMode : string) => {
  if (redirect) {
    // create uri
    const redirectUri = new URL(redirect.toString());
    redirectUri.searchParams.set('token', clientToken);
    // redirect to url
    res.redirect(redirectUri.toString());
  } else {
    // send status
    res.status(HttpStatusCode.OK).send({'token': clientToken, 'user' : userDbMode});
  }
}

export const clearFakeSessions = async (all : boolean = false) => {
  // clear old fake sessions
  const twoWeeksBefore = new Date((new Date().getTime()) - 2 * 7 * 24 * 60 * 60 * 1000);
  // create filter
  const filter : any = {fake: true};
  all || (filter._created = {"$lt": twoWeeksBefore});
  // delete many
  await dbItems.auth.deleteMany(filter);
}