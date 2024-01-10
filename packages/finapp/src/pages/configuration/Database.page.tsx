import React, {useMemo} from "react";
import {useApiData} from "@sdk/dashboard";
import {Accordion} from "react-bootstrap";

export default function DatabasePage() {
  // get data from api
  const data = useApiData<string[]>(`/database/keys`);
  // check data
  if (data === undefined)
    return null;
  // render
  return (
    <Accordion>
      {data.map(d => (
        <Accordion.Item eventKey={d} key={d}>
          <Accordion.Header>{d}</Accordion.Header>
          <Accordion.Body>
            <DatabaseEntry entryKey={d}/>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

export function DatabaseEntry({entryKey}: { entryKey: string }) {
  // get data from api
  const params = useMemo(() => ({key: entryKey}), [entryKey])
  const entries = useApiData<string[]>(`/database/entries`, params);
  // check data
  if (entries === undefined)
    return null;
  // render
  return (
    <ul>
      {Object.entries(entries).map(([id, data]) => (
        <li key={id}>
          <code>{id}</code>:&nbsp;
          <code>{data}</code>
        </li>
      ))}
    </ul>
  );
}