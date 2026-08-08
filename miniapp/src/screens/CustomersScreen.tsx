import { ArrowLeft, Plus, RefreshCw, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../api';

interface Customer {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName?: string | null;
  readonly phone: string;
}

export const CustomersScreen = ({ onBack }: { onBack: () => void }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/customers?pageSize=100');
      setCustomers(response.data.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500"
          >
            {showForm ? (
              <X className="w-4 h-4 text-white" />
            ) : (
              <Plus className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={loadCustomers}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-slate-100 mb-4">Клиенты</h1>

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
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
          <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Клиентов пока нет</p>
        </div>
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="space-y-2">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
            >
              <div className="font-medium text-slate-100 mb-1">
                {customer.lastName} {customer.firstName}
              </div>
              <div className="text-sm text-slate-400">{customer.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};