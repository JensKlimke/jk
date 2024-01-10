import {Auth, AuthProvider} from "@sdk/dashboard";
import App from "../App";
import {Outlet} from "react-router-dom";
import React from "react";
import {AppConfig} from "../config/app";
import PageProvider from "@sdk/dashboard/lib/nav/PageProvider";

export default function Layout () {
  return (
    <PageProvider config={AppConfig}>
      <AuthProvider>
        <Auth>
          <App>
            <Outlet />
          </App>
        </Auth>
      </AuthProvider>
    </PageProvider>
  )
}