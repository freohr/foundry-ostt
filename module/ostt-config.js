import * as helpers from './helpers.js';
import { TreasureRollTable } from './treasure-table/treasure-table.js';
import { TreasureTableConfig } from './treasure-table/treasure-table-sheet.js';

/**
 * Class containing configuration to inject TreasureTable types
 * in the existing RollTable Types
 */
export class OSTTModuleConfig {
  /** @inheritdoc */
  constructor() {
  }

  /**
   * The known types of RollTables and their associated sheet Class
   * (in addition to the default Foundry RollTable sheet class)
   */
  static get types() {
    return {
      treasureTable: TreasureTableConfig,
    };
  }

  /**
   *
   */
  static get typeLabels() {
    return {
      treasureTable: 'OSTT.table.treasure.type',
    };
  }

  /**
   *  Setup to call during Foundry initialization
   *  Prepare the existing RollTable classes by injecting what we need to handle TreasureTables
   */
  static init() {
    CONFIG.RollTable.documentClass = TreasureRollTable;
  }

  /**
   *  Setup to call when Foundry is ready
   */
  static ready() {
    this.registerSheetClasses();
  }

  /**
   * Register the additionnal RollTable sheets for now to enable their creation
   */
  static registerSheetClasses() {
    const types = OSTTModuleConfig.types;
    const labels = OSTTModuleConfig.typeLabels;

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
}

