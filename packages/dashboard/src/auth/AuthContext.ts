import {createContext, useContext} from "react";
import {AuthContextType} from "./types";

// the context
export const AuthContext = createContext<AuthContextType>({
  pending: true,
  login: () => {
    throw new Error("Not implemented");
  },
  logout: () => {
    throw new Error("Not implemented");
  },
  renew: () => {
    throw new Error("Not implemented");
  },
  createFakeSession: () => {
    throw new Error("Not implemented");
  }
});

// the hook for the context
export const useAuth = () => useContext(AuthContext);
