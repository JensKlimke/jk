import React, {FormEvent} from "react";
import {Form, InputGroup} from "react-bootstrap";
import {ItemType} from "./ItemProvider";
import {UpdateCallbackType} from "./item.context";
import LabelInput from "../components/LabelInput";
import {BiX} from "react-icons/bi";

export default function ItemForm({item, handleSubmit, update}: {
  item: ItemType,
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void,
  update: UpdateCallbackType<ItemType>
}) {
  return (
    <Form onSubmit={(e) => handleSubmit(e)} id='itemForm' method='post'>
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          autoFocus
          value={item.title}
          onChange={(e) => update('title', e.target.value)}
          type="text"
          placeholder="My Item"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <InputGroup>
          <InputGroup.Checkbox
            checked={item.description !== undefined}
            onChange={(e) => update('description', e.target.checked ? '' : undefined)}
          />
          <Form.Control
            disabled={item.description === undefined}
            value={item.description || ''}
            onChange={(e) => update('description', e.target.value)}
            as="textarea"
            placeholder="Description"
          />
        </InputGroup>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Type</Form.Label>
        <Form.Control
          value={item.type}
          onChange={(e) => update('type', e.target.value)}
          type="text"
          placeholder="Type"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Labels</Form.Label>
        <LabelInput
          value={item.labels}
          onChange={(tags) => update('labels', tags)}
          placeholder="Labels (comma separated)"
        />
      </Form.Group>
    </Form>
  )
}

