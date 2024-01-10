import React, {FormEvent, useCallback, useContext, useEffect, useState} from "react";
import {Alert, Button, Modal, Spinner} from "react-bootstrap";
import {FormProps} from "./form.helpers";


export default function ItemFormModal({children, context, name} : FormProps) {
  // states
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  // context
  const {item, save, erase, edit, update} = useContext(context);
  // callbacks
  const handleClone = useCallback(() => {
    (item !== undefined) && edit('', item);
  }, [item, edit]);
  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    // stop
    e.preventDefault();
    // save
    save()
      .then(() => edit(undefined))
      .catch((e: Error) => setError(e.message))
      .then(() => setPending(false));
  }, [save]);
  useEffect(() => {
    // unset error
    setError(undefined);
  }, [item]);
  // check
  if (!item) return null;
  // render
  return (
    <Modal show={true} onHide={() => edit(undefined)}>
      <Modal.Header closeButton>
        <Modal.Title>{item._id === undefined ? 'Create new' : 'Edit'} {name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {children(item, update, handleSubmit)}
        {error && <Alert variant="danger" onClose={() => setError(undefined)} dismissible>{error}</Alert>}
      </Modal.Body>
      <Modal.Footer className='justify-content-between'>
        <span>
          {item._id !== undefined &&
              <Button className='btn-block ml-1' variant="outline-danger" onClick={erase}>Delete</Button>}
          {item._id === undefined &&
              <span>{name} not saved</span>}
          {item._id !== undefined &&
              <Button className='btn-block ms-2' variant="outline-info" onClick={handleClone}>Clone</Button>}
        </span>
        <span>
          <Button variant="outline-primary" onClick={() => edit(undefined)}>Abort</Button>
          <Button variant="success" type="submit" form='itemForm' className='ms-2' disabled={pending}>
            {!pending ? <span>Save</span> : <Spinner animation='border' size='sm'/>}
          </Button>
        </span>
      </Modal.Footer>
    </Modal>
  );
}
