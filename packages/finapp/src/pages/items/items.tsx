import React from "react";
import {BiBulb} from "react-icons/bi";
import {BsCheck2Square, BsPerson} from "react-icons/bs";
import {ItemIconType} from "./types";

export const ItemTypeMapping : {[key: string] : ItemIconType} = {
  requirement: {
    icon: <BiBulb />,
    name: 'Requirement'
  },
  test_case: {
    icon: <BsCheck2Square />,
    name: 'Test case'
  },
  user: {
    icon: <BsPerson />,
    name: 'User'
  }
}