import NavElement from "./NavElement";
import {NavLinkType, NavSetupType} from "./types";

export default function SubMenu ({name, elements} : {name ?: string, elements : NavLinkType[]}) {
  return (
    <ul className='Nav'>
      <>
        {name && <h1>{name}</h1>}
        {elements.map((e, i) => (
          <NavElement key={i} {...e} />
        ))}
      </>
    </ul>
  );
}