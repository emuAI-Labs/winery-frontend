import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  ArrowLeftRight,
  ShoppingCart,
  AlertTriangle,
  ClipboardCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import BranchSelect from '@/components/inventory/BranchSelect';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Parameters<typeof hasPermission>[1];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/inventory', label: 'Stock overview', icon: LayoutDashboard },
  {
    to: '/inventory/catalogue',
    label: 'Catalogue',
    icon: Package,
    permission: 'inventory:manage',
  },
  {
    to: '/inventory/receiving',
    label: 'Receive stock',
    icon: Truck,
    permission: 'inventory:receive',
  },
  {
    to: '/inventory/losses',
    label: 'Breakage & loss',
    icon: AlertTriangle,
    permission: 'inventory:loss',
  },
  {
    to: '/inventory/transfers',
    label: 'Transfers',
    icon: ArrowLeftRight,
    permission: 'inventory:transfer',
  },
  {
    to: '/inventory/requisitions',
    label: 'Requisitions',
    icon: ShoppingCart,
    permission: 'inventory:requisition',
  },
  {
    to: '/inventory/stock-counts',
    label: 'Stock takes',
    icon: ClipboardCheck,
    permission: 'inventory:count',
  },
  { to: '/inventory/reports', label: 'Reports', icon: ClipboardList },
];

export default function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(user?.role, item.permission),
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30">
        <div className="px-4 py-5">
          <h2 className="text-lg font-semibold">Winery POS</h2>
          <p className="text-xs text-muted-foreground">Inventory & Stock</p>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/inventory'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <p className="truncate text-sm font-medium">{user?.fullName}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {user?.role}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 px-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <NavLink
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to till
          </NavLink>
          <BranchSelect />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
