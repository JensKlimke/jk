import React, {useCallback, useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import {AuthContextType, SessionType} from "./types";
import {AuthContext} from "./AuthContext";
import {logger} from "@sdk/logger";
import {apiUrl} from "../api";

// TODO: session with atomWithStorage

export const SESSION_STORAGE_KEY = process.env.REACT_APP_SESSION_STORAGE_KEY || 'token';

const sessionPromise = () =>
  new Promise<SessionType | undefined>((resolve, reject) => {
    // get refresh token
    const token = secureLocalStorage.getItem(SESSION_STORAGE_KEY);
    // check session
    if (!token || typeof token !== 'string') return resolve(undefined);
    // call API
    fetch(apiUrl('/user'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
      .then(r => r.json())
      .then(user => {
        resolve({user, token})
      })
      .catch(e => {
        logger.error(e);
        reject('Unknown error');
      })
  });


export function AuthProvider({children}: { children: React.ReactNode }) {
  // states
  const [pending, setPending] = useState<boolean>(true);
  const [session, setSession] = useState<SessionType>();
  // router
  let navigate = useNavigate();
  let location = useLocation();
  // generate login url
  const login = useCallback(() => {
    // create url
    const url = apiUrl('/auth/login');
    url.searchParams.set('redirect', window.location.href);
    // forward
    window.location.href = url.toString();
    // log
    logger.info('auth:login', 'Request login');
  }, []);
  // generate login url
  const createFakeSession = useCallback((type: string) => {
    // create url
    const url = apiUrl('/auth/fake');
    url.searchParams.set('type', type);
    url.searchParams.set('redirect', window.location.href);
    // forward
    window.location.href = url.toString();
    // log
    logger.info('auth:createFakeSession', 'Request fake session');
  }, []);
  // logout callback
  const logout = useCallback(() => {
    // delete session
    secureLocalStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(undefined);
    // log
    logger.info('auth:logout', 'logout session for user ' + session?.user.name);
  }, [session?.user.name]);
  // renew
  const renew = useCallback(() => {
    // get session data
    sessionPromise()
      .then(session => {
        setSession(session);
        !session && logger.info('auth:renew', 'no session set');
        session && logger.info('auth:renew', 'session renewed for ' + session?.user.name);
      })
      .catch(e => logger.error('auth:renew', e))
      .then(() => setPending(false))
  }, []);
  // check token
  useEffect(() => {
    // create url, get and remove token
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    // check token
    if (token) {
      // save session and redirect
      secureLocalStorage.setItem(SESSION_STORAGE_KEY, token);
      navigate(location.pathname);
    }
  }, [location.pathname, navigate, renew]);
  useEffect(() => {
    // renew session
    renew();
  }, [renew]);
  // context object
  const context: AuthContextType = {
    session,
    pending,
    login,
    logout,
    renew,
    createFakeSession
  };
  // render
  return (
    <AuthContext.Provider value={context}>
      {children}
    </AuthContext.Provider>
  );
}
