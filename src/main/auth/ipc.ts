import { ipcMain } from 'electron';
import authService from './authService';
import { ApiRequestOptions } from '../../shared/authTypes';
import gatewayRequest from '../sync/requestGateway';

export default function registerAuthIpc(): void {
  ipcMain.handle('auth:bootstrap', () => authService.bootstrap());

  ipcMain.handle(
    'auth:login',
    (_event, username: string, password: string, deviceLabel?: string) =>
      authService.login(username, password, deviceLabel),
  );

  ipcMain.handle('auth:logout', (_event, allDevices?: boolean) =>
    authService.logout(allDevices),
  );

  ipcMain.handle(
    'auth:changePassword',
    (_event, currentPassword: string, newPassword: string) =>
      authService.changePassword(currentPassword, newPassword),
  );

  ipcMain.handle('auth:currentUser', () => authService.getCurrentUser());

  // Generic authenticated passthrough — every future feature module (menu,
  // orders, users admin, sessions list, ...) reuses this instead of each
  // reimplementing token attachment + refresh-on-401. Routed through the
  // sync gateway, which adds cache-read-through and offline queueing on top
  // of authService.authorizedRequest without touching its refresh logic.
  ipcMain.handle('api:request', (_event, options: ApiRequestOptions) =>
    gatewayRequest(options),
  );
}
