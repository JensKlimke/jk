import {useMemo} from "react";
import {useApiData} from "@sdk/dashboard";

export default function DatabasePage() {
  // get data from api
  const data = useApiData<string[]>(`/database/keys`);
  // check data
  if (data === undefined)
    return null;
  // render
  return (
    <ul>
      {data.map(d => (
        <li key={d}>
          <span>{d}</span>
          <DatabaseEntry entryKey={d}/>
        </li>
      ))}
    </ul>
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