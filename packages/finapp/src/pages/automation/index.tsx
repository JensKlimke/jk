import {RouteElement} from "@sdk/dashboard/lib/nav/types";
import AutomationPage from "./Automation.page";
import {BsRobot} from "react-icons/bs";

export const App : RouteElement = {
  name: 'Automation',
  path: 'automation',
  icon: <BsRobot />,
  element: <AutomationPage />,
}