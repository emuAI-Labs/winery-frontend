import { ElectronHandler, AuthHandler, ApiHandler } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    auth: AuthHandler;
    api: ApiHandler;
  }
}

export {};
