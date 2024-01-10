import React, {createContext, useContext} from "react";
import {defaultContext, ItemContextType, ItemWithId, GenericItemProvider} from "./item.context";


export type ItemType = ItemWithId & {
  project       : string
  type          : string
  title         : string
  description  ?: string
  labels        : string[]
  rank          : number
  creator       : string
  links         : { item: string, type: string }[]
  tags          : { [key: string] : string }
  fields        : { [key: string] : any }
}

export const defaultItem = () => ({
  project : '',
  type    : '',
  title   : '',
  labels  : [],
  rank    : 0,
  creator : '',
  links   : [],
  tags    : {},
  fields  : {}
});

export const cleanItemCopy = (item: ItemType): ItemType => ({
  project : item.project,
  type    : item.type,
  title   : item.title,
  labels  : item.labels,
  rank    : item.rank,
  creator : item.creator,
  links   : item.links,
  tags    : item.tags,
  fields  : item.fields
})

export const ItemContext = createContext<ItemContextType<ItemType>>(defaultContext);
export const useItems = () => useContext(ItemContext);

const ItemProvider = GenericItemProvider<ItemType>('items',
  cleanItemCopy,
  defaultItem,
  (context: ItemContextType<ItemType>, children: React.ReactNode) => (
    <ItemContext.Provider value={context}>
      {children}
    </ItemContext.Provider>
  ), undefined);

export default ItemProvider;
