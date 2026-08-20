import { ipcMain } from 'electron';
import { SyncStatus } from '../../shared/syncTypes';
import { getMainWindow } from '../windowRegistry';
import connectivity from './connectivity';
import * as outbox from './outbox';
import { drainOutbox, onDrainComplete } from './drain';

function currentStatus(): SyncStatus {
  return {
    connectivity: connectivity.getState(),
    outboxPendingCount: outbox.countPending(),
    outboxIssueCount: outbox.countIssues(),
    lastCachedAt: connectivity.getLastCachedAt(),
  };
}

function broadcastStatus(): void {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return;
  win.webContents.send('sync:status-changed', currentStatus());
}

export default function registerSyncIpc(): void {
  ipcMain.handle('sync:getStatus', () => currentStatus());
  ipcMain.handle('sync:listIssues', () => outbox.listIssues());
  ipcMain.handle('sync:retryIssue', (_event, id: string) => {
    outbox.retryIssue(id);
    drainOutbox().catch(() => {});
  });
  ipcMain.handle('sync:discardIssue', (_event, id: string) => {
    outbox.discardIssue(id);
    broadcastStatus();
  });

  connectivity.onChange(() => broadcastStatus());
  onDrainComplete((invalidates) => {
    broadcastStatus();
    const win = getMainWindow();
    if (!win || win.isDestroyed()) return;
    win.webContents.send('sync:invalidate', invalidates);
  });
}
