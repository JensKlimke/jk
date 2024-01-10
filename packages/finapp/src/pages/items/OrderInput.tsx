import {useEffect, useState} from "react";
import {ItemList} from "./types";
import {ItemType} from "@sdk/dashboard/lib/item/ItemProvider";

enum Direction {
  ASC,
  DESC
}

type OrderType = {
  direction: Direction,
  fnc: (a : ItemType, b : ItemType) => number
}

export default function OrderInput ({ items, setItems } : { items : ItemList, setItems : (items : ItemList) => void }) {
  const [order, setOrder] = useState<OrderType[]>()
  useEffect(() => {
    let list: ItemType[] = [...items];
    order && (list = order.reduce((p, o) => {
      return p.sort((a, b) => o.direction === Direction.ASC ? o.fnc(a, b) : o.fnc(a, b));
    }, list));
    // return list
    setItems(list);
  }, [items, setItems]);

  return (
    <></>
  )
}