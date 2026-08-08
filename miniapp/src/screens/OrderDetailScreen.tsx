import { ArrowLeft, MapPin, Image as ImageIcon, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, uploadFile } from '../api';
import { EmptyState, StatusBadge } from '../components';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABELS,
  STAGE_STATUS_COLORS,
  STAGE_STATUS_LABELS,
  STAGE_TYPE_LABELS,
  STAGE_TYPE_ORDER,
  formatRub,
} from '../constants';

interface FileItem {
  readonly id: string;
  readonly originalName: string;
  readonly category: string;
}

interface OrderStage {
  readonly id: string;
  readonly type: string;
  readonly status: string;
  readonly assignedEmployee: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
  } | null;
  readonly plannedStart: string | null;
  readonly plannedEnd: string | null;
  readonly completedAt: string | null;
  readonly comment: string | null;
}

interface Payment {
  readonly id: string;
  readonly amount: number;
  readonly method: string;
  readonly paidAt: string;
  readonly comment: string | null;
}

interface OrderDetail {
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly comment?: string | null;
  readonly createdAt: string;
  readonly customer: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly phone: string;
  };
  readonly grave_site?: {
    readonly id: string;
    readonly name: string;
    readonly address: string | null;
    readonly latitude: number | null;
    readonly longitude: number | null;
  } | null;
  readonly stages: ReadonlyArray<OrderStage>;
  readonly payments: ReadonlyArray<Payment>;
}

interface EmployeeOption {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
}

type Tab = 'info' | 'stages' | 'payments' | 'photos' | 'location';

