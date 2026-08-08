import { useEffect, useState } from 'react';

import { api } from './api';

export interface DashboardStats {
  readonly totalOrders: number;
  readonly activeOrders: number;
  readonly completedOrders: number;
  readonly cancelledOrders: number;
  readonly totalRevenue: number;
  readonly paidTotal: number;
  readonly unpaidTotal: number;
  readonly totalCustomers: number;
}

export interface DashboardOrder {
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly totalAmount: number;
  readonly customer?: {
    readonly firstName: string;
    readonly lastName: string;
  } | null;
}

interface DashboardData {
  readonly stats: DashboardStats;
  readonly recentOrders: ReadonlyArray<DashboardOrder>;
}

/**
 * Loads the dashboard aggregate stats (`GET /orders/stats`) plus the five
 * most recent orders (`GET /orders`) in parallel. Re-runs when `enabled`
 * flips to true (i.e. once the user is authenticated).
 */
export const useDashboardStats = (enabled: boolean) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchStats = async () => {
      try {
        const [statsResponse, ordersResponse, customersResponse] =
          await Promise.all([
            api.get('/orders/stats'),
            api.get('/orders?pageSize=5&sortBy=createdAt&sortOrder=desc'),
            api.get('/customers?pageSize=1'),
          ]);

        setData({
          stats: {
            ...statsResponse.data,
            totalCustomers: customersResponse.data.total || 0,
          } as DashboardStats,
          recentOrders: ordersResponse.data.items || [],
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

  return { data, loading, error };
};
