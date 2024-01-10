import {Button, Form, InputGroup} from "react-bootstrap";
import {FaFilter} from "react-icons/fa";
import {BiX} from "react-icons/bi";
import React, {useCallback, useState} from "react";
import {FilterFunction, ItemList} from "./types";

export default function FilterInput({ items, setItems } : { items : ItemList, setItems : (items : ItemList) => void }) {
  // states
  const [error, setError] = useState<string>();
  const [queryText, setQueryText] = useState<string>('');
  // handle submit
  const handleSubmit = useCallback((e : React.FormEvent<HTMLFormElement>, query : string) => {
    // prevent from sending
    e.preventDefault();
    // apply filter
    const fnc : FilterFunction = (item) => eval(query);
    // check if empty
    if (query.trim() === '' || !queryText) {
      setError('Query must not be empty')
      return setItems([...items]);
    }
    // execute
    try {
      setError(undefined);
      setItems(items.filter(fnc))
    } catch {
      setError('Syntax error is filter query');
      return setItems([...items]);
    }
  }, [items, queryText, setItems]);
  const unsetFilter = useCallback(() => {
    setError(undefined);
    setQueryText('');
    setItems(items);
  }, [setItems, items])
  // render
  return (
    <Form onSubmit={e => handleSubmit(e, queryText)}>
      <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
        <Form.Label>Filter query</Form.Label>
        <InputGroup hasValidation>
          <Form.Control
            as="textarea"
            rows={2}
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)} isInvalid={!!error}
          />
          <Button type="submit"><FaFilter /></Button>
          <Button onClick={unsetFilter}><BiX /></Button>
          <Form.Control.Feedback type="invalid">
            { error }
          </Form.Control.Feedback>
        </InputGroup>
      </Form.Group>
    </Form>
  )
}