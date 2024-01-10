import {NavLink} from "react-router-dom";

export default function FinancePage() {
  return (
    <>
      <h1 className="d-flex justify-content-center">Finance</h1>
      <ul>
        <li><NavLink to='/finance/house'>House</NavLink>
          <ul>
            <li><NavLink to='/finance/house/deposits'>Deposits</NavLink></li>
            <li><NavLink to='/finance/house/expenses'>Expenses</NavLink></li>
            <li><NavLink to='/finance/house/invoices'>Invoices</NavLink></li>
            <li><NavLink to='/finance/house/planning'>Planning</NavLink></li>
          </ul>
        </li>
      </ul>
    </>
  );
}