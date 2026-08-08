import { useEffect, useState } from 'react';
import { api } from './api';

export const TestApi = () => {
  const [status, setStatus] = useState<string>('Проверка...');

  useEffect(() => {
    const test = async () => {
      try {
        const response = await api.get('/auth/status');
        setStatus(`✅ Backend работает: ${response.status}`);
      } catch (error: any) {
        setStatus(`❌ Ошибка: ${error.message}`);
      }
    };
    test();
  }, []);

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-100">
      {status}
    </div>
  );
};