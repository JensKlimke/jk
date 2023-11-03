import React from "react";
import {NavLink} from "react-router-dom";
import {
  BsArrowLeftRight,
  BsBank,
  BsBoxArrowLeft,
  BsCash,
  BsDatabase,
  BsHouse,
  BsInfoCircle,
  BsPen,
  BsSpeedometer2
} from "react-icons/bs";
import {useAuth} from "@sdk/dashboard";


export default function Nav() {
  // get callbacks
  const {session, logout} = useAuth();
  // render
  return (
    <>
      <ul className='Nav'>
        <NavLink to='/'>
          <li>
            <span className='icon'>
              <BsSpeedometer2/>
            </span>
            <span className='text'>
              Dashboard
            </span>
          </li>
        </NavLink>
      </ul>
      <hr/>
      <ul className='Nav'>
        <h1>Finance</h1>
        <NavLink to='/contracts'>
          <li>
            <span className='icon'>
              <BsPen/>
            </span>
            <span className='text'>
              Contracts
            </span>
          </li>
        </NavLink>
        <NavLink to='/transfer'>
          <li>
            <span className='icon'>
              <BsArrowLeftRight/>
            </span>
            <span className='text'>
              Money Transfer
            </span>
          </li>
        </NavLink>
        <NavLink to='/stocks'>
          <li>
            <span className='icon'>
              <BsBank/>
            </span>
            <span className='text'>
              Stocks
            </span>
          </li>
        </NavLink>
        <NavLink to='/assets'>
          <li>
            <span className='icon'>
              <BsCash/>
            </span>
            <span className='text'>
              Assets
            </span>
          </li>
        </NavLink>
        <NavLink to='/house'>
          <li>
            <span className='icon'>
              <BsHouse/>
            </span>
            <span className='text'>
              House
            </span>
          </li>
        </NavLink>
      </ul>
      <hr/>
      <ul className='Nav'>
        {
          (session?.user.role === 'admin' || session?.user.role === 'super_admin') && (
            <NavLink to='/database'>
              <li>
                <span className='icon'>
                  <BsDatabase/>
                </span>
                <span className='text'>
                  Database
                </span>
              </li>
            </NavLink>
          )
        }
        <NavLink to='/about'>
          <li>
            <span className='icon'>
              <BsInfoCircle/>
            </span>
            <span className='text'>
              About
            </span>
          </li>
        </NavLink>
        <span role='button' onClick={() => (logout && logout())} className='d-block d-sm-none'>
          <li>
            <span className='icon'>
              <BsBoxArrowLeft/>
            </span>
            <span className='text'>
              Logout
            </span>
          </li>
        </span>
      </ul>
    </>
  )
}
