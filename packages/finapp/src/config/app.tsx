import React from "react";
import moment from "moment";
import {
  BsArrowLeftRight,
  BsBank,
  BsCash,
  BsDatabase,
  BsHouse, BsInfoCircle,
  BsPen,
  BsPiggyBank,
  BsSpeedometer2
} from "react-icons/bs";


export const AppConfig = {
  author: <span>&copy; 2022-{moment().format('YYYY')} Jens Klimke</span>,
  title: 'FinApp',
  icon: <BsPiggyBank/>,
  nav: [
    {
      path: '/',
      name: 'Dashboard',
      icon: <BsSpeedometer2/>,
    },
    {
      type: 'horizontal-line'
    },
    {
      path: '/contracts',
      name: 'Contracts',
      icon: <BsPen/>,
    },
    {
      path: '/transfer',
      name: 'Money Transfer',
      icon: <BsArrowLeftRight/>,
    },
    {
      path: '/stocks',
      name: 'Stocks',
      icon: <BsBank/>,
    },
    {
      path: '/assets',
      name: 'Assets',
      icon: <BsCash/>,
    },
    {
      path: '/house',
      name: 'House',
      icon: <BsHouse/>,
    },
    {
      type: 'horizontal-line'
    },
    {
      roles: ['admin', 'super_admin'],
      path: '/database',
      name: 'Database',
      icon: <BsDatabase/>,
    },
    {
      path: '/about',
      name: 'About',
      icon: <BsInfoCircle/>,
    }
  ]
}