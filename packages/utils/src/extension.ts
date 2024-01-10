
declare global {
  interface Array<T> {
    unique(predicate ?: (e : T) => any): Array<T>;
    addManyUniquely(elements : T[], compare ?: (a : T, b : T) => boolean, replace ?: boolean) : Array<T>;
    addUniquely(element : T, compare ?: (a : T, b : T) => boolean, replace ?: boolean) : Array<T>;
    intersection(set : T[]) : Array<T>
    defined(predicate ?: (e : T) => boolean) : Array<T>
    remove(predicate : (e : T) => boolean) : void
    cumsum(initial ?: number) : number
    cumprod(initial ?: number) : number
  }

  interface Number {
    pad(size : number) : string
  }
}

Array.prototype.unique = function (predicate) {
  return this.filter((v, i, a) => predicate
    ? a.findIndex(e => (predicate(e) === predicate(v))) === i
    : (a.indexOf(v) === i));
}


Array.prototype.addManyUniquely = function (elements, compare, replace = false){
  const newArray = [...this];
  elements.forEach(eNew => {
    const idx = this.findIndex((eOld: any) => compare ? compare(eOld, eNew) : (eNew === eOld));
    if (idx !== -1 && replace)
      newArray[idx] = eNew;
    else if (idx === -1)
      newArray.push(eNew);
  });
  return newArray;
}

Array.prototype.addUniquely = function (element, compare, replace = false){
  const newArray = [...this];
  const idx = this.findIndex((eOld: any) => compare ? compare(eOld, element) : (element === eOld));
  if (idx !== -1 && replace)
    newArray[idx] = element;
  else if (idx === -1)
    newArray.push(element);
  return newArray;
}


/**
 * Finds the intersecting elements
 * TODO: predicate function
 * @param set Intersecting set
 */
Array.prototype.intersection = function (set) {
  return this.map(e1 => set.find(e2 => e1 === e2))
    .filter(e => e !== undefined);
}


/**
 * Returns all defined elements
 * @param predicate Optional callback to calculate if defined/undefined
 */
Array.prototype.defined = function (predicate) {
  return this.filter(elem => predicate ? (predicate(elem)) : elem !== undefined);
}


/**
 * Removes the elements which are true by the predicate function
 * @param predicate Function to evaluate the elements
 */
Array.prototype.remove = function (predicate) {
  // init indexes
  const indexes : number[] = [];
  // iterate over elements and save indexes to remove
  this.forEach((e, i) => predicate(e) && indexes.push(i));
  // iterate over indexes
  indexes.forEach((i, j) => this.splice(i - j, 1));
}


/**
 * Cumulates the elements by its sum
 * @param initial Initial value
 */
Array.prototype.cumsum = function (initial ?: number){
  return this.reduce((p, c) => p + c, initial || 0);
}


/**
 * Cumulates the elements by its product
 * @param initial Initial value
 */
Array.prototype.cumprod = function (initial ?: number){
  return this.reduce((p, c) => p * c, initial !== undefined ? initial : 1);
}


Number.prototype.pad = function pad(size : number) {
  let num = this.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

export {}