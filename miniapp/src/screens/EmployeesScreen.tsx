import { Plus, RefreshCw, UserCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api';
import { EmptyState, ScreenLayout, StatusBadge } from '../components';
import { ROLE_COLORS, ROLE_LABELS } from '../constants';

interface Employee {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName?: string | null;
  readonly phone?: string | null;
  readonly telegramId?: string | null;
  readonly role: string;
  readonly isActive: boolean;
}

export const EmployeesScreen = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [role, setRole] = useState('MANAGER');

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/employees?pageSize=100');
      setEmployees(response.data.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleCreate = async () => {
    if (!lastName || !firstName) {
      setFormError('Заполните фамилию и имя');
      return;
    }

    if (!telegramId) {
      setFormError('Укажите Telegram ID сотрудника');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        lastName,
        firstName,
        telegramId,
        role,
      };

      if (phone) {
        body.phone = phone;
      }

      await api.post('/employees', body);

      setLastName('');
      setFirstName('');
      setPhone('');
      setTelegramId('');
      setRole('MANAGER');
      setShowForm(false);

      await loadEmployees();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const actions = [
    {
      icon: showForm ? <X className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />,
      onClick: () => setShowForm(!showForm),
      variant: 'primary' as const,
      label: showForm ? 'Закрыть форму' : 'Добавить сотрудника',
    },
    {
      icon: <RefreshCw className="w-4 h-4 text-slate-400" />,
      onClick: loadEmployees,
      variant: 'ghost' as const,
      label: 'Обновить',
    },
  ];

  return (
    <ScreenLayout
      title="Сотрудники"
      subtitle="Добавьте сотрудника с его Telegram ID — и он сможет войти в систему со своего телефона"
      onBack={() => navigate('/dashboard')}
      actions={actions}
    >
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Фамилия</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Петров"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Имя</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Пётр"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Телефон (необязательно)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 000-00-00"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Telegram ID</label>
            <input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="123456789"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Сотрудник может узнать свой ID у бота @userinfobot
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
          >
            {saving ? 'Сохранение...' : 'Добавить сотрудника'}
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Загрузка...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
          <p className="text-red-400 text-sm">Ошибка: {error}</p>
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <EmptyState icon={UserCheck} title="Сотрудников пока нет" />
      )}

      {!loading && !error && employees.length > 0 && (
        <div className="space-y-2">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-slate-100">
                  {employee.lastName} {employee.firstName}
                </div>
                <div className="flex items-center gap-2">
                  {!employee.isActive && (
                    <span className="text-xs text-slate-500">неактивен</span>
                  )}
                  <StatusBadge
                    label={ROLE_LABELS[employee.role] || employee.role}
                    className={ROLE_COLORS[employee.role]}
                  />
                </div>
              </div>
              <div className="text-sm text-slate-400">
                {employee.phone || 'Без телефона'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Telegram ID: {employee.telegramId || 'не привязан'}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScreenLayout>
  );
};
