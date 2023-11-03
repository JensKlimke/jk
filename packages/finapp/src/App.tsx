import React, {useState} from "react";
import {useAuth} from "@sdk/dashboard";
import {Button} from "react-bootstrap";
import {BsList} from "react-icons/bs";
import "./assets/styles/layout/App.scss"
import {AppConfig} from "./config/app";
import Nav from "./Nav";

export default function App({children} : {children : React.ReactNode}) {
  // data
  const [topNavOpen, setTopNavOpen] = useState(false);
  const {logout, session} = useAuth();
  // render
  return (
    <div className='App'>
      <div className='Main'>
        <div className='Content'>
          {children}
        </div>
        <div className='Footer text-muted'>
          {AppConfig.author}
        </div>
      </div>
      <div className='Topbar d-flex justify-content-between'>
        <h3 className='Title'>{AppConfig.title}</h3>
        {logout && <Button variant='link' onClick={() => logout()} className='d-none d-sm-block'>Logout</Button>}
        <div className='d-inline-block d-sm-none float-right'>
          <Button
            className='toggle-button'
            variant='outline-secondary'
            onClick={() => setTopNavOpen(!topNavOpen)}
          >
            <BsList/>
          </Button>
        </div>
      </div>
      <div className={`TopNav d-${topNavOpen ? 'block' : 'none'}`}>
        <hr/>
        <Nav/>
      </div>
      <div className='Sidebar'>
        <div className='Logo'>
          <h1>{AppConfig.icon}</h1>
        </div>
        <div className='Logo small'>
          <h3>{AppConfig.icon}</h3>
        </div>
        <Nav/>
      </div>
    </div>
  )
}