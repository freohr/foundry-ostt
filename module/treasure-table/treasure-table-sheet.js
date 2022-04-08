import RollTableType from './treasure-table.js';

/**
 *
 */
export class TreasureTableConfig extends RollTableConfig {
  /** @inheritdoc */
  constructor(...args) {
    super(...args);
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'roll-table-config', 'treasure-table-config'],
      template: 'templates/treasure-table/treasure-table-config.html',
    });
  }

  /** @inheritdoc */
  get title() {
    const headerPrefix = game.i18n.localize('OSTT.table.treasure.title');

    return `${headerPrefix}: ${this.document.name}`;
  }

  /** @inheritdoc */
  getData() {
    const data = super.getData();
    data.config = CONFIG.OSTT;
    return data;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onRollTable(event) {
    event.preventDefault();
    await this.submit({ preventClose: true, preventRender: true });
    event.currentTarget.disabled = true;

    const tableRoll = await this.document.roll(RollTableType.TreasureTable);
    const draws = this.document.getTreasuresForRoll(tableRoll.rolls);

    if (draws.length) {
      if (game.settings.get('core', 'animateRollTable')) await this._animateRoll(draws);
      await this.document.draw(tableRoll);
    }

    event.currentTarget.disabled = false;
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('button.roll').click((event) => this._onRollTable(event));
  }
}
