import { useMemo } from 'react';
import { useMenuItems } from './useMenu';

/** Order lines only ever carry a `menuItemId`, never a nested `menuItem`
 * object — the backend doesn't expand that relation on any order endpoint.
 * Every screen that needs to show a line's name resolves it client-side
 * against the menu list instead. react-query dedupes the underlying
 * request across every component that calls this. */
export function useMenuItemLookup() {
  const { data } = useMenuItems();
  return useMemo(() => {
    const byId = new Map<string, string>();
    data?.items.forEach((item) => byId.set(item.id, item.name));
    return byId;
  }, [data]);
}
