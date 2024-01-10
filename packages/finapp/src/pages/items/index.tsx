import React from "react";
import ItemsPage from "./Items.page";
import {RouteElement} from "@sdk/dashboard/lib/nav/types";
import {BiBug} from "react-icons/bi";

export const App :  RouteElement = {
  path: 'items',
  name: 'Items',
  element: <ItemsPage />,
  icon: <BiBug />
}