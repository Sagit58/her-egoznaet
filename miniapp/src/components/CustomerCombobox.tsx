import { Search, UserPlus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { api } from '../api';

interface CustomerOption {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
}

interface CustomerComboboxProps {
  readonly value: string | null;
  readonly onChange: (id: string | null) => void;
  /** Вызывается, когда пользователь нажимает «+ Новый клиент». */
  readonly onCreateNew: () => void;
}

/**
 * Combobox выбора клиента с поиском по имени/фамилии/телефону на бэке.
 * Внизу списка — кнопка «+ Новый клиент», которая открывает инлайн-форму
 * создания клиента прямо в форме заказа (см. OrdersScreen).
 */
export const CustomerCombobox = ({
  value,
  onChange,
  onCreateNew,
}: CustomerComboboxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CustomerOption | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // Синхронизируем выбранный клиент с внешним value
  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
  }, [value]);

  // Поиск с debounce 300мс
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentRequestId = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          search: trimmed,
          pageSize: '20',
        });
        const response = await api.get(`/customers?${params.toString()}`);
        if (requestId.current === currentRequestId) {
          setResults(response.data.items || []);
        }
      } catch {
        if (requestId.current === currentRequestId) {
          setResults([]);
        }
      } finally {
        if (requestId.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Закрытие по клику вне
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (customer: CustomerOption) => {
    setSelected(customer);
    onChange(customer.id);
    setQuery(`${customer.lastName} ${customer.firstName}`);
    setOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null);
    setQuery('');
    setOpen(true);
  };

  const displayValue = selected
    ? `${selected.lastName} ${selected.firstName}`
    : query;

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs text-slate-400 mb-1 block">Клиент</label>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) {
              setSelected(null);
              onChange(null);
            }
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск по имени или телефону..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-9 p-3 text-sm text-slate-100 placeholder:text-slate-500"
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label="Очистить выбор"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-slate-500">Поиск...</div>
            ) : query.trim() && results.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">
                Клиенты не найдены
              </div>
            ) : (
              results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors"
                >
                  <div className="text-sm text-slate-100">
                    {customer.lastName} {customer.firstName}
                  </div>
                  {customer.phone && (
                    <div className="text-xs text-slate-500">
                      {customer.phone}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="w-full flex items-center gap-2 px-3 py-2 border-t border-slate-700 text-blue-400 hover:bg-slate-700 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Создать нового клиента
          </button>
        </div>
      )}
    </div>
  );
};
