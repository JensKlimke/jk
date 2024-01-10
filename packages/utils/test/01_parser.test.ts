import {Auth, FilterDefinition, Library, Parser} from "../src";

const query1 = '( field1 = "abc" && (field_2 = "def" || field3 < 100)) || (auth(<me>) )';

const filter: FilterDefinition = {
  operator: 'or',
  left: {
    operator: 'and',
    left: (fields) => (fields['field1'] === 'abc'),
    right: {
      operator: 'and',
      left: (fields) => (fields['field2'] === 'def'),
      right: (fields) => (fields['field3'] < 100),
    },
  },
  right: () => Library.auth(Auth.me)
}

const regExpCode = /^{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}$/;
const regExpAnd = /^{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}} && {[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}$/;
const sampleCode = '{634036fe-4f94-40ea-83e8-6f424108392e}';

test('parse fields', () => {
  // parse fields
  expect(Parser.parseFieldCondition('field1 = "abc"')).toMatch(regExpCode)
  expect(Parser.parseFieldCondition('field1 = "abc" && field2 = "def"')).toMatch(regExpAnd)
});

test('parse function', () => {
  // parse function
  expect(Parser.parseFunctionCondition('auth()')).toMatch(regExpCode)
  expect(Parser.parseFunctionCondition('auth(<me>)')).toMatch(regExpCode)
  expect(Parser.parseFunctionCondition('auth(<me>, "abc")')).toMatch(regExpCode)
  expect(Parser.parseFunctionCondition('auth(<me>) && test()')).toMatch(regExpAnd)
  // parse combination of fields and function
  expect(Parser.parseFunctionCondition(Parser.parseFieldCondition('field1 = "abc" && auth(<me>)'))).toMatch(regExpAnd)
});

test('remove unnecessary groups ', () => {
  // remove unnecessary groups
  expect(Parser.removeUnnecessaryGroups(`${sampleCode}`)).toEqual(sampleCode)
  expect(Parser.removeUnnecessaryGroups(`(${sampleCode})`)).toEqual(sampleCode)
  expect(Parser.removeUnnecessaryGroups(`((${sampleCode}))`)).toEqual(sampleCode)
  expect(Parser.removeUnnecessaryGroups(`(${sampleCode}) && (${sampleCode})`)).toMatch(/{[0-9a-f-]+}\s*&&\s*{[0-9a-f-]+}/)
})

test('parse ands', () => {
  // parse and
  expect(Parser.parseAnd(`${sampleCode} && ${sampleCode}`)).toMatch(regExpCode)
  expect(Parser.parseAnd(`${sampleCode} && ${sampleCode} && ${sampleCode}`)).toMatch(/{[0-9a-f-]+}\s*&&\s*{[0-9a-f-]+}/)
})

test('parse ors', () => {
  // parse or
  expect(Parser.parseOr(`${sampleCode} || ${sampleCode}`)).toMatch(regExpCode)
  expect(Parser.parseOr(`${sampleCode} || ${sampleCode} || ${sampleCode}`)).toMatch(/{[0-9a-f-]+}\s*\|\|\s*{[0-9a-f-]+}/)
})

test('parse groups', () => {
  // // parse groups
  expect(Parser.parseGroups(`(${sampleCode})`)).toEqual(sampleCode)
  expect(Parser.parseGroups(`(${sampleCode} && ${sampleCode})`)).toMatch(regExpCode)
  expect(Parser.parseGroups(`(${sampleCode} && ${sampleCode} || ${sampleCode})`, 1)).toMatch(/{[0-9a-f-]+}\s*\|\|\s*{[0-9a-f-]+}/)
  expect(Parser.parseGroups(`(${sampleCode} && (${sampleCode} || ${sampleCode}))`, 1)).toMatch(/{[0-9a-f-]+}\s*&&\s*{[0-9a-f-]+}/)
  expect(Parser.parseGroups(`(${sampleCode} && (${sampleCode} || ${sampleCode}))`)).toMatch(regExpCode)
});

test('parse query', () => {
  // parse groups
  expect(Parser.parseQuery(`${query1}`)).toMatch(regExpCode)
});