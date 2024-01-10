import {Col, Container, ListGroup, Row} from "react-bootstrap";
import React, {useCallback, useMemo} from "react";
import DotsDropdown, {Element} from "./DotsDropdown";
import {BiCopy, BiTrash} from "react-icons/bi";
import {BsPencilSquare} from "react-icons/bs";
import {ItemTypeMapping} from "./items";
import ItemProvider, {ItemContext, ItemType, useItems} from "@sdk/dashboard/lib/item/ItemProvider";
import ItemFormCard from "@sdk/dashboard/lib/item/ItemFormCard";
import ItemForm from "@sdk/dashboard/lib/item/ItemsGenericForm";


const dropdown = (item: ItemType, index: number, deleteItem: (item : ItemType, index : number) => void) : Element[] => ([
  {
    name: <><BsPencilSquare />&nbsp;&nbsp;Edit</>,
    key: 'edit',
    title: 'Edit item',
    onClick: (key: string) => window.alert(key)
  },
  {
    name: <><BiCopy />&nbsp;&nbsp;Clone</>,
    key: 'clone',
    title: 'Clone item',
    onClick: (key: string) => window.alert(key)
  },
  {
    name: <><BiTrash />&nbsp;&nbsp;Delete</>,
    key: 'delete',
    title: 'Delete item',
    onClick: () => {
      if (window.confirm(`Do you really want to delete ${item._id}?`))
        deleteItem(item, index);
    }
  },
])


// (field1 = abc && (field 2 = def || field3 < 100))

type FieldElement = {
  field: string
  value: string | number | boolean
  operator: string
}

type FunctionElement = {
  callback : (item : ItemType) => boolean
}

type Filter = {
  operator: string,
  left: FieldElement | FunctionElement | Filter,
  right: FieldElement | FunctionElement | Filter
}

export default function ItemsPage () {
  return (
    <ItemProvider>
      <ItemsList />
    </ItemProvider>
  )
}

function ItemsList () {
  // data
  const {data: itemData, item, edit, erase} = useItems();
  const items = useMemo(() => {
    return itemData ? itemData.filter(e => e.type !== undefined) : [];
  }, [itemData])
  const deleteItem = useCallback((item : ItemType) => {
    erase();
  }, []);
  // don't show
  if (!itemData) return <></>;
  // render
  return (
    <Container fluid>
      <Row>
        <Col xl={4} lg={8} md={12}>
          {/*<FilterInput items={itemData} setItems={setFilteredItems} />*/}
          {/*<OrderInput items={filteredItems} setItems={setOrderedItems}/>*/}
          {/*<hr />*/}
          {/*<Button onClick={() => generate()}>Generate data</Button>*/}
          {/*<hr />*/}
          <ListGroup as="ol">
            {
              items.map((listItem, index) => (
                <ListGroup.Item
                  active={item && (item._id === listItem._id)}
                  key={index} as="li"
                  role='button'
                  className="d-flex justify-content-between align-items-start"
                  onClick={() => edit(listItem._id)}
                >
                  <div className="mt-2 ms-2 me-3">
                    <h3>
                      { ItemTypeMapping[listItem.type]?.icon || '?'}
                    </h3>
                  </div>
                  <div className="ms-2 me-auto">
                    <div className="fw-bold mb-2">{`${listItem.project}`}</div>
                    {listItem.title}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <DotsDropdown elements={dropdown(listItem, index, deleteItem)} />
                  </div>
                </ListGroup.Item>
              ))
            }
          </ListGroup>
        </Col>
        <Col xl={8} lg={4} md={12}>
          {item ? (
            <ItemFormCard context={ItemContext} name='item'>
              {(item, update, handleSubmit) =>
                <ItemForm item={item} update={update} handleSubmit={handleSubmit}/>
              }
            </ItemFormCard>
          ) : (
            <Container className='text-center'>
              <span className='text-muted fst-italic'>
                Select an item to edit.
              </span>
            </Container>
          )}
        </Col>
      </Row>
    </Container>
  )
}
