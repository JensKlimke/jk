import {BsDatabase, BsGear, BsPeopleFill} from "react-icons/bs";
import DatabasePage from "./Database.page";
import UsersPage from "./Users.page";
import ConfigurationPage from "./ConfigurationPage";
import {RouteElement} from "@sdk/dashboard/lib/nav/types";

export const App : RouteElement = {
  name: 'Configuration',
  path: 'configuration',
  icon: <BsGear />,
  element: <ConfigurationPage />,
  children: [
    {
      name: 'Database',
      path: 'database',
      icon: <BsDatabase/>,
      element: <DatabasePage />
    },
    {
      name: 'Users',
      path: 'users',
      icon: <BsPeopleFill/>,
      element: <UsersPage />
    }
  ]
}