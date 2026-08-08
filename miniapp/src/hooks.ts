import { useEffect, useState } from 'react';
import { api } from './api';

export interface DashboardStats {
  readonly totalOrders: number;
  readonly totalCustomers: number;
  readonly activeOrders: number;
  readonly totalRevenue: number;
}

export const useDashboardStats = (enabled: boolean) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchStats = async () => {
      try {
        const [ordersResponse, customersResponse] = await Promise.all([
          api.get('/orders?pageSize=1'),
          api.get('/customers?pageSize=1'),
        ]);

        const orders = ordersResponse.data;
        const customers = customersResponse.data;

        setStats({
          totalOrders: orders.total || 0,
          totalCustomers: customers.total || 0,
          activeOrders: orders.total || 0,
          totalRevenue: 0,
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [enabled]);

  return { stats, loading, error };
};