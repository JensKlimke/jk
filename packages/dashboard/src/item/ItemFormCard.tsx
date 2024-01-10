import React, {FormEvent, useCallback, useContext, useEffect, useState} from "react";
import {Alert, Button, Card, Modal, Spinner} from "react-bootstrap";
import {FormProps} from "./form.helpers";


export default function ItemFormCard({children, context, name} : FormProps) {
  // states
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  // context
  const {item, save, update} = useContext(context);
  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    // stop
    e.preventDefault();
    // save
    save()
      .catch((e: Error) => setError(e.message))
      .then(() => setPending(false))
      .then(() => alert('Saved'))
  }, [save]);
  useEffect(() => {
    // unset error
    setError(undefined);
  }, [item]);
  // check
  if (!item) return null;
  // render
  return (
    <Card>
      <Card.Header>
        <Modal.Title>{item._id === undefined ? 'Create new' : 'Edit'} {name}{item._id === undefined ? '' : ` #${item._id}`}</Modal.Title>
      </Card.Header>
      <Card.Body>
        {children(item, update, handleSubmit)}
        {error && <Alert variant="danger" onClose={() => setError(undefined)} dismissible>{error}</Alert>}
        {item._id === undefined && <Alert variant="info">{name} is not saved.</Alert>}
      </Card.Body>
      <Card.Footer>
        <Button variant="success" type="submit" form='itemForm' className='ms-2' disabled={pending}>
          {!pending ? <span>Save</span> : <Spinner animation='border' size='sm'/>}
        </Button>
      </Card.Footer>
    </Card>
  );
}
