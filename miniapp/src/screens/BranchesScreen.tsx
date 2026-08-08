import { Building, Plus, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api';
import { EmptyState, ScreenLayout } from '../components';

interface Branch {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly phone: string | null;
}

export const BranchesScreen = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const loadBranches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/branches?pageSize=100');
      setBranches(response.data.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setShowForm(false);
    setFormError(null);
  };

  const handleCreate = async () => {
    if (!name) {
      setFormError('Укажите название филиала');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = { name };

      if (address) {
        body.address = address;
      }

      if (phone) {
        body.phone = phone;
      }

      await api.post('/branches', body);
      resetForm();
      await loadBranches();
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
      label: showForm ? 'Закрыть форму' : 'Добавить филиал',
    },
    {
      icon: <RefreshCw className="w-4 h-4 text-slate-400" />,
      onClick: loadBranches,
      variant: 'ghost' as const,
      label: 'Обновить',
    },
  ];

  return (
    <ScreenLayout title="Филиалы" onBack={() => navigate(-1)} actions={actions}>
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Главный офис"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Адрес</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="г. Москва, ул. Примерная, 1"
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
            {saving ? 'Сохранение...' : 'Добавить филиал'}
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

      {!loading && !error && branches.length === 0 && (
        <EmptyState icon={Building} title="Филиалов пока нет" />
      )}

      {!loading && !error && branches.length > 0 && (
        <div className="space-y-2">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
            >
              <div className="font-medium text-slate-100 mb-1">{branch.name}</div>
              <div className="text-sm text-slate-400">
                {branch.address || 'Без адреса'}
              </div>
              {branch.phone && (
                <div className="text-xs text-slate-500 mt-1">{branch.phone}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScreenLayout>
  );
};
