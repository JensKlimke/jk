import {v4 as uuid} from 'uuid'



export const Library = {
  auth: (user : any) => true
}

export const Auth = {
  me: ''
}

export type Fields = {[key: string] : any}

export type FunctionCondition = (fields : Fields) => boolean

export type Condition = {
  operator: string
  left: FilterDefinition,
  right: FilterDefinition
}

export type FilterDefinition = Condition | FunctionCondition

export type ElementMap = Map<string, FilterDefinition>;

const parseFunctionCondition = (query: string, map ?: ElementMap) => {
  // define regexp
  const regExpFnc = /([a-zA-Z0-9_]+)\(([^)]*)\)/g;
  // parse and iterate results
  let result = [...query.matchAll(regExpFnc)];
  result.map(r => {
    // generate uuid
    const id = uuid();
    // replace id in query
    query = query.replace(r[0], `{${id}}`)
    // save
    map && (map[id] = (fields : Fields) => {})
  });
  // return substituted query
  return query;
}

const parseFieldCondition = (query: string, map ?: ElementMap) => {
  // define regexp
  const regExpField = /([a-zA-Z0-9_]+)\s*(=|<|>|>=|<=|!=)\s*(".+?"|[0-9]+|true|false)/g;
  // parse and iterate results
  const result = [...query.matchAll(regExpField)];
  result.map(r => {
    // generate uuid
    const id = uuid();
    // replace id in query
    query = query.replace(r[0], `{${id}}`)
    // save
    map && (map[id] = (fields : Fields) => {})
  });
  // return substituted query
  return query;
}


const removeUnnecessaryGroups = (query : string) => {
  // define regexp
  const regExpUnnecessaryGroups = /\(\s*({[a-f0-9-]+})\s*\)/g;
  // parse and iterate results
  let hasResult = true;
  while (hasResult) {
    // find groups
    const result = [...query.matchAll(regExpUnnecessaryGroups)];
    result.map(r => {
      // replace id in query
      query = query.replace(r[0], r[1]);
    });
    // check result
    hasResult = (result && result.length > 0);
  }
  // return query
  return query;
}

const parseAnd = (query : string) => {
  // define regexps
  const regExpAnd = /({[a-f0-9-]+})\s*&&\s*({[a-f0-9-]+})/g;
  // find groups
  const result = query.match(regExpAnd);
  if (result) {
    // generate uuid
    const id = uuid();
    // replace id in query
    query = query.replace(result[0], `{${id}}`)
  }
  // return query
  return query;
}


const parseOr = (query : string) =>{
  // define regexps
  const regExpAnd = /({[a-f0-9-]+})\s*\|\|\s*({[a-f0-9-]+})/g;
  // find groups
  const result = query.match(regExpAnd);
  if (result) {
    // generate uuid
    const id = uuid();
    // replace id in query
    query = query.replace(result[0], `{${id}}`)
  }
  // return query
  return query;
}


const parseGroups = (query: string, maxSteps ?: number) => {
  // parse and iterate results
  let hasResult = true;
  let oQuery : string;
  let steps = 0;
  while (hasResult) {
    // unset has result
    hasResult = false;
    // remove unnecessary groups
    query = removeUnnecessaryGroups(query);
    // check steps
    if (maxSteps !== undefined && steps >= maxSteps)
      return query;
    // save old query
    oQuery = `${query}`;
    // check and
    query = parseAnd(query);
    if ((query.localeCompare(oQuery) !== 0))
      hasResult = true;
    // check or
    if (!hasResult) {
      query = parseOr(query);
      if ((query.localeCompare(oQuery) !== 0))
        hasResult = true
    }
    // increment steps
    steps++;
  }
  // return query
  return query;
}

const parseQuery = (query: string) => {
  // parse functions
  query = parseFunctionCondition(query);
  // parse fields
  query = parseFieldCondition(query);
  // parse groups
  query = parseGroups(query);
  // return
  return query;
}


export const Parser = {
  parseFieldCondition,
  parseFunctionCondition,
  removeUnnecessaryGroups,
  parseAnd,
  parseOr,
  parseGroups,
  parseQuery
}