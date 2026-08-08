import { ArrowLeft, FileText, MapPin, Plus, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../api';
import { OrderDetailScreen } from './OrderDetailScreen';

interface OrderCustomer {
  readonly firstName: string;
  readonly lastName: string;
}

interface Order {
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly totalAmount: number;
  readonly customer?: OrderCustomer | null;
}

interface CustomerOption {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-900/40 text-blue-300 border-blue-800',
  IN_PROGRESS: 'bg-orange-900/40 text-orange-300 border-orange-800',
  COMPLETED: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  CANCELLED: 'bg-red-900/40 text-red-300 border-red-800',
};

export const OrdersScreen = ({ onBack }: { onBack: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [orderNumber, setOrderNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersResponse, customersResponse] = await Promise.all([
        api.get('/orders?pageSize=50'),
        api.get('/customers?pageSize=100'),
      ]);

      setOrders(ordersResponse.data.items || []);
      setCustomers(customersResponse.data.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleCreate = async () => {
    if (!customerId) {
      setFormError('Выберите клиента');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let graveSiteId: string | undefined;

      if (address || latitude !== null) {
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

      const body: Record<string, unknown> = { customerId };

      if (orderNumber) {
        body.number = Number(orderNumber);
      }

      if (graveSiteId) {
        body.graveSiteId = graveSiteId;
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
      setCustomerId('');
      setAmount('');
      setComment('');
      setAddress('');
      setLatitude(null);
      setLongitude(null);
      setPhotos([]);
      setShowForm(false);

      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  if (selectedOrderId) {
    return (
      <OrderDetailScreen
        orderId={selectedOrderId}
        onBack={() => setSelectedOrderId(null)}
      />
    );
  }

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
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-slate-100 mb-4">Заказы</h1>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Номер заказа
            </label>
            <input
              type="number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="1"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Клиент</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            >
              <option value="">— Выберите клиента —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastName} {c.firstName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Сумма (₽)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Адрес места
            </label>
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
                className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600"
              >
                <MapPin className="w-4 h-4 text-blue-400" />
              </button>
            </div>
            {latitude !== null && longitude !== null && (
              <p className="text-xs text-emerald-400 mt-1">
                Координаты: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Фотографии
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              className="w-full text-sm text-slate-300"
            />
            {photos.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Выбрано файлов: {photos.length}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Комментарий
            </label>
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

      {!loading && !error && orders.length === 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
          <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Заказов пока нет</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700 text-left hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-slate-100">
                  № {order.number}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded border ${
                    statusColors[order.status] ||
                    'bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {order.customer
                    ? `${order.customer.lastName} ${order.customer.firstName}`
                    : 'Без клиента'}
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {(order.totalAmount || 0).toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
