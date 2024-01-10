import {RouteElement} from "@sdk/dashboard/lib/nav/types";
import {BsInfoCircle} from "react-icons/bs";
import AboutPage from "./About.page";

export const App : RouteElement = {
  path: 'about',
  name: 'About',
  element: <AboutPage/>,
  icon: <BsInfoCircle/>
}