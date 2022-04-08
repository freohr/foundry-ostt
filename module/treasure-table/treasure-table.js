/**
 *  An enumeration for the accepted RollTable types
 */
export default class RollTableType {
  static Base = Symbol('base');
  static TreasureTable = Symbol('treasureTable');
}

/**
 *
 */
export class TreasureRollTable extends RollTable {
  /** @inheritdoc */
  constructor(...args) {
    super(...args);
  }

  /**
   * Evaluate a TreasureRollTable by rolling its formula against each of its results and retrieving the successes
   *
   * Note that this function only performs the roll and identifies the result, the TreasureRollTable#draw function
   * should be called to formalize the draw from the table.
   *
   * @param {RollTableType} tableType Which known type is the calling RolLTableConfig sheet
   * @param {Roll} [roll]             An alternative dice Roll to use instead of the default formula for the table
   * @param {boolean} recursive       If a RollTable document is drawn as a result, recursively roll it
   * @param {number} _depth           An internal flag used to track recursion depth
   * @return {Promise<RollTableDraw>} The Roll and results drawn by that Roll
   */
  async roll(tableType = RollTableType.Base, { roll, recursive = true, _depth = 0 } = {}) {
    switch (tableType) {
      case RollTableType.Base:
        return super.roll({ roll, recursive, _depth });
      case RollTableType.TreasureTable:
        return this.rollTreasure({ roll, recursive, _depth });
    }
  }

  /**
   * Evaluate a TreasureRollTable by rolling its formula against each of its results and retrieving the successes
   *
   * Note that this function only performs the roll and identifies the result, the TreasureRollTable#draw function
   * should be called to formalize the draw from the table.
   *
   * @param {Roll} [roll]         An alternative dice Roll to use instead of the default formula for the table
   * @param {boolean} recursive   If a RollTable document is drawn as a result, recursively roll it
   * @param {number} _depth       An internal flag used to track recursion depth
   * @return {Promise<RollTableDraw>}  The Roll and results drawn by that Roll
   */
  async _rollTreasure({ roll, recursive = true, _depth = 0 } = {}) {
    // Prevent excessive recursion
    if (_depth > 5) {
      throw new Error(`Maximum recursion depth exceeded when attempting to draw from RollTable ${this.id}`);
    }

    // Creating a d% roll to draw the treasure results
    roll = Roll.create('1d100');

    // Ensure that at least one non-drawn result remains
    const available = this.data.results.filter((r) => !r.data.drawn);
    if (!this.data.formula || !available.length) {
      ui.notifications.warn('There are no available results which can be drawn from this table.');
      return { rolls: [roll], results };
    }

    // Iterate over each TableResult to check if it appears in the Treasure pile
    const rolls = [];
    let results = [];

    available.forEach((result) => {
      const localRoll = roll.reroll({ async: false });

      rolls.push(localRoll);

      if (localRoll.total <= result.data.weight) {
        results.push(result);
      }
    });

    // Draw results recursively from any inner Roll Tables
    if (recursive) {
      let inner = [];

      const getInnerTableData = (result) => {
        switch (result.data.type) {
          case CONST.TABLE_RESULT_TYPES.DOCUMENT:
            return [null, result.data.collection];
          case CONST.TABLE_RESULT_TYPES.COMPENDIUM:
            const pack = game.packs.get(result.data.collection);
            return [pack, pack?.documentName];
          default:
            return [null, null];
        }
      };

      for (const result of results) {
        const [pack, documentName] = getInnerTableData(result);

        if (documentName === 'RollTable') {
          const id = result.data.resultId;
          const innerTable = pack ? await pack.getDocument(id) : game.tables.get(id);

          if (innerTable) {
            const { _, innerResults } = await innerTable.roll({ _depth: _depth + 1 });
            inner = inner.concat(innerResults);
          }
        } else {
          inner.push(result);
        }
      }
      results = inner;
    }

    // Return the Roll and the results
    return { rolls: rolls, results };
  }

  /**
   * Get an Array of valid results for a given rolled total
   * @param {number|Roll[]} rollValue: The rolled value or values in the case of a treasure table
   * @param {RollTableType} tableType Which known type is the calling RolLTableConfig sheet
   * @return {TableResult[]}  An Array of results
   */
  getResultsForRoll(rollValue, tableType = RollTableType.Base) {
    switch (tableType) {
      case RollTableType.Base:
        return super.getResultsForRoll(rollValue);
      case RollTableType.TreasureTable:
        return this._getTreasuresForRoll(rollValue);
    }
  }

  /**
   * Translate the rolls obtained in the list of results drawns
   * @param {Roll[]} rolls
   * @return {TableResultData} the list of result drawn by the rolls
   */
  _getTreasuresForRoll(rolls) {
    if (!Array.isArray(rolls)) {
      // If a treasure table if treated as a normal table, it's less error-prone to return nothing than try to shoehorn
      // the base table logic in the treasure table expected data-model
      return [];
    }

    if (rolls.length > this.results.length) {
      // In case we get more rolls than we have results in this Table, discard any excess to avoid errors
      values = values.slice(this.results.length);
    }

    const resultItr = this.results[Symbol.iterator]();
    const zippedResults = rolls.map((roll) => {
      return { roll: roll, result: resultItr.next().value };
    });

    return zippedResults
      .filter((zipResult) => (!zipResult.result.data.drawn && zipResult.roll.total <= zipResult.result.data.weight))
      .map((zipResult) => zipResult.result);
  }
}
