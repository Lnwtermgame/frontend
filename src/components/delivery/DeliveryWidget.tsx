"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from '@/lib/framer-exports';
import { 
  Package, 
  ChevronRight,
  Clock, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useDelivery, DeliveryItem } from '@/lib/context/delivery-context';

interface DeliveryWidgetProps {
  orderId: string;
}

export function DeliveryWidget({ orderId }: DeliveryWidgetProps) {
  const { 
    getDeliveryByOrderId,
  } = useDelivery();
  
  const deliveries = getDeliveryByOrderId(orderId);
  
  if (deliveries.length === 0) {
    return null;
  }
  
  // Format time string
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          icon: <Clock className="text-amber-400" size={16} />, 
          label: 'Pending',
          bgColor: 'bg-amber-900/30', 
          textColor: 'text-amber-400', 
          borderColor: 'border-amber-500/20' 
        };
      case 'processing':
        return { 
          icon: <RefreshCw className="text-blue-400 animate-spin" size={16} />, 
          label: 'Processing',
          bgColor: 'bg-blue-900/30', 
          textColor: 'text-blue-400', 
          borderColor: 'border-blue-500/20' 
        };
      case 'delivered':
        return { 
          icon: <CheckCircle className="text-green-400" size={16} />, 
          label: 'Delivered',
          bgColor: 'bg-green-900/30', 
          textColor: 'text-green-400', 
          borderColor: 'border-green-500/20' 
        };
      case 'failed':
        return { 
          icon: <AlertCircle className="text-red-400" size={16} />, 
          label: 'Failed',
          bgColor: 'bg-red-900/30', 
          textColor: 'text-red-400', 
          borderColor: 'border-red-500/20' 
        };
      case 'cancelled':
        return { 
          icon: <XCircle className="text-mali-text-secondary" size={16} />, 
          label: 'Cancelled',
          bgColor: 'bg-mali-blue/20', 
          textColor: 'text-mali-text-secondary', 
          borderColor: 'border-mali-blue/20' 
        };
      default:
        return { 
          icon: <Package className="text-mali-blue-accent" size={16} />, 
          label: status.charAt(0).toUpperCase() + status.slice(1),
          bgColor: 'bg-mali-blue/20', 
          textColor: 'text-mali-blue-accent', 
          borderColor: 'border-mali-blue/20' 
        };
    }
  };
  
  return (
    <div className="bg-mali-card border border-mali-blue/20 rounded-lg overflow-hidden">
      <div className="p-3 bg-mali-blue/10 border-b border-mali-blue/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="text-mali-blue-accent" size={18} />
          <h3 className="text-sm font-medium text-white">Delivery Status</h3>
        </div>
        <div className="text-xs text-mali-text-secondary">
          {deliveries.length} item{deliveries.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="divide-y divide-mali-blue/10">
        {deliveries.map(delivery => {
          const statusDisplay = getStatusDisplay(delivery.deliveryStatus);
          
          return (
            <Link 
              key={delivery.id} 
              href={`/delivery/${delivery.id}`}
              className="block p-3 hover:bg-mali-blue/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white mb-1">{delivery.productName}</div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 text-xs rounded-full border ${statusDisplay.bgColor} ${statusDisplay.textColor} ${statusDisplay.borderColor} flex items-center gap-1`}>
                      {statusDisplay.icon}
                      {statusDisplay.label}
                    </div>
                    {delivery.deliveryStatus === 'delivered' && delivery.actualDeliveryTime && (
                      <div className="text-xs text-mali-text-secondary">
                        Delivered: {formatTime(delivery.actualDeliveryTime)}
                      </div>
                    )}
                    {delivery.deliveryStatus === 'pending' && delivery.estimatedDeliveryTime && (
                      <div className="text-xs text-mali-text-secondary">
                        Expected: {formatTime(delivery.estimatedDeliveryTime)}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-mali-text-secondary" size={18} />
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-3 border-t border-mali-blue/20 text-center">
        <Link
          href="/delivery"
          className="text-xs text-mali-blue-accent hover:underline flex items-center justify-center gap-1"
        >
          View all deliveries
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
} 
