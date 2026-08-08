import {
  FileText,
  Users,
  UserCheck,
  Folder,
  Building,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  Clock3,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useDashboardStats } from './hooks';
import { generateInitData } from './telegram';
import { formatRub, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from './constants';

/**
 * Login state is shared across the app via this tiny module-scoped store.
 * Screens render LoginCard directly when the access token is missing, and
 * AuthGate redirects to /login otherwise.
 */
export const isAuthenticated = (): boolean =>
  localStorage.getItem('accessToken') !== null;

export const storeTokens = (body: { accessToken?: string; refreshToken?: string }) => {
  if (!body.accessToken) {
    throw new Error('Сервер не вернул токен');
  }

  localStorage.setItem('accessToken', body.accessToken);

  if (body.refreshToken) {
    localStorage.setItem('refreshToken', body.refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

/** Gate that redirects unauthenticated users to the login screen. */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Card-based login offering either a password login (superadmin) or a
 * Telegram login. Outside Telegram, falls back to forging initData from
 * the dev env vars (see telegram.ts).
 */
export const LoginCard = () => {
  const navigate = useNavigate();
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminLogin, setAdminLogin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const complete = (body: { accessToken?: string; refreshToken?: string }) => {
    storeTokens(body);
    navigate('/dashboard', { replace: true });
  };

  const handleTelegramLogin = async () => {
    setLoginError(null);
    setLoggingIn(true);

    try {
      const telegramWebApp = (
        window as unknown as {
          Telegram?: { WebApp?: { initData?: string } };
        }
      ).Telegram?.WebApp;

      let initData: string;

      if (telegramWebApp?.initData) {
        initData = telegramWebApp.initData;
      } else {
        const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as
          | string
          | undefined;
        const adminId = import.meta.env.VITE_ADMIN_TELEGRAM_ID as
          | string
          | undefined;

        if (!botToken || !adminId) {
          throw new Error('Не настроен .env в папке miniapp');
        }

        initData = await generateInitData(botToken, adminId);
      }

      const response = await fetch('/api/v1/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка входа: ${response.status}`);
      }

      complete((await response.json()) as Parameters<typeof complete>[0]);
    } catch (err: any) {
      setLoginError(err.message || 'Ошибка входа');
    } finally {
      setLoggingIn(false);
    }
  };

  const handlePasswordLogin = async () => {
    setLoginError(null);
    setLoggingIn(true);

    try {
      const response = await fetch('/api/v1/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: adminLogin, password: adminPassword }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка входа: ${response.status}`);
      }

      complete((await response.json()) as Parameters<typeof complete>[0]);
    } catch (err: any) {
      setLoginError(err.message || 'Ошибка входа');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-md bg-slate-700">
              <Lock className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                Monument ERP
              </h1>
              <p className="text-sm text-slate-400">Вход в систему</p>
            </div>
          </div>

          {loginError && (
            <div className="bg-red-900/20 rounded-lg p-3 border border-red-800 mb-4">
              <p className="text-red-400 text-sm">{loginError}</p>
            </div>
          )}

          <div className="space-y-3 mb-4">
            <input
              value={adminLogin}
              onChange={(e) => setAdminLogin(e.target.value)}
              autoComplete="username"
              placeholder="Логин"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
            <input
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Пароль"
              type="password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
            <button
              onClick={handlePasswordLogin}
              disabled={loggingIn}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
            >
              {loggingIn ? 'Вход...' : 'Войти по логину'}
            </button>
          </div>

          <button
            onClick={handleTelegramLogin}
            disabled={loggingIn}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
          >
            {loggingIn ? 'Вход...' : 'Войти через Telegram'}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly description: string;
  readonly to: string;
}

const menuItems: MenuItem[] = [
  { id: 'orders', label: 'Заказы', icon: FileText, description: 'Управление заказами', to: '/orders' },
  { id: 'customers', label: 'Клиенты', icon: Users, description: 'База клиентов', to: '/customers' },
  { id: 'employees', label: 'Сотрудники', icon: UserCheck, description: 'Персонал', to: '/employees' },
  { id: 'files', label: 'Документы', icon: Folder, description: 'Файлы и фото', to: '/files' },
  { id: 'branches', label: 'Филиалы', icon: Building, description: 'Офисы и отделы', to: '/branches' },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useDashboardStats(true);

  const handleLogout = () => {
    clearTokens();
    navigate('/login', { replace: true });
  };

  const stats = data?.stats;

  const statCards = [
    { label: 'Всего заказов', value: stats?.totalOrders ?? '-', icon: FileText },
    { label: 'Клиентов', value: stats?.totalCustomers ?? '-', icon: Users },
    { label: 'В работе', value: stats?.activeOrders ?? '-', icon: Clock },
    { label: 'Завершено', value: stats?.completedOrders ?? '-', icon: CheckCircle2 },
    { label: 'Выручка', value: stats ? formatRub(stats.totalRevenue) : '-', icon: TrendingUp, wide: true },
    { label: 'Оплачено', value: stats ? formatRub(stats.paidTotal) : '-', icon: CheckCircle2 },
    { label: 'Долг', value: stats ? formatRub(stats.unpaidTotal) : '-', icon: Clock3 },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Monument ERP
          </h1>
          <p className="text-sm text-slate-400 mt-1">Система управления</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
          aria-label="Выйти"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {loading && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <p className="text-slate-400 text-sm">Загрузка данных...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-800 mb-4">
          <p className="text-red-400 text-sm">Ошибка: {error}</p>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`bg-slate-800 rounded-lg p-4 border border-slate-700 ${
                  (stat as { wide?: boolean }).wide ? 'col-span-2' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-2xl font-semibold text-slate-100 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Последние заказы */}
          {data?.recentOrders && data.recentOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
                Последние заказы
              </h2>
              <div className="space-y-2">
                {data.recentOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700 text-left hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-slate-100">№ {order.number}</div>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          ORDER_STATUS_COLORS[order.status] ||
                          'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-400">
                        {order.customer
                          ? `${order.customer.lastName} ${order.customer.firstName}`
                          : 'Без клиента'}
                      </div>
                      <div className="text-slate-200 font-medium">
                        {formatRub(order.totalAmount || 0)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
        Модули
      </h2>
      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.to)}
            className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-4 border border-slate-700 transition-colors text-left flex items-center gap-3"
          >
            <div className="p-2 rounded-md bg-slate-700">
              <item.icon className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-100">{item.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {item.description}
              </div>
            </div>
            <div className="text-slate-500">→</div>
          </button>
        ))}
      </div>
    </div>
  );
};
