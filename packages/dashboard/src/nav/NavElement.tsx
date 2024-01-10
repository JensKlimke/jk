import React from "react";
import {NavLink} from "react-router-dom";
import {LinkType, NavLinkType} from "./types";
import SubMenu from "./SubMenu";
import {useAuth} from "../auth";

function LinkSwitch ({link, children} : {link: LinkType, children: React.ReactNode}) {
  const auth = useAuth();
  return typeof link === 'string' ?
    <NavLink to={`${link}`}>{children}</NavLink> :
    <a role='button' onClick={() => link({auth})}>{children}</a>;
}

export default function NavElement({link, icon, name, elements}: NavLinkType) {
  return (
    <li>
      <LinkSwitch link={link}>
        <span className='icon'>
          {icon}
        </span>
        <span className='text'>
          {name}
        </span>
      </LinkSwitch>
      {elements && (
        <SubMenu elements={elements} />
      )}
    </li>
  )
}