import {BsBank, BsHouse, BsPiggyBank} from "react-icons/bs";
import FinancePage from "./Finance.page";
import DepositsPage from "./house/Deposits.page";
import {BiCertification, BiChart, BiMoney, BiReceipt, BiTransfer} from "react-icons/bi";
import ExpensesPage from "./house/Expenses.page";
import {PiHandCoins} from "react-icons/pi";
import InvoicesPage from "./house/Invoices.page";
import PlanningPage from "./house/Planning.page";
import React from "react";
import ContractsPage from "./contracts/ContractsPage";
import {GiContract} from "react-icons/gi";
import {RouteElement} from "@sdk/dashboard/lib/nav/types";

export const App : RouteElement = {
  name: 'Finance',
  path: 'finance',
  icon: <BsPiggyBank />,
  element: <FinancePage />,
  children: [
    {
      path: 'contracts',
      name: 'Contracts',
      element: <ContractsPage/>,
      icon: <GiContract/>,
    },
    {
      path: 'transfer',
      name: 'Transfer',
      element: <span>Transfers</span>,
      icon: <BiTransfer/>,
    },
    {
      path: 'stocks',
      name: 'Stocks',
      element: <span>Stocks</span>,
      icon: <BsBank/>,
    },
    {
      path: 'assets',
      name: 'Assets',
      element: <span>Assets</span>,
      icon: <BiCertification/>,
    },
    {
      path: 'house',
      name: 'House',
      icon: <BsHouse/>,
      children: [
        {
          path: 'deposits',
          name: 'Deposits',
          element: <DepositsPage/>,
          icon: <BiMoney/>
        },
        {
          path: 'expenses',
          name: 'Expenses',
          element: <ExpensesPage/>,
          icon: <PiHandCoins/>
        },
        {
          path: 'invoices',
          name: 'Invoices',
          element: <InvoicesPage/>,
          icon: <BiReceipt/>
        },
        {
          path: 'planning',
          name: 'Panning',
          element: <PlanningPage/>,
          icon: <BiChart/>
        }
      ]
    }
  ]
}