import React from "react";
import moment from "moment";
import {BsRobot} from "react-icons/bs";
import Page404 from "../pages/_defaults/404";
import {AppConfigType} from "@sdk/dashboard/lib/nav/types";

export const AppConfig: AppConfigType = {
  copyright: <span>&copy; 2022-{moment().format('YYYY')} Jens Klimke</span>,
  title: 'RoboControl',
  icon: <BsRobot />,
  page404: <Page404 />,
}