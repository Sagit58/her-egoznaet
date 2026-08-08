import {
  ArrowLeft,
  MapPin,
  Image,
  User,
  Calendar,
  Plus,
  Pencil,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { api, uploadFile } from '../api';

interface FileItem {
  readonly id: string;
  readonly originalName: string;
  readonly category: string;
}

interface OrderDetail {
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly totalAmount: number;
  readonly comment?: string | null;
  readonly createdAt: string;
  readonly customer: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly phone: string;
  };
  readonly graveSite?: {
    readonly id: string;
    readonly name: string;
    readonly address: string | null;
    readonly latitude: number | null;
    readonly longitude: number | null;
  } | null;
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

export const OrderDetailScreen = ({
  orderId,
  onBack,
}: {
  orderId: string;
  onBack: () => void;
}) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'location'>(
    'info',
  );

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [editingLocation, setEditingLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await api.get(`/files?orderId=${orderId}`);
      const items: FileItem[] = response.data.items || [];
      setFiles(items);

      for (const item of items) {
        try {
          const download = await api.get(`/files/${item.id}/download`);
          const url =
            typeof download.data === 'string'
              ? download.data
              : download.data.url;

          if (url) {
            setPhotoUrls((prev) => ({ ...prev, [item.id]: url }));
          }
        } catch {
          // пропускаем файл, если не удалось получить ссылку
        }
      }
    } catch {
      // файлы не критичны
    }
  };

  useEffect(() => {
    loadOrder();
    loadFiles();
  }, [orderId]);

  const handleUploadPhotos = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(fileList)) {
        await uploadFile(file, { category: 'SURVEY_PHOTO', orderId });
      }

      await loadFiles();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Ошибка');
    } finally {
      setUploading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается');
      return;
    }

    setDetecting(true);
    setLocationError(null);

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
        setLocationError('Не удалось определить местоположение');
        setDetecting(false);
      },
    );
  };

  const handleSaveLocation = async () => {
    if (!order) {
      return;
    }

    setSavingLocation(true);
    setLocationError(null);

    try {
      let graveSiteId = order.graveSite?.id;

      if (!graveSiteId) {
        const graveSiteBody: Record<string, unknown> = {
          customerId: order.customer.id,
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

        const created = await api.post('/grave-sites', graveSiteBody);
        graveSiteId = created.data.id;

        await api.patch(`/orders/${orderId}`, { graveSiteId });
      } else {
        const updateBody: Record<string, unknown> = {};

        if (address) {
          updateBody.address = address;
        }

        if (latitude !== null) {
          updateBody.latitude = latitude;
        }

        if (longitude !== null) {
          updateBody.longitude = longitude;
        }

        await api.patch(`/grave-sites/${graveSiteId}`, updateBody);
      }

      setEditingLocation(false);
      setAddress('');
      setLatitude(null);
      setLongitude(null);

      await loadOrder();
    } catch (err: any) {
      setLocationError(err.response?.data?.message || err.message || 'Ошибка');
    } finally {
      setSavingLocation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center">
        <p className="text-slate-400">Загрузка...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
          <p className="text-red-400 text-sm">Ошибка: {error}</p>
        </div>
      </div>
    );
  }

  const openGoogleMaps = () => {
    if (order.graveSite?.latitude && order.graveSite?.longitude) {
      const url = `https://www.google.com/maps?q=${order.graveSite.latitude},${order.graveSite.longitude}`;
      window.open(url, '_blank');
    }
  };

  const showLocationForm = editingLocation || !order.graveSite;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <div className="p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-slate-100">
              № {order.number}
            </h1>
            <span
              className={`text-xs px-2 py-1 rounded border ${
                statusColors[order.status] || 'bg-slate-700 text-slate-300'
              }`}
            >
              {statusLabels[order.status] || order.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Сумма:</span>
            <span className="text-slate-100 font-medium">
              {order.totalAmount.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Инфо
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'photos'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Фото ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'location'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Место
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
                <User className="w-4 h-4" />
                Клиент
              </div>
              <div className="text-slate-100 font-medium">
                {order.customer.lastName} {order.customer.firstName}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {order.customer.phone}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                Дата создания
              </div>
              <div className="text-slate-100">
                {new Date(order.createdAt).toLocaleString('ru-RU')}
              </div>
            </div>

            {order.comment && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-2">Комментарий</div>
                <div className="text-slate-100 text-sm">{order.comment}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <label className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg p-3 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                {uploading ? 'Загрузка...' : 'Добавить фото'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={(e) => {
                    handleUploadPhotos(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
              {uploadError && (
                <p className="text-red-400 text-sm mt-2">{uploadError}</p>
              )}
            </div>

            {files.length === 0 ? (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
                <Image className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Фотографии пока не добавлены
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
                  >
                    {photoUrls[file.id] ? (
                      <img
                        src={photoUrls[file.id]}
                        alt={file.originalName}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center">
                        <Image className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-slate-400 truncate">
                        {file.originalName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            {showLocationForm ? (
              <div className="space-y-3">
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

                {locationError && (
                  <p className="text-red-400 text-sm">{locationError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLocation}
                    disabled={savingLocation}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors"
                  >
                    {savingLocation ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  {order.graveSite && (
                    <button
                      onClick={() => setEditingLocation(false)}
                      className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg p-3 transition-colors"
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {order.graveSite?.address && (
                  <div className="mb-3">
                    <div className="text-sm text-slate-400 mb-1">Адрес</div>
                    <div className="text-slate-100">
                      {order.graveSite.address}
                    </div>
                  </div>
                )}

                {order.graveSite?.latitude !== null &&
                order.graveSite?.longitude !== null ? (
                  <button
                    onClick={openGoogleMaps}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg p-3 transition-colors flex items-center justify-center gap-2 mb-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Открыть в Google Maps
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm mb-2">
                    Координаты не указаны
                  </p>
                )}

                <button
                  onClick={() => {
                    setAddress(order.graveSite?.address || '');
                    setEditingLocation(true);
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg p-3 transition-colors flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Изменить место
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};