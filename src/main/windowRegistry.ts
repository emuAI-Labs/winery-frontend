import { BrowserWindow } from 'electron';

/** Single-window app — this avoids a circular import between main.ts (which
 * owns the BrowserWindow) and any module that needs to push events to the
 * renderer (e.g. sync status broadcasts). */
let mainWindow: BrowserWindow | null = null;

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
