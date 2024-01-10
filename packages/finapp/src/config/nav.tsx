import React from "react";
import {BsBoxArrowLeft,} from "react-icons/bs";
import {BiTachometer,} from "react-icons/bi";
import Layout from "../pages/Layout";
import {NavSetupType, RouteElement} from "@sdk/dashboard/lib/nav/types";
import {generateElement} from "@sdk/dashboard/lib/nav/functions";

export async function loadPage(path: string) {
  return (await import(`../pages/${path}`)).App as RouteElement;
}

export const PageStructure = async () : Promise<RouteElement> => ({
  element: <Layout/>,
  path: '',
  name: 'Dashboard',
  icon: <BiTachometer />,
  children: [
    (await loadPage('finance')),
    (await loadPage('automation')),
    (await loadPage('items')),
    (await loadPage('configuration')),
    (await loadPage('about')),
  ]
});

export const MainNavigation = async () : Promise<NavSetupType[]> => PageStructure()
  .then(str => {
    return ([
      {
        elements: [
          generateElement(str, '/', false),
        ],
      },
      {
        name: 'Apps',
        elements: [
          generateElement(str.children?.find(e => e.path === 'finance'), '/'),
          generateElement(str.children?.find(e => e.path === 'automation'), '/'),
          generateElement(str.children?.find(e => e.path === 'items'), '/'),
          generateElement(str.children?.find(e => e.path === 'configuration'), '/'),
        ],
      },
      {
        elements: [
          generateElement(str.children?.find(e => e.path === 'about'), '/'),
          {
            link: ({auth}) => auth.logout(),
            name: 'Logout',
            icon: <BsBoxArrowLeft/>,
          }
        ],
      }
    ])
  });