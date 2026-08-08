import { Plus, RefreshCw, Search, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api';
import { EmptyState, ScreenLayout } from '../components';

interface Customer {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName?: string | null;
  readonly phone: string;
}

export const CustomersScreen = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ pageSize: '100' });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await api.get(`/customers?${params.toString()}`);
      setCustomers(response.data.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  // Перезагружаем при изменении поиска (с debounce)
  useEffect(() => {
    const timer = setTimeout(loadCustomers, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreate = async () => {
    if (!lastName || !firstName || !phone) {
      setFormError('Заполните фамилию, имя и телефон');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await api.post('/customers', { lastName, firstName, phone });

      setLastName('');
      setFirstName('');
      setPhone('');
      setShowForm(false);

      await loadCustomers();
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
      label: showForm ? 'Закрыть форму' : 'Добавить клиента',
    },
    {
      icon: <RefreshCw className="w-4 h-4 text-slate-400" />,
      onClick: loadCustomers,
      variant: 'ghost' as const,
      label: 'Обновить',
    },
  ];

  return (
    <ScreenLayout title="Клиенты" onBack={() => navigate('/dashboard')} actions={actions}>
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Фамилия</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Иванов"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Имя</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Иван"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Телефон</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 000-00-00"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
          >
            {saving ? 'Сохранение...' : 'Добавить клиента'}
          </button>
        </div>
      )}

      {/* Поиск */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>

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

      {!loading && !error && customers.length === 0 && (
        <EmptyState icon={Users} title="Клиентов пока нет" />
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="space-y-2">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700 text-left hover:bg-slate-700 transition-colors"
            >
              <div className="font-medium text-slate-100 mb-1">
                {customer.lastName} {customer.firstName}
                {customer.middleName ? ` ${customer.middleName}` : ''}
              </div>
              <div className="text-sm text-slate-400">{customer.phone}</div>
            </button>
          ))}
        </div>
      )}
    </ScreenLayout>
  );
};
