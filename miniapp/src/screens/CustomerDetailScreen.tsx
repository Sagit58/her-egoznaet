import { Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../api';
import { EmptyState, ScreenLayout, StatusBadge } from '../components';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, formatRub } from '../constants';

interface CustomerContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly relation: string | null;
}

interface CustomerNote {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
  readonly author: {
    readonly firstName: string;
    readonly lastName: string;
  };
}

interface CustomerDetail {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName: string | null;
  readonly phone: string;
  readonly email: string | null;
  readonly comment: string | null;
  readonly contacts: ReadonlyArray<CustomerContact>;
  readonly notes: ReadonlyArray<CustomerNote>;
}

interface OrderRef {
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly totalAmount: number;
}

export const CustomerDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<OrderRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadCustomer = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        api.get(`/customers/${id}`).then((res) => setCustomer(res.data)),
        api
          .get(`/orders?customerId=${id}&pageSize=100`)
          .then((res) => {
            if (res.data && Array.isArray(res.data.items)) {
              setOrders(res.data.items);
            }
          })
          .catch(() => {
            /* заказы у клиента могут отсутствовать — не критично */
          }),
      ]);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddContact = async () => {
    if (!id || !contactName || !contactPhone) {
      return;
    }

    setSavingContact(true);

    try {
      const body: Record<string, unknown> = { name: contactName, phone: contactPhone };

      if (contactRelation) {
        body.relation = contactRelation;
      }

      await api.post(`/customers/${id}/contacts`, body);
      await loadCustomer();
      setContactName('');
      setContactPhone('');
      setContactRelation('');
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!id) {
      return;
    }

    try {
      await api.delete(`/customers/${id}/contacts/${contactId}`);
      await loadCustomer();
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления');
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) {
      return;
    }

    setSavingNote(true);

    try {
      await api.post(`/customers/${id}/notes`, { text: noteText.trim() });
      await loadCustomer();
      setNoteText('');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <ScreenLayout onBack={() => navigate(-1)}>
        <p className="text-slate-400">Загрузка...</p>
      </ScreenLayout>
    );
  }

  if (error || !customer) {
    return (
      <ScreenLayout onBack={() => navigate(-1)}>
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
          <p className="text-red-400 text-sm">Ошибка: {error || 'Клиент не найден'}</p>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title={`${customer.lastName} ${customer.firstName}`} onBack={() => navigate(-1)}>
      <div className="space-y-3">
        {/* Контактные данные */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Телефон</div>
          <div className="text-slate-100">{customer.phone}</div>
          {customer.email && (
            <>
              <div className="text-sm text-slate-400 mt-2 mb-1">Email</div>
              <div className="text-slate-100">{customer.email}</div>
            </>
          )}
          {customer.comment && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Комментарий</div>
              <div className="text-slate-100 text-sm">{customer.comment}</div>
            </div>
          )}
        </div>

        {/* Контакты (родственники и т.д.) */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">Контакты</span>
          </div>

          {customer.contacts.length === 0 ? (
            <p className="text-slate-500 text-sm">Контактов пока нет</p>
          ) : (
            <div className="space-y-2 mb-3">
              {customer.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start justify-between bg-slate-700/50 rounded-lg p-3"
                >
                  <div>
                    <div className="text-slate-100 text-sm">{contact.name}</div>
                    <div className="text-slate-400 text-xs">{contact.phone}</div>
                    {contact.relation && (
                      <div className="text-slate-500 text-xs">{contact.relation}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Удалить контакт"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-3 border-t border-slate-700">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Имя"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-slate-100"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Телефон"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-slate-100"
            />
            <input
              value={contactRelation}
              onChange={(e) => setContactRelation(e.target.value)}
              placeholder="Кем приходится (например, сын)"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-slate-100"
            />
            <button
              onClick={handleAddContact}
              disabled={savingContact || !contactName || !contactPhone}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-2 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Добавить контакт
            </button>
          </div>
        </div>

        {/* Заметки */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400 mb-3">Заметки</div>

          {customer.notes.length === 0 ? (
            <p className="text-slate-500 text-sm mb-3">Заметок пока нет</p>
          ) : (
            <div className="space-y-2 mb-3">
              {customer.notes.map((note) => (
                <div key={note.id} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-slate-100 text-sm">{note.text}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    {note.author.firstName} {note.author.lastName} ·{' '}
                    {new Date(note.createdAt).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Новая заметка..."
            rows={2}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-slate-100 resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={savingNote || !noteText.trim()}
            className="w-full mt-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium rounded-lg p-2 text-sm transition-colors"
          >
            {savingNote ? 'Сохранение...' : 'Добавить заметку'}
          </button>
        </div>

        {/* Заказы клиента */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400 mb-3">
            Заказы ({orders.length})
          </div>

          {orders.length === 0 ? (
            <EmptyState icon={Users} title="Заказов пока нет" />
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full bg-slate-700/50 hover:bg-slate-700 rounded-lg p-3 text-left transition-colors flex items-center justify-between"
                >
                  <div className="font-medium text-slate-100">№ {order.number}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-200">{formatRub(order.totalAmount || 0)}</span>
                    <StatusBadge
                      label={ORDER_STATUS_LABELS[order.status] || order.status}
                      className={ORDER_STATUS_COLORS[order.status]}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScreenLayout>
  );
};
