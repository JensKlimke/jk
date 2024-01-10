import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import {TbDots} from "react-icons/tb";

const ToggleElement = React.forwardRef<HTMLSpanElement>(({ onClick } : any , ref) => (
  <span
    role='button'
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    <TbDots />
  </span>
));

export type Element = {
  name : string | React.ReactNode
  key : string
  title ?: string
  onClick : (key: string) => void
}

const DotsDropdown = ({ elements } : { elements : Element[] } ) => {

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <Dropdown show={isOpen} onToggle={handleToggle}>
      <Dropdown.Toggle as={ToggleElement} />
      <Dropdown.Menu>
        {
          elements.map(({key, name, title, onClick}) => (
            <Dropdown.Item
              key={key}
              onClick={() => onClick(key)}
              title={title}
            >
              {name}
            </Dropdown.Item>
          ))
        }
      </Dropdown.Menu>
    </Dropdown>
  );

};

export default DotsDropdown;