'use client';

import { useEffect, useState } from 'react';
import { productApi, StockAlert } from '@/lib/services/product-api';
import { cn } from '@/lib/utils';
import { AlertTriangle, Plus, Trash2, Edit2, Bell } from 'lucide-react';

interface StockAlertManagerProps {
  className?: string;
}

export function StockAlertManager({ className }: StockAlertManagerProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<StockAlert | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    variantId: '',
    threshold: 10,
  });

  const fetchAlerts = async () => {
    try {
      const [allAlerts, triggered] = await Promise.all([
        productApi.getStockAlerts(),
        productApi.getTriggeredAlerts(),
      ]);
      setAlerts(allAlerts.data);
      setTriggeredAlerts(triggered.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAlert) {
        await productApi.updateStockAlert(editingAlert.id, {
          threshold: formData.threshold,
        });
      } else {
        await productApi.createStockAlert({
          productId: formData.productId,
          variantId: formData.variantId || undefined,
          threshold: formData.threshold,
        });
      }
      setShowForm(false);
      setEditingAlert(null);
      setFormData({ productId: '', variantId: '', threshold: 10 });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to save alert:', error);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    try {
      await productApi.deleteStockAlert(alertId);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const handleEdit = (alert: StockAlert) => {
    setEditingAlert(alert);
    setFormData({
      productId: alert.productId,
      variantId: alert.variantId || '',
      threshold: alert.threshold,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Triggered Alerts Banner */}
      {triggeredAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Low Stock Alerts ({triggeredAlerts.length})</h3>
          </div>
          <div className="space-y-2">
            {triggeredAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div className="flex items-center gap-3">
                  {alert.product.imageUrl && (
                    <img
                      src={alert.product.imageUrl}
                      alt={alert.product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{alert.product.name}</p>
                    {alert.variant && (
                      <p className="text-sm text-gray-500">Variant: {alert.variant.name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-600 font-medium">
                    Stock: {alert.variant?.stockQuantity ?? alert.product.stockQuantity}
                  </p>
                  <p className="text-xs text-gray-500">Threshold: {alert.threshold}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Stock Alerts</h2>
        <button
          onClick={() => {
            setEditingAlert(null);
            setFormData({ productId: '', variantId: '', threshold: 10 });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Alert
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold">{editingAlert ? 'Edit Alert' : 'New Alert'}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product ID</label>
              <input
                type="text"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Product ID"
                required
                disabled={!!editingAlert}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Variant ID (Optional)</label>
              <input
                type="text"
                value={formData.variantId}
                onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Variant ID"
                disabled={!!editingAlert}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Threshold</label>
              <input
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min={1}
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingAlert ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Alerts Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Variant</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Current Stock</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Threshold</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No stock alerts configured
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const currentStock = alert.variant?.stockQuantity ?? alert.product.stockQuantity;
                const isTriggered = currentStock <= alert.threshold;

                return (
                  <tr key={alert.id} className={isTriggered ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {alert.product.imageUrl && (
                          <img
                            src={alert.product.imageUrl}
                            alt={alert.product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span className="font-medium">{alert.product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {alert.variant?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={isTriggered ? 'text-red-600 font-medium' : ''}>
                        {currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{alert.threshold}</td>
                    <td className="px-4 py-3">
                      {isTriggered ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <Bell className="w-4 h-4" />
                          Triggered
                        </span>
                      ) : (
                        <span className="text-green-600 text-sm">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(alert)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
