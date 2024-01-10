import React, {useState} from "react";
import {PageContext, PageContextType} from "./PageContext";
import {AppConfigType} from "./types";

export default function PageProvider({children, config}: { children: React.ReactNode, config: AppConfigType }) {
  // states
  const [title, setTitle] = useState(config.title);
  const [icon] = useState(config.icon);
  const [copyright] = useState(config.copyright);
  // generate values
  const values : PageContextType = {
    title,
    setTitle : (t) => setTitle(t),
    icon,
    copyright,
  }
  // render
  return (
    <PageContext.Provider value={values}>
      {children}
    </PageContext.Provider>
  );
}