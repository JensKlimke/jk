import "bootswatch/dist/slate/bootstrap.min.css"
import "./assets/styles/index.scss"
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {ErrorBoundary} from "@sdk/dashboard";
import {PageStructure} from "./config/nav";
import {RouteElement} from "@sdk/dashboard/lib/nav/types";
import '@sdk/utils'

function Application() {
  // state for structure
  const [structure, setStructure] = useState<RouteElement>();
  // load structure
  useEffect(() => {
    PageStructure().then(str => setStructure(str))
  }, []);
  // only render with structure set
  if (!structure) return null;
  // render
  return (
    <ErrorBoundary>
      <RouterProvider router={createBrowserRouter([structure])} />
    </ErrorBoundary>
  )
}

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(<Application />);