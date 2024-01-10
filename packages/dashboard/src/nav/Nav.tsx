import React from "react";
import SubMenu from "./SubMenu";
import {NavSetupType} from "./types";

export default function Nav({config} : {config : NavSetupType[] | undefined}) {
  if (!config) return null;
  // render
  return (
    <div>
      {
        config.map((n, j) => (
          <section key={j}>
            {j > 0 && <hr />}
            <SubMenu elements={n.elements} name={n.name} />
          </section>
        ))
      }
    </div>
  );
}
