import {CloseButton, Form, InputGroup} from "react-bootstrap";
import React, {useCallback, useState} from "react";
import '@sdk/utils'
import {BiX} from "react-icons/bi";

type InputProps = {
  value: string[]
  onChange: (value : string[]) => void
  placeholder ?: string
}

interface Input {
  position: number
  text: string
  container: any
}

export default function LabelInput({value : tags, onChange, placeholder} : InputProps) {
  const [value, setValue] = useState('');
  const handleKey = useCallback((e : React.KeyboardEvent<any>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addInput();
    }
  }, [value]);
  const addInput = useCallback(() => {
    let t = [...tags];
    t.push(value.trim())
    t = t.map(t => t.trim()).unique(e => e).filter(t => t !== '');
    onChange(t);
    setValue('');
  }, [tags, value]);
  const removeInput = useCallback((position : number) => {
    const t = [...tags];
    t.splice(position, 1);
    onChange(t);
  }, [tags]);
  return (
    <InputGroup>
      {
        tags.map((v, i) => (
          <InputGroup.Text key={v}>
            <span>
              {v}<BiX role='button' onClick={() => removeInput(i)}/>
            </span>
          </InputGroup.Text>
        ))
      }
      <Form.Control
        placeholder={placeholder}
        onKeyDown={(e) => handleKey(e)}
        onBlur={(e) => addInput()}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </InputGroup>
  )
}