import {v4 as uuidv4} from "uuid";
import {createClient} from "redis";

export type QueryType = { [key: string]: string };
export type BodyType = { [key: string]: any };
export type RedisClientType = ReturnType<typeof createClient>;

export class RedisController<Type> {
  protected referenceController: RedisController<any> | undefined = undefined;
  protected subControllers: RedisController<any>[] = [];
  protected itemKey: string;
  protected referenceKey: string | undefined = undefined;
  protected client: RedisClientType;

  /**
   * Creates the Redis Controller
   * @param itemKey Item key for the database
   * @param client Redis client
   */
  constructor(itemKey: string, client: RedisClientType) {
    this.itemKey = itemKey;
    this.client = client;
  }

  /**
   * Requesting the entry by its id
   * @param uid User ID
   * @param id ID of the entry
   * @param itemKey Item key
   * @param client Client to be used
   * @protected
   */
  protected static async _getEntry(uid: string, id: string, itemKey: string, client: any) {
    // get object
    return await client.hGet(`${itemKey}:${uid}`, id);
  }

  /**
   * Helper method to create an entry
   * @param uid User ID
   * @param body Body of the entry
   * @param itemKey Item key
   * @param client Client to be used
   * @return ID of the created entry
   * @protected
   */
  protected static async _addEntry(uid: string, body: BodyType, itemKey: string, client: any) {
    // generate id
    const id = this.generateId();
    // set element
    await client.hSet(`${itemKey}:${uid}`, id, JSON.stringify(body));
    // send entries
    return id;
  }

  /**
   * Generate an unique ID
   * @return The generated ID
   * @protected
   */
  protected static generateId() {
    // generate id
    return uuidv4();
  }

  protected static _getReferenceId(uid: string, query: QueryType, referenceKey: string) {
    // check reference
    if (!query || !query[referenceKey])
      throw new Error('Reference is not set.');
    // return id
    return query[referenceKey].toString();
  }

  /**
   * @brief Set the reference controller.
   * The reference controller allows access to the parent data of the planning. The reference key defines the field name,
   * which is used to store the ID of the reference object.
   * @param referenceController The reference controller to be set.
   * @param referenceKey The key which is used to store the reference object ID. If not set the item key of the reference controller is used.
   * @param addThisAsSubController Flag to add this controller as sub-controller for the reference controller.
   */
  setReferenceController<ReferenceType>(
    referenceController: RedisController<ReferenceType>,
    referenceKey: string,
    addThisAsSubController: boolean = true,
  ): void {
    this.referenceController = referenceController;
    this.referenceKey = referenceKey;
    addThisAsSubController && (referenceController.subControllers.push(this));
  }

  /**
   * Returns the entry given by its ID
   * @param uid User ID
   * @param id ID of the entry
   */
  async getEntry(uid: string, id: string) {
    // get object
    const entry = await RedisController._getEntry(uid, id, this.itemKey, this.client);
    // check result
    if (!entry) return null;
    // parse object
    const entryObject = JSON.parse(entry);
    // send entries
    return {_id: id, ...entryObject};
  }

  /**
   * Adds an entry to the database
   * @param uid User ID
   * @param body Body of the entry
   * @param query Query to store reference data (if any)
   */
  async addEntry(uid: string, body: BodyType, query: QueryType) {
    // add reference
    if (this.referenceController)
      body = await this.applyReference(uid, query, body);
    // create entry
    const id = await RedisController._addEntry(uid, body, this.itemKey, this.client);
    // return object
    return {id};
  }

  /**
   * Overwrites the entry by the given body data. Adds the reference (if set) as body field.
   * @param uid User ID
   * @param id ID of the entry
   * @param body Body to be stored
   */
  async updateEntry(uid: string, id: string, body: BodyType) {
    // get entry to check rights, existence and get reference
    const entry = await this.getEntry(uid, id);
    // check
    if (!entry) throw new Error('Entry does not exist');
    // add reference
    if (this.referenceController)
      body = await this.applyReference(uid, entry, body);
    // save object
    await this.client.hSet(`${this.itemKey}:${uid}`, id, JSON.stringify(body));
    // return status
    return {_id: id};
  }

  /**
   * Overwrites or adds the given fields into the existing entry. Keeps all other fields. Fields to be deleted are
   * set to undefined. The method only works on the top level. Deep patches need to be written explicitly.
   * @param uid User ID
   * @param id ID of the entry
   * @param body Fields to be set
   */
  async patchEntry(uid: string, id: string, body: BodyType) {
    // patch entry
    await this._patchEntry(uid, id, body, this.client);
    // return id
    return {_id: id};
  }

  /**
   * Overwrites or adds the given fields into existing entries. The entries to be patched are selected by the query.
   * Keeps all other fields. Fields to be deleted are set to undefined. The method only works on the top level.
   * Deep patches need to be written explicitly.
   * @param uid User ID
   * @param query Query to store reference data (if any)
   * @param body Fields to be set
   */
  async patchEntries(uid: string, query: QueryType, body: BodyType) {
    // get entries
    const entries = await this.getEntries(uid, query);
    // create multi client
    const cl = this.client.multi();
    // patch
    const ids = await Promise.all(entries.map(e => this._patchEntry(uid, e._id, body, cl)));
    // execute
    await cl.exec();
    // return IDs
    return ids;
  }

  /**
   * Delete entry
   * @param uid User ID
   * @param id ID of the entry
   */
  async deleteEntry(uid: string, id: string) {
    // get entry to check rights and existence
    const entry = await this.getEntry(uid, id);
    // check
    if (!entry) throw new Error('Entry does not exist');
    // create multi client
    const cl = this.client.multi();
    // register deletions in client
    await this._deleteEntry(uid, id, cl);
    // execute
    await cl.exec();
    // return
    return {_id: id};
  }

  async deleteEntries(uid: string, query: QueryType) {
    // get all ids (already filtered)
    const entries = await this.getEntries(uid, query);
    // create multi client
    const cl = this.client.multi();
    // delete objects
    await Promise.all(entries.map((e: any) => this.deleteEntry(uid, e._id)));
    // execute
    await cl.exec();
    // return
    return entries.map((e: any) => e._id);
  }

  async getEntries(uid: string, query: QueryType) {
    // get planning
    const items = await this.client.hGetAll(`${this.itemKey}:${uid}`);
    // check result, and return empty, when undefined, null, ...
    if (!items) return [];
    // create object array and add id
    let objects = Object.entries(items)
      .map(([key, entry]: [string, string]) => ({_id: key, ...JSON.parse(entry)}));
    // check reference
    if (this.referenceController)
      objects = await this.filterByReference(uid, query, objects);
    // return
    return objects;
  }

  async addEntries(uid: string, body: BodyType[], query: QueryType) {
    // create objects
    const cl = this.client.multi();
    const ids = await Promise.all(
      body.map(async (entry: any) => {
        // generate ID
        const id = uuidv4();
        // add reference
        if (this.referenceController)
          entry = await this.applyReference(uid, query, entry);
        // set element
        cl.hSet(`${this.itemKey}:${uid}`, id, JSON.stringify(entry));
        // return ID
        return id;
      })
    );
    // execute
    await cl.exec();
    // return ids
    return ids;
  }

  async applyReference(uid: string, query: QueryType, object: any) {
    // check (should not happen)
    if (!this.referenceKey || !this.referenceController)
      throw "Reference key or controller not defined";
    // get reference id
    const id = RedisController._getReferenceId(uid, query, this.referenceKey);
    // get reference object and check
    const ref = await this.referenceController.getEntry(uid, id);
    // check
    if (!ref) throw new Error('Reference does not exist');
    // add to object
    object[this.referenceKey] = ref._id;
    // return object
    return object;
  }

  async filterByReference(uid: string, query: QueryType, objects: any[]) {
    // check (should not happen)
    if (!this.referenceKey || !this.referenceController)
      throw "Reference key or controller not defined";
    // get reference id
    const id = RedisController._getReferenceId(uid, query, this.referenceKey);
    // get reference object
    const ref = await this.referenceController.getEntry(uid, id);
    // check
    if (!ref) throw new Error('Reference does not exist');
    // filter
    return objects.filter(e => e[this.referenceKey || ''] === ref._id);
  }

  /**
   * Patches the entry
   * @param uid User ID
   * @param id ID of the entry
   * @param body Field collection to be patched
   * @param client The redis client to be used (might be a multi client)
   * @return ID of the updated entry
   * @protected
   */
  protected async _patchEntry(uid: string, id: string, body: BodyType, client: any) {
    // get entry to check rights, existence and get reference
    const entry = await this.getEntry(uid, id);
    // check
    if (!entry) throw new Error('Entry does not exist');
    // patch body
    let newEntry = {...entry, ...body};
    // update  reference
    if (this.referenceController)
      newEntry = await this.applyReference(uid, entry, newEntry);
    // save object
    await client.hSet(`${this.itemKey}:${uid}`, entry._id, JSON.stringify(newEntry));
    // return id
    return id;
  }

  protected async _deleteEntry(uid: string, id: string, client: any) {
    // delete from sub-controller
    if (this.referenceKey)
      await Promise.all(this.subControllers.map(c => c._deleteEntries(uid, {[c.referenceKey || '']: id}, client)));
    // add to be deleted
    await client.hDel(`${this.itemKey}:${uid}`, id);
  }

  protected async _deleteEntries(uid: string, query: QueryType, client: any) {
    // get entries
    const entries = await this.getEntries(uid, query);
    // delete
    return await Promise.all(entries.map(e => this._deleteEntry(uid, e._id, client)));
  }
}

