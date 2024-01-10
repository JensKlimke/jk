import React from "react";
import {AuthContextType} from "../auth/types";

export type RouteElement = {
  path : string
  name : string
  icon ?: React.ReactNode
  element ?: React.ReactNode
  children ?: RouteElement[]
}

export type AppConfigType = {
  copyright : React.ReactNode | string
  title : string
  icon : React.ReactNode
  page404 : React.ReactNode
}

export type LinkType = string | (({auth} : {auth : AuthContextType}) => void);

export type NavLinkType = {
  link : LinkType,
  name : string
  icon : React.ReactNode,
  elements ?: NavLinkType[]
}

export type NavSetupType = {
  name ?: string,
  elements : NavLinkType[]
};
