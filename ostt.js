import { OSTTModuleConfig } from './module/ostt-config.js';

Hooks.once('init', async () => {
  OSTTModuleConfig.init();
});

Hooks.once('ready', async () => {
  game.OSTT.ready();
});

Hooks.on('preCreateRollTable', (...args) => {
  game.OSTT.storeExpectedType(...args);
});
