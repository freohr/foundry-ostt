export const debugEnabled = 2;

export const osttFoundryNamespace = 'ostt';

export const debug = (...args) => {
  if (debugEnabled > 1) console.log(`${osttFoundryNamespace} | DEBUG | `, ...args);
};
export const log = (...args) => console.log(`${osttFoundryNamespace} | `, ...args);
export const warn = (...args) => {
  if (debugEnabled > 0) console.warn(`${osttFoundryNamespace} | `, ...args);
};
export const error = (...args) => console.error(`${osttFoundryNamespace} |`, ...args);

export const i18n = (key) => game.i18n.localize(key);

export const setting = (key) => game.settings.get(osttFoundryNamespace, key);

export const osttModulePath = (relativePath) => `modules/ostt/${relativePath}`;
