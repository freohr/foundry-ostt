import * as helpers from './helpers.js';
import { TreasureRollTable } from './treasure-table/treasure-table.js';
import { TreasureTableConfig } from './treasure-table/treasure-table-sheet.js';

/**
 * Class containing configuration to inject TreasureTable types
 * in the existing RollTable Types
 */
export class OSTTModuleConfig {
  /** @inheritdoc */
  constructor() { }

  _newTables = new Map();

  /**
   * The known types of RollTables and their associated sheet Class
   * (in addition to the default Foundry RollTable sheet class)
   */
  get types() {
    return {
      treasureTable: TreasureTableConfig,
    };
  }

  /**
   *  Labels for the added types of RollTable
   */
  get typeLabels() {
    return {
      treasureTable: 'OSTT.table.treasure.type',
    };
  }

  /**
 *  Setup to call during Foundry initialization
 *  Prepare the existing RollTable classes by injecting what we need to handle TreasureTables
 */
  static init() {
    game.OSTT = new OSTTModuleConfig();

    this.setupCreationWrapper();
    this.setupRollWrapper();
  }

  /**
   *  Wrap RollTable creation with libWrapper to inject the table type we need
   */
  static setupCreationWrapper() {
    const createRollTableWrapper = async function (wrapped, ...args) {
      helpers.debug('wrapping RollTable._onCreate with args', ...args);

      const [data, options, userId] = args;

      const table = game.tables.get(data._id);
      await game.OSTT.injectTypeOnCreation(this, options, userId);

      return wrapped(...args);
    };

    libWrapper.register('ostt', 'RollTable.prototype._onCreate', createRollTableWrapper, 'WRAPPER');
  }

  /**
   *  Wrap `roll()` and `draw()` methods for RollTable to handle the old-school D&D treasure table logic
   */
  static setupRollWrapper() {

  }

  /**
   *  Setup to call when Foundry is ready
   *  Register our TreasureTable sheets
   */
  ready() {
    this.registerSheetClasses();
  }

  /**
 * Register the additionnal RollTable sheets for now to enable their creation
 */
  registerSheetClasses() {
    const types = this.types;
    const labels = this.typeLabels;

    for (const [tableType, label] of Object.entries(labels)) {
      if (CONFIG.RollTable.sheetClasses[tableType] === undefined) {
        CONFIG.RollTable.sheetClasses[tableType] = {};
      }

      RollTables.registerSheet?.(helpers.osttFoundryNamespace, types[tableType] || RollTableConfig, {
        types: [tableType],
        makeDefault: true,
        label: helpers.i18n(label),
      });
    }

    const allRollTableTypes = game.system.documentTypes.RollTable.concat(Object.keys(types)).sort();
    game.system.documentTypes.RollTable = allRollTableTypes;

    CONFIG.RollTable.typeLabels = mergeObject((CONFIG.RollTable.typeLabels || {}), labels);
  }

  /**
 * Store the expected type of rollTable to be injected after creation
 * @param {RollTable} entry:  The document to be created
 * @param {*} data:           The data used for document creation
 * @param {*} options:        Options governing the document creation
 * @param {string} userId:    Id of the user creating the table
 */
  storeExpectedType(entry, data, options, userId) {
    if (userId !== game.userId) {
      return;
    }

    this._newTables.set(entry.name, data.type);
  }

  /**
   *  Inject the expected RollTable type in the newly created document
   * @param {RollTable} document  the newly created RollTable
   * @param {*} options           options used for creation
   * @param {string} userId       Id of the user that created the table
   */
  async injectTypeOnCreation(document, options, userId) {
    if (userId !== game.userId) {
      return;
    }

    if (!this._newTables.has(document.name)) {
      helpers.error(`Table '${document.name}' did not go throught the correct preCreate hook`);
      return;
    }

    const expectedType = this._newTables.get(document.name);
    this._newTables.delete(document.name);
    await document.setFlag('_document-sheet-registrar', 'type', expectedType);
    await document.setFlag(helpers.osttFoundryNamespace, 'type', expectedType);
  }
}

