import React from "react";
import {ItemType} from "@sdk/dashboard/lib/item/ItemProvider";

export type ItemIconType = {
  icon: React.ReactNode,
  name: string
}

export type FilterFunction = (e : ItemType) => boolean

export type OrderFunction = (a : ItemType, b : ItemType) => number

export type ItemList = ItemType[];
