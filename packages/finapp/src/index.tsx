import "./assets/styles/bootstrap.min.css"
import "./assets/styles/index.scss"
import React from 'react';
import ReactDOM from 'react-dom/client';
import {Auth, AuthProvider, ErrorBoundary, withAuth} from "@sdk/dashboard";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import App from "./App";
import Page404 from "./pages/_defaults/404";
import DatabasePage from "./pages/database/Database.page";
import AboutPage from "./pages/about/About.page";
import ContractsPage from "./pages/contracts/ContractsPage";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const withAuthApp = (element: React.ReactNode) => withAuth(<App>{element}</App>);

root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path='/' element={withAuth(<App>Dashboard</App>)} />
          <Route path='/contracts' element={withAuthApp(<ContractsPage />)} />
          <Route path='/transfer' element={withAuth(<App>Transfer</App>)} />
          <Route path='/stocks' element={withAuth(<App>Stocks</App>)} />
          <Route path='/assets' element={withAuth(<App>Assets</App>)} />
          <Route path='/house' element={withAuth(<App>House</App>)} />
          <Route path='/database' element={withAuthApp(<DatabasePage />)} />
          <Route path='/about' element={withAuthApp(<AboutPage />)} />
          <Route path='*' element={<Page404 />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);