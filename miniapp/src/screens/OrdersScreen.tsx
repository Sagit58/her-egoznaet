import { FileText, Plus, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { api } from '../api';
import {
  CustomerCombobox,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenLayout,
  StatusBadge,
} from '../components';
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  formatRub,
} from '../constants';

interface OrderCustomer {
  readonly firstName: string;
  readonly lastName: string;
}

interface Order {
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly totalAmount: number;
  readonly paidAmount?: number;
  readonly customer?: OrderCustomer | null;
}

type SortField = 'createdAt' | 'number' | 'totalAmount';

const SORT_LABELS: Record<SortField, string> = {
  createdAt: 'По дате',
  number: 'По номеру',
  totalAmount: 'По сумме',
};

export const OrdersScreen = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [orderNumber, setOrderNumber] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  // Режим клиента в форме заказа: выбор существующего или создание нового «на лету».
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newMiddleName, setNewMiddleName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newComment, setNewComment] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ pageSize: '100' });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (statusFilter) {
        params.set('status', statusFilter);
      }

      params.set('sortBy', sortBy);
      params.set('sortOrder', 'desc');

      const ordersResponse = await api.get(`/orders?${params.toString()}`);

      setOrders(ordersResponse.data.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  // Перезагружаем при изменении фильтров/поиска/сортировки
  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sortBy]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Геолокация не поддерживается');
      return;
    }

    setDetecting(true);
    setFormError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);

        if (!address) {
          setAddress(
            `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          );
        }

        setDetecting(false);
      },
      () => {
        setFormError('Не удалось определить местоположение');
        setDetecting(false);
      },
    );
  };

  const uploadPhoto = async (orderId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('category', 'SURVEY_PHOTO');
    form.append('orderId', orderId);

    await api.post('/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const resetCustomerFields = () => {
    setCustomerMode('existing');
    setCustomerId(null);
    setNewLastName('');
    setNewFirstName('');
    setNewMiddleName('');
    setNewPhone('');
    setNewEmail('');
    setNewComment('');
  };

  const handleSwitchToNewCustomer = () => {
    setCustomerMode('new');
    setCustomerId(null);
  };

  const handleCreate = async () => {
    if (customerMode === 'new') {
      if (!newLastName || !newFirstName || !newPhone) {
        setFormError('Заполните фамилию, имя и телефон нового клиента');
        return;
      }
    } else if (!customerId) {
      setFormError('Выберите клиента');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let graveSiteId: string | undefined;

      // Место захоронения связывается с customerId. Для нового клиента
      // id появится только после создания заказа, поэтому в режиме «новый»
      // grave_site здесь не создаём (его можно заполнить позже на экране заказа).
      if (customerMode === 'existing' && customerId && (address || latitude !== null)) {
        const graveSiteBody: Record<string, unknown> = {
          customerId,
          name: 'Место захоронения',
        };

        if (address) {
          graveSiteBody.address = address;
        }

        if (latitude !== null) {
          graveSiteBody.latitude = latitude;
        }

        if (longitude !== null) {
          graveSiteBody.longitude = longitude;
        }

        const graveSiteResponse = await api.post('/grave-sites', graveSiteBody);
        graveSiteId = graveSiteResponse.data.id;
      }

      const body: Record<string, unknown> = {};

      if (customerMode === 'new') {
        const newCustomer: Record<string, unknown> = {
          lastName: newLastName,
          firstName: newFirstName,
          phone: newPhone,
        };

        if (newMiddleName) {
          newCustomer.middleName = newMiddleName;
        }

        if (newEmail) {
          newCustomer.email = newEmail;
        }

        if (newComment) {
          newCustomer.comment = newComment;
        }

        body.newCustomer = newCustomer;
      } else {
        body.customerId = customerId;

        if (graveSiteId) {
          body.graveSiteId = graveSiteId;
        }
      }

      if (orderNumber) {
        body.number = Number(orderNumber);
      }

      if (amount) {
        body.totalAmount = Number(amount);
      }

      if (comment) {
        body.comment = comment;
      }

      const orderResponse = await api.post('/orders', body);

      for (const photo of photos) {
        await uploadPhoto(orderResponse.data.id, photo);
      }

      setOrderNumber('');
      resetCustomerFields();
      setAmount('');
      setComment('');
      setAddress('');
      setLatitude(null);
      setLongitude(null);
      setPhotos([]);
      setShowForm(false);

      toast.success('Заказ создан');
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Ошибка';
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const actions = [
    {
      icon: showForm ? <X className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />,
      onClick: () => setShowForm(!showForm),
      variant: 'primary' as const,
      label: showForm ? 'Закрыть форму' : 'Создать заказ',
    },
    {
      icon: <RefreshCw className="w-4 h-4 text-slate-400" />,
      onClick: loadData,
      variant: 'ghost' as const,
      label: 'Обновить',
    },
  ];

  return (
    <ScreenLayout title="Заказы" onBack={() => navigate('/dashboard')} actions={actions}>
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Номер заказа</label>
            <input
              type="number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="авто, если пусто"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          {customerMode === 'existing' ? (
            <>
              <CustomerCombobox
                value={customerId}
                onChange={setCustomerId}
                onCreateNew={handleSwitchToNewCustomer}
              />
              {customerId && (
                <button
                  type="button"
                  onClick={resetCustomerFields}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Сменить клиента
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3 rounded-lg bg-slate-700/30 p-3 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400 font-medium">
                  Новый клиент
                </span>
                <button
                  type="button"
                  onClick={resetCustomerFields}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  ← Выбрать существующего
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Фамилия</label>
                <input
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Иванов"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Имя</label>
                <input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Иван"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Отчество</label>
                <input
                  value={newMiddleName}
                  onChange={(e) => setNewMiddleName(e.target.value)}
                  placeholder="Иванович"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Телефон</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+7 900 000-00-00"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ivanov@example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Комментарий</label>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Доп. информация о клиенте"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Сумма (₽)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Адрес места</label>
            <div className="flex gap-2">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Кладбище, участок"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
              />
              <button
                onClick={detectLocation}
                disabled={detecting}
                className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50"
                aria-label="Определить геолокацию"
              >
                📍
              </button>
            </div>
            {latitude !== null && longitude !== null && (
              <p className="text-xs text-emerald-400 mt-1">
                Координаты: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Фотографии</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              className="w-full text-sm text-slate-300"
            />
            {photos.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">Выбрано файлов: {photos.length}</p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Комментарий</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Памятник из гранита"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
          >
            {saving ? 'Сохранение...' : 'Создать заказ'}
          </button>
        </div>
      )}

      {/* Поиск */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по номеру или клиенту..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Фильтр по статусу */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
            !statusFilter
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          Все
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {ORDER_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Сортировка */}
      <div className="flex gap-2 mb-4">
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSortBy(value as SortField)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              sortBy === value
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}

      {error && <ErrorState error={error} />}

      {!loading && !error && orders.length === 0 && (
        <EmptyState icon={FileText} title="Заказов пока нет" hint="Нажмите «+», чтобы создать" />
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => {
            const paid = order.paidAmount ?? 0;
            const hasDebt = order.totalAmount > paid && order.status !== 'CANCELLED';

            return (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700 text-left hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-100">№ {order.number}</div>
                  <StatusBadge
                    label={ORDER_STATUS_LABELS[order.status] || order.status}
                    className={ORDER_STATUS_COLORS[order.status]}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    {order.customer
                      ? `${order.customer.lastName} ${order.customer.firstName}`
                      : 'Без клиента'}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-200">
                      {formatRub(order.totalAmount || 0)}
                    </div>
                    {hasDebt && (
                      <div className="text-xs text-orange-400">
                        долг {formatRub(order.totalAmount - paid)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </ScreenLayout>
  );
};
