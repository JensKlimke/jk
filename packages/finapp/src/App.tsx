import React, {useEffect, useState} from "react";
import {useAuth} from "@sdk/dashboard";
import {Button} from "react-bootstrap";
import {MainNavigation} from "./config/nav";
import "./assets/styles/layout/App.scss"
import {BsList} from "react-icons/bs";
import {usePage} from "@sdk/dashboard/lib/nav/PageContext";
import {NavSetupType} from "@sdk/dashboard/lib/nav/types";
import Nav from "@sdk/dashboard/lib/nav/Nav";

export default function App({children} : {children : React.ReactNode}) {
  // data
  const [topNavOpen, setTopNavOpen] = useState(false);
  const {logout} = useAuth();
  const [navigation, setNavigation] = useState<NavSetupType[]>();
  const page = usePage();
  // effect
  useEffect(() => {
    MainNavigation()
      .then(n => setNavigation(n))
  }, []);
  // render
  return (
    <div className='App'>
      <div className='Main'>
        <div className='Content'>
          {children}
        </div>
        <div className='Footer text-muted'>
          {page.copyright}
        </div>
      </div>
      <div className='Topbar d-flex justify-content-between'>
        <h3 className='Title'>{page.title}</h3>
        {/*{ (session && session.user.avatar) && <Image className='Avatar' src={session.user.avatar} alt='avatar' /> }*/}
        {/* (session && !session.user.avatar) && <h1 className='mt-1'><FaFaceDizzy /></h1> */}
        { logout && <Button variant='link' onClick={() => logout()} className='d-none d-sm-block'>Logout</Button> }
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
        <Nav config={navigation} />
      </div>
      <div className='Sidebar'>
        <div className='Logo'>
          <h1>{page.icon}</h1>
        </div>
        <div className='Logo small'>
          <h3>{page.icon}</h3>
        </div>
        <Nav config={navigation} />
      </div>
    </div>
  )
}