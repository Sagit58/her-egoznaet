import {
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  Folder,
  Building,
  LogOut,
  TrendingUp,
  Clock,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useState } from 'react';

import { useDashboardStats } from './hooks';
import { CustomersScreen } from './screens/CustomersScreen';
import { EmployeesScreen } from './screens/EmployeesScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { generateInitData } from './telegram';

type Screen = 'dashboard' | 'orders' | 'customers' | 'employees' | 'files' | 'branches';

interface MenuItem {
  readonly id: Screen;
  readonly label: string;
  readonly icon: typeof LayoutDashboard;
  readonly description: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'orders',
    label: 'Заказы',
    icon: FileText,
    description: 'Управление заказами',
  },
  {
    id: 'customers',
    label: 'Клиенты',
    icon: Users,
    description: 'База клиентов',
  },
  {
    id: 'employees',
    label: 'Сотрудники',
    icon: UserCheck,
    description: 'Персонал',
  },
  {
    id: 'files',
    label: 'Документы',
    icon: Folder,
    description: 'Файлы и фото',
  },
  {
    id: 'branches',
    label: 'Филиалы',
    icon: Building,
    description: 'Офисы и отделы',
  },
];

export const App = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(
    () => localStorage.getItem('accessToken') !== null,
  );
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const { stats, loading, error } = useDashboardStats(authenticated);

  const handleLogin = async () => {
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

      const body = (await response.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };

      if (!body.accessToken) {
        throw new Error('Сервер не вернул токен');
      }

      localStorage.setItem('accessToken', body.accessToken);

      if (body.refreshToken) {
        localStorage.setItem('refreshToken', body.refreshToken);
      }

      setAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message || 'Ошибка входа');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuthenticated(false);
    setCurrentScreen('dashboard');
  };

  if (!authenticated) {
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

            <button
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
            >
              {loggingIn ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'orders') {
    return <OrdersScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  
    if (currentScreen === 'employees') {
    return <EmployeesScreen onBack={() => setCurrentScreen('dashboard')} />;
  }
  if (currentScreen === 'customers') {
    return <CustomersScreen onBack={() => setCurrentScreen('dashboard')} />;
  }

  if (currentScreen !== 'dashboard') {
    const currentMenuItem = menuItems.find((m) => m.id === currentScreen);
    const CurrentIcon = currentMenuItem?.icon || LayoutDashboard;

    return (
      <div className="min-h-screen bg-slate-900 p-4 pb-20">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="mb-4 flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm"
        >
          ← Назад
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-md bg-slate-800 border border-slate-700">
            <CurrentIcon className="w-5 h-5 text-slate-300" />
          </div>
          <h1 className="text-lg font-semibold text-slate-100">
            {currentMenuItem?.label}
          </h1>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 text-slate-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">
              Раздел "{currentMenuItem?.label}" в разработке
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Всего заказов', value: stats?.totalOrders ?? '-', icon: FileText },
    { label: 'Клиентов', value: stats?.totalCustomers ?? '-', icon: Users },
    { label: 'Активных', value: stats?.activeOrders ?? '-', icon: Clock },
    { label: 'Выручка', value: stats?.totalRevenue ?? '-', icon: TrendingUp },
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

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
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
      )}

      <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
        Модули
      </h2>
      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentScreen(item.id)}
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