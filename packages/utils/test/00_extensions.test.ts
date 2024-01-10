import '../src'

test('array unique', () => {
  expect([1, 2, undefined, null, 0, false, 'a', 3, {a: 'a'}].unique()).toEqual([1, 2, undefined, null, 0, false, 'a', 3, {a: 'a'}]);
  expect([1, 2, undefined, null, 0, false, 'a', 3, {a: 'a'}].unique(e => !!e)).toEqual([1, undefined]);
  expect([1, 2, 1, 2].unique()).toEqual([1, 2]);
  expect(['a', 'b', 'a', 'b'].unique()).toEqual(['a', 'b']);
});

test('array add uniquely basic', () => {
  expect([1, 2, 3].addManyUniquely([1, 2, 4])).toEqual([1, 2, 3, 4]);
});

test('array add uniquely complex', () => {
  // create object
  const a = {no: 0, str: 'A'};
  const b = {no: 1, str: 'B'};
  const c = {no: 2, str: 'C'};
  const d = {no: 1, str: 'D'};
  // do not replace, when found
  expect([a, b, c]
    .addManyUniquely([d], (a, b) => a.no === b.no)
    .map((e: { str: any; }) => e.str))
    .toEqual(['A', 'B', 'C']);
  // replace when found
  expect([a, b, c]
    .addManyUniquely([d], (a, b) => a.no === b.no, true)
    .map((e: { str: any; }) => e.str))
    .toEqual(['A', 'D', 'C']);
});

test('array add uniquely complex', () => {
  // create object
  const a = {no: 0, str: 'A'};
  const b = {no: 1, str: 'B'};
  const c = {no: 2, str: 'C'};
  const d = {no: 1, str: 'D'};
  // do not replace, when found
  expect([a, b, c]
    .addUniquely(d, (a, b) => a.no === b.no)
    .map((e: { str: any; }) => e.str))
    .toEqual(['A', 'B', 'C']);
  // replace when found
  expect([a, b, c]
    .addUniquely(d, (a, b) => a.no === b.no, true)
    .map((e: { str: any; }) => e.str))
    .toEqual(['A', 'D', 'C']);
});

test('array filter by defined', () => {
  expect([1, 2, undefined, 'a', 3].defined()).toEqual([1, 2, 'a', 3]);
  expect([true, 0, false, undefined, null].defined()).toEqual([true, 0, false, null]);
  expect([true, 0, false, undefined, null].defined(e => !!e)).toEqual([true]);
  expect([0, 1, 2, 3, 4].defined(e => e < 3)).toEqual([0, 1, 2]);
});


test('remove from array', () => {
  // 1. create array and update
  const array1 = [1, 2, 3, 2, 3];
  array1.remove(e => e === 2);
  // check
  expect(array1).toEqual([1, 3, 3]);
  // 2. create empty array and try to update
  const array2 : number[] = [];
  array2.remove(e => e === 2);
  // check
  expect(array2).toEqual([]);
  // 3. create empty array and try to update
  const array3 = [{a : 1, b : 2}, {a : 2, b : 2}, {a : 1, b : 2}];
  array3.remove(e => (e.a === 1 && e.b === 2));
  // check
  expect(array3).toEqual([{a : 2, b : 2}]);
});


test('array intersection', () => {
  expect([1, 2, 3].intersection([1, 2, 4])).toEqual([1, 2]);
  expect([1, 2, 3].intersection([4, 5, 6])).toEqual([]);
  expect([1, 2, 3].intersection([])).toEqual([]);
  expect(([] as number[]).intersection([4, 5, 6])).toEqual([]);
});


test('cumulated sum', () => {
  expect([1, 2, 3, 4, 5].cumsum(10)).toBe(25);
  expect([].cumsum(0)).toBe(0);
  expect([].cumsum(10)).toBe(10);
  expect([1, 2, 3].cumsum()).toBe(6);
});

test('cumulated product', () => {
  expect([1, 2, 3, 4, 5].cumprod(10)).toBe(1200);
  expect([1, 2, 3, 4, 5].cumprod(0)).toBe(0);
  expect([].cumprod(0)).toBe(0);
  expect([].cumprod(10)).toBe(10);
  expect([1, 2, 3].cumprod()).toBe(6);
});