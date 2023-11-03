import React, {useCallback} from "react";
import {useAuth} from "./AuthContext";
import {API_URL, apiUrl, useApiData} from "../api";
import LoginWindow from "./LoginWindow";

export const ENV = process.env.REACT_APP_ENV || 'prod';

export function Auth({children}: { children: React.ReactNode }) {
  // hooks
  const {pending, session, login, createFakeSession} = useAuth();
  const data = useApiData<string>(`${API_URL}/whois`);
  // login callback
  const handleLogin = useCallback((type : string) => (type === 'github') ? login() : createFakeSession(type), [login]);
  // don't render if not logged in
  if (pending && !session)
    return <div className="d-flex align-items-center justify-content-center text-muted vh-100">Loading session&hellip;</div>
  else if (!pending && session)
    return <>{children}</>;
  else
    return <LoginWindow login={handleLogin} apiInfo={data} />;
}


export const withAuth = (element: React.ReactNode) => {
  return (
    <Auth>
      {element}
    </Auth>
  );
}
