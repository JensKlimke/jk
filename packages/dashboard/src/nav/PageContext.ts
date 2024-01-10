import {ReactNode} from "react";
import {createContext, useContext} from "react";

export type PageContextType = {
  title : string,
  icon ?: ReactNode,
  copyright ?: ReactNode,
  setTitle : (t : string) => void
}

// the context
export const PageContext = createContext<PageContextType>({
  title: "",
  setTitle : () => { },
});

// the hook for the context
export const usePage = () => useContext(PageContext);


