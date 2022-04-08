import * as helpers from './module/helpers.js';
import { OSTTModuleConfig } from './module/ostt-config.js';
import { TreasureRollTable } from './module/treasure-table/treasure-table.js';

Hooks.once('init', async () => {
  OSTTModuleConfig.init();
});

Hooks.once('ready', async () => {
  OSTTModuleConfig.ready();
  helpers.debug('ready hook');
});
