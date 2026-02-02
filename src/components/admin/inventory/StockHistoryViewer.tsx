'use client';

import { useEffect, useState } from 'react';
import { productApi, StockHistory } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown, Package, ShoppingCart, RefreshCw, Wrench } from 'lucide-react';

interface StockHistoryViewerProps {
  productId?: string;
  className?: string;
}

const reasonIcons = {
  sale: ShoppingCart,
  restock: Package,
  return: RefreshCw,
  adjustment: Wrench,
  initial: Package,
};

const reasonColors = {
  sale: 'text-red-600 bg-red-50',
  restock: 'text-green-600 bg-green-50',
  return: 'text-blue-600 bg-blue-50',
  adjustment: 'text-yellow-600 bg-yellow-50',
  initial: 'text-gray-600 bg-gray-50',
};

export function StockHistoryViewer({ productId, className }: StockHistoryViewerProps) {
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>('all');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (filter !== 'all') params.reason = filter;

      let response;
      if (productId) {
        response = await productApi.getProductStockHistory(productId, params);
      } else {
        response = await productApi.getStockHistory(params);
      }

      setHistory(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch stock history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, filter, productId]);

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Stock History</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Reasons</option>
          <option value="sale">Sales</option>
          <option value="restock">Restocks</option>
          <option value="return">Returns</option>
          <option value="adjustment">Adjustments</option>
        </select>
      </div>

      {/* History List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              {!productId && (
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
              )}
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Change</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={productId ? 4 : 5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No stock history found
                </td>
              </tr>
            ) : (
              history.map((item) => {
                const Icon = reasonIcons[item.reason] || Package;
                const isPositive = item.quantity > 0;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    {!productId && (
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-sm text-gray-500">{item.variant.name}</p>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          reasonColors[item.reason]
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {item.reason.charAt(0).toUpperCase() + item.reason.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'flex items-center gap-1 font-medium',
                          isPositive ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {isPositive ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                        {isPositive ? '+' : ''}
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.notes || '-'}
                      {item.referenceId && (
                        <p className="text-xs text-gray-400 mt-1">
                          Ref: {item.referenceId}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
