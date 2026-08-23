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
  UtensilsCrossed,
  Menu as MenuIcon,
  Clock,
  Wallet,
  BarChart3,
  WifiOff,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { useConnectivity } from '@/context/ConnectivityContext';
import BranchSelect from '@/components/inventory/BranchSelect';
import ShiftBar from '@/features/shifts/components/ShiftBar';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Parameters<typeof hasPermission>[1];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Till',
    items: [{ to: '/till', label: 'Orders & tabs', icon: UtensilsCrossed }],
  },
  {
    label: 'Sales',
    items: [
      {
        to: '/sales/menu',
        label: 'Menu',
        icon: MenuIcon,
        permission: 'inventory:manage',
      },
      {
        to: '/sales/shifts',
        label: 'Shifts',
        icon: Clock,
        permission: 'shifts:read',
      },
      {
        to: '/sales/expenses',
        label: 'Expenses',
        icon: Wallet,
        permission: 'expenses:read',
      },
      {
        to: '/sales/reports',
        label: 'Reports',
        icon: BarChart3,
        permission: 'reports:read',
      },
      {
        to: '/sales/sync-issues',
        label: "Didn't save",
        icon: AlertOctagon,
        permission: 'sync:manage',
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
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
      {
        to: '/inventory/reports',
        label: 'Reports',
        icon: ClipboardList,
        permission: 'inventory:count',
      },
    ],
  },
];

function ConnectivityBanner() {
  const { connectivity, outboxPendingCount, lastCachedAt } = useConnectivity();

  if (connectivity === 'online' && outboxPendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {connectivity === 'offline' && (
        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
          <WifiOff className="h-3 w-3" />
          No internet
          {lastCachedAt
            ? ` — showing data from ${new Date(lastCachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </span>
      )}
      {outboxPendingCount > 0 && (
        <Badge variant="secondary">{outboxPendingCount} saving…</Badge>
      )}
    </div>
  );
}

export default function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || hasPermission(user?.role, item.permission),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-active text-sm font-bold text-white">
            P
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight tracking-tight">
              POS
            </h2>
            <p className="truncate text-xs text-sidebar-muted">
              {user?.fullName}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 px-3 pt-2">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/inventory'}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-white'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-active transition-opacity',
                            isActive ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive
                              ? 'text-sidebar-active'
                              : 'text-sidebar-muted group-hover:text-sidebar-foreground',
                          )}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 text-xs capitalize text-sidebar-muted">
            {user?.role}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1.5 w-full justify-start gap-2 px-2 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-card/80 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <NavLink
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Home
          </NavLink>
          <div className="flex items-center gap-2">
            <ConnectivityBanner />
            <ShiftBar />
            <BranchSelect />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
