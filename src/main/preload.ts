// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  ApiRequestOptions,
  ApiResponse,
  AuthUser,
  BootstrapResult,
} from '../shared/authTypes';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

const authHandler = {
  bootstrap: (): Promise<BootstrapResult> =>
    ipcRenderer.invoke('auth:bootstrap'),
  login: (
    username: string,
    password: string,
    deviceLabel?: string,
  ): Promise<ApiResponse<{ user: AuthUser }>> =>
    ipcRenderer.invoke('auth:login', username, password, deviceLabel),
  logout: (allDevices?: boolean): Promise<void> =>
    ipcRenderer.invoke('auth:logout', allDevices),
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<{ user: AuthUser }>> =>
    ipcRenderer.invoke('auth:changePassword', currentPassword, newPassword),
  currentUser: (): Promise<AuthUser | null> =>
    ipcRenderer.invoke('auth:currentUser'),
};

const apiHandler = {
  request: <T = unknown>(options: ApiRequestOptions): Promise<ApiResponse<T>> =>
    ipcRenderer.invoke('api:request', options),
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('auth', authHandler);
contextBridge.exposeInMainWorld('api', apiHandler);

export type ElectronHandler = typeof electronHandler;
export type AuthHandler = typeof authHandler;
export type ApiHandler = typeof apiHandler;