export const OrderDetailScreen = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [editingLocation, setEditingLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Stage update
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentComment, setPaymentComment] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!orderId) {
      return;
    }

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
    if (!orderId) {
      return;
    }

    try {
      const response = await api.get(`/files?orderId=${orderId}`);
      const items: FileItem[] = response.data.items || [];
      setFiles(items);

      for (const item of items) {
        try {
          const download = await api.get(`/files/${item.id}/download`);
          const url =
            typeof download.data === 'string' ? download.data : download.data.url;

          if (url) {
            setPhotoUrls((prev) => ({ ...prev, [item.id]: url }));
          }
        } catch {
          /* пропускаем файл, если не удалось получить ссылку */
        }
      }
    } catch {
      /* файлы не критичны */
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees?pageSize=200');
      setEmployees(response.data.items || []);
    } catch {
      /* сотрудники нужны только для назначения этапов */
    }
  };

  useEffect(() => {
    loadOrder();
    loadFiles();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleUploadPhotos = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !orderId) {
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
      let graveSiteId = order.grave_site?.id;

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

        await api.patch(`/orders/${order.id}`, { graveSiteId });
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

  const handleChangeStatus = async (newStatus: string) => {
    if (!order) {
      return;
    }

    setChangingStatus(true);
    setStatusError(null);

    try {
      await api.post(`/orders/${order.id}/status`, { status: newStatus });
      await loadOrder();
    } catch (err: any) {
      setStatusError(err.response?.data?.message || err.message || 'Ошибка');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleUpdateStage = async (
    stageType: string,
    newStatus: string,
    assignedEmployeeId?: string,
  ) => {
    if (!order) {
      return;
    }

    setUpdatingStage(stageType);
    try {
      const body: Record<string, unknown> = { status: newStatus };

      if (assignedEmployeeId !== undefined) {
        body.assignedEmployeeId = assignedEmployeeId || null;
      }

      await api.patch(`/orders/${order.id}/stages/${stageType}`, body);
      await loadOrder();
    } catch (err: any) {
      setStatusError(err.response?.data?.message || err.message || 'Ошибка');
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleAddPayment = async () => {
    if (!order || !paymentAmount) {
      return;
    }

    setAddingPayment(true);
    setPaymentError(null);

    try {
      const body: Record<string, unknown> = {
        amount: Number(paymentAmount),
        method: paymentMethod,
      };

      if (paymentComment) {
        body.comment = paymentComment;
      }

      await api.post(`/orders/${order.id}/payments`, body);
      setPaymentAmount('');
      setPaymentComment('');
      await loadOrder();
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || err.message || 'Ошибка');
    } finally {
      setAddingPayment(false);
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
          onClick={() => navigate(-1)}
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
    if (order.grave_site?.latitude && order.grave_site?.longitude) {
      const url = `https://www.google.com/maps?q=${order.grave_site.latitude},${order.grave_site.longitude}`;
      window.open(url, '_blank');
    }
  };

  const showLocationForm = editingLocation || !order.grave_site;
  const debt = order.totalAmount - order.paidAmount;
  const paidPercent =
    order.totalAmount > 0
      ? Math.min((order.paidAmount / order.totalAmount) * 100, 100)
      : 0;

  const tabs: ReadonlyArray<{ readonly id: Tab; readonly label: string; readonly count?: number }> = [
    { id: 'info', label: 'Инфо' },
    { id: 'stages', label: 'Этапы' },
    { id: 'payments', label: 'Оплаты' },
    { id: 'photos', label: 'Фото', count: files.length },
    { id: 'location', label: 'Место' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-slate-100">№ {order.number}</h1>
            <StatusBadge
              label={ORDER_STATUS_LABELS[order.status] || order.status}
              className={ORDER_STATUS_COLORS[order.status]}
            />
          </div>

          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Сумма:</span>
            <span className="text-slate-100 font-medium">
              {formatRub(order.totalAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Оплачено:</span>
            <span className="text-emerald-300 font-medium">
              {formatRub(order.paidAmount)}
            </span>
          </div>
          {debt > 0 && order.status !== 'CANCELLED' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Долг:</span>
              <span className="text-orange-400 font-medium">{formatRub(debt)}</span>
            </div>
          )}

          {/* Прогресс оплаты */}
          {order.totalAmount > 0 && (
            <div className="mt-3">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && ` (${tab.count})`}
            </button>
          ))}
        </div>

        {/* ИНФО */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <button
                onClick={() => navigate(`/customers/${order.customer.id}`)}
                className="flex items-start gap-3 text-left w-full"
              >
                <div className="p-2 rounded-md bg-slate-700">
                  <span className="text-sm">👤</span>
                </div>
                <div>
                  <div className="text-slate-100 font-medium">
                    {order.customer.lastName} {order.customer.firstName}
                  </div>
                  <div className="text-sm text-slate-400 mt-0.5">
                    {order.customer.phone}
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Дата создания</div>
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

            {/* Смена статуса */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-3">Статус заказа</div>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleChangeStatus(status)}
                    disabled={changingStatus || status === order.status}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 ${
                      ORDER_STATUS_COLORS[status]
                    }`}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
              {statusError && (
                <p className="text-red-400 text-xs mt-2">{statusError}</p>
              )}
              {changingStatus && (
                <p className="text-slate-500 text-xs mt-2">Изменение...</p>
              )}
            </div>
          </div>
        )}

        {/* ЭТАПЫ */}
        {activeTab === 'stages' && (
          <div className="space-y-3">
            {STAGE_TYPE_ORDER.map((type) => {
              const stage = order.stages.find((s) => s.type === type);

              if (!stage) {
                return null;
              }

              const isUpdating = updatingStage === type;
              const isOverflow =
                stage.status === 'DONE' && type === 'INSTALLATION';

              return (
                <div
                  key={stage.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-slate-100">
                      {STAGE_TYPE_LABELS[type] || type}
                    </div>
                    <StatusBadge
                      label={STAGE_STATUS_LABELS[stage.status] || stage.status}
                      className={STAGE_STATUS_COLORS[stage.status]}
                    />
                  </div>

                  {stage.assignedEmployee && (
                    <div className="text-xs text-slate-400 mb-2">
                      Исполнитель: {stage.assignedEmployee.firstName}{' '}
                      {stage.assignedEmployee.lastName}
                    </div>
                  )}

                  <select
                    value={stage.assignedEmployee?.id || ''}
                    onChange={(e) =>
                      handleUpdateStage(type, stage.status, e.target.value)
                    }
                    disabled={isUpdating}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-slate-100 mb-2"
                  >
                    <option value="">— Назначить исполнителя —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.lastName} {emp.firstName}
                      </option>
                    ))}
                  </select>

                  {stage.completedAt && (
                    <div className="text-xs text-emerald-400 mb-2">
                      Завершён: {new Date(stage.completedAt).toLocaleString('ru-RU')}
                    </div>
                  )}
                  {stage.comment && (
                    <div className="text-xs text-slate-400 mb-2">
                      {stage.comment}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {stage.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStage(type, 'IN_PROGRESS')}
                        disabled={isUpdating}
                        className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg p-2 transition-colors"
                      >
                        В работу
                      </button>
                    )}
                    {stage.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStage(type, 'DONE')}
                        disabled={isUpdating}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg p-2 transition-colors"
                      >
                        Завершить
                      </button>
                    )}
                    {stage.status === 'DONE' && !isOverflow && (
                      <button
                        onClick={() => handleUpdateStage(type, 'IN_PROGRESS')}
                        disabled={isUpdating}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-medium rounded-lg p-2 transition-colors"
                      >
                        Вернуть в работу
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ОПЛАТЫ */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Сумма (₽)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Способ оплаты</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Комментарий</label>
                <input
                  value={paymentComment}
                  onChange={(e) => setPaymentComment(e.target.value)}
                  placeholder="Предоплата"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-100"
                />
              </div>
              {paymentError && <p className="text-red-400 text-sm">{paymentError}</p>}
              <button
                onClick={handleAddPayment}
                disabled={addingPayment || !paymentAmount}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {addingPayment ? 'Добавление...' : 'Добавить платёж'}
              </button>
            </div>

            {order.payments.length === 0 ? (
              <EmptyState icon={Plus} title="Платежей пока нет" />
            ) : (
              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-slate-100 font-medium">
                        {formatRub(payment.amount)}
                      </div>
                      <StatusBadge
                        label={PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                        className="bg-slate-700 text-slate-300 border-slate-600"
                      />
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(payment.paidAt).toLocaleString('ru-RU')}
                    </div>
                    {payment.comment && (
                      <div className="text-xs text-slate-400 mt-1">
                        {payment.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ФОТО */}
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
              <EmptyState icon={ImageIcon} title="Фотографии пока не добавлены" />
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
                        <ImageIcon className="w-8 h-8 text-slate-500" />
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

        {/* МЕСТО */}
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
                      className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50"
                      aria-label="Определить геолокацию"
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
                  {order.grave_site && (
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
                {order.grave_site?.address && (
                  <div className="mb-3">
                    <div className="text-sm text-slate-400 mb-1">Адрес</div>
                    <div className="text-slate-100">{order.grave_site.address}</div>
                  </div>
                )}

                {order.grave_site?.latitude !== null &&
                order.grave_site?.longitude !== null ? (
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
                    setAddress(order.grave_site?.address || '');
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
