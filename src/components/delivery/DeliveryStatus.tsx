"use client";

import { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  RefreshCw,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useDelivery, DeliveryItem } from '@/lib/context/delivery-context';

interface DeliveryStatusProps {
  deliveryId: string;
  compact?: boolean;
}

export function DeliveryStatus({ deliveryId, compact = false }: DeliveryStatusProps) {
  const { 
    getDeliveryById, 
    trackDelivery, 
    retryDelivery,
    cancelDelivery,
    resendDeliveryData,
    isPending
  } = useDelivery();
  
  const [showTracking, setShowTracking] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const delivery = getDeliveryById(deliveryId);
  const trackingLogs = trackDelivery(deliveryId);
  
  if (!delivery) {
    return (
      <div className="bg-mali-card border border-mali-blue/20 p-4 rounded-lg">
        <div className="text-mali-text-secondary">Delivery not found</div>
      </div>
    );
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
  
  // Handler for retrying failed deliveries
  const handleRetry = async () => {
    const result = await retryDelivery(deliveryId);
    if (result) {
      setActionMessage({ type: 'success', text: 'Delivery retry initiated successfully' });
    } else {
      setActionMessage({ type: 'error', text: 'Failed to retry delivery' });
    }
    
    // Clear the message after 5 seconds
    setTimeout(() => setActionMessage(null), 5000);
  };
  
  // Handler for cancelling deliveries
  const handleCancel = async () => {
    const result = await cancelDelivery(deliveryId);
    if (result) {
      setActionMessage({ type: 'success', text: 'Delivery cancelled successfully' });
    } else {
      setActionMessage({ type: 'error', text: 'Failed to cancel delivery' });
    }
    
    // Clear the message after 5 seconds
    setTimeout(() => setActionMessage(null), 5000);
  };
  
  // Handler for resending delivery data
  const handleResend = async () => {
    const result = await resendDeliveryData(deliveryId);
    if (result) {
      setActionMessage({ type: 'success', text: 'Delivery data resent successfully' });
    } else {
      setActionMessage({ type: 'error', text: 'Failed to resend delivery data' });
    }
    
    // Clear the message after 5 seconds
    setTimeout(() => setActionMessage(null), 5000);
  };
  
  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          icon: <Clock className="text-amber-400" />, 
          label: 'Pending',
          bgColor: 'bg-amber-900/30', 
          textColor: 'text-amber-400', 
          borderColor: 'border-amber-500/20' 
        };
      case 'processing':
        return { 
          icon: <RefreshCw className="text-blue-400 animate-spin" />, 
          label: 'Processing',
          bgColor: 'bg-blue-900/30', 
          textColor: 'text-blue-400', 
          borderColor: 'border-blue-500/20' 
        };
      case 'delivered':
        return { 
          icon: <CheckCircle className="text-green-400" />, 
          label: 'Delivered',
          bgColor: 'bg-green-900/30', 
          textColor: 'text-green-400', 
          borderColor: 'border-green-500/20' 
        };
      case 'failed':
        return { 
          icon: <AlertCircle className="text-red-400" />, 
          label: 'Failed',
          bgColor: 'bg-red-900/30', 
          textColor: 'text-red-400', 
          borderColor: 'border-red-500/20' 
        };
      case 'cancelled':
        return { 
          icon: <XCircle className="text-mali-text-secondary" />, 
          label: 'Cancelled',
          bgColor: 'bg-mali-blue/20', 
          textColor: 'text-mali-text-secondary', 
          borderColor: 'border-mali-blue/20' 
        };
      default:
        return { 
          icon: <Package className="text-mali-blue-accent" />, 
          label: status.charAt(0).toUpperCase() + status.slice(1),
          bgColor: 'bg-mali-blue/20', 
          textColor: 'text-mali-blue-accent', 
          borderColor: 'border-mali-blue/20' 
        };
    }
  };
  
  const statusDisplay = getStatusDisplay(delivery.deliveryStatus);
  
  if (compact) {
    return (
      <div className="bg-mali-card border border-mali-blue/20 rounded-lg overflow-hidden">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {statusDisplay.icon}
            <span className={`text-sm ${statusDisplay.textColor}`}>{statusDisplay.label}</span>
          </div>
          
          <div className={`text-xs px-2 py-1 rounded-full border ${statusDisplay.bgColor} ${statusDisplay.textColor} ${statusDisplay.borderColor}`}>
            {delivery.productName}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-mali-card border border-mali-blue/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Package className="text-mali-blue-accent" />
          <h3 className="font-medium text-white">{delivery.productName}</h3>
        </div>
        <div className={`px-2 py-1 text-xs rounded-full border ${statusDisplay.bgColor} ${statusDisplay.textColor} ${statusDisplay.borderColor} flex items-center gap-1`}>
          {statusDisplay.icon}
          {statusDisplay.label}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Action message */}
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              actionMessage.type === 'success' 
                ? 'bg-green-900/20 text-green-400 border border-green-500/20' 
                : 'bg-red-900/20 text-red-400 border border-red-500/20'
            }`}
          >
            {actionMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {actionMessage.text}
          </motion.div>
        )}
        
        {/* Delivery details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-mali-text-secondary mb-1">Order ID</div>
            <div className="text-white">{delivery.orderId}</div>
          </div>
          <div>
            <div className="text-mali-text-secondary mb-1">Delivery Method</div>
            <div className="text-white capitalize">{delivery.deliveryMethod.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-mali-text-secondary mb-1">Created</div>
            <div className="text-white">{formatTime(delivery.createdAt)}</div>
          </div>
          <div>
            <div className="text-mali-text-secondary mb-1">Last Updated</div>
            <div className="text-white">{formatTime(delivery.updatedAt)}</div>
          </div>
          {delivery.estimatedDeliveryTime && (
            <div>
              <div className="text-mali-text-secondary mb-1">Estimated Delivery</div>
              <div className="text-white">{formatTime(delivery.estimatedDeliveryTime)}</div>
            </div>
          )}
          {delivery.actualDeliveryTime && (
            <div>
              <div className="text-mali-text-secondary mb-1">Delivered At</div>
              <div className="text-white">{formatTime(delivery.actualDeliveryTime)}</div>
            </div>
          )}
          {delivery.failureReason && (
            <div className="col-span-2">
              <div className="text-mali-text-secondary mb-1">Failure Reason</div>
              <div className="text-red-400">{delivery.failureReason}</div>
            </div>
          )}
        </div>
        
        {/* Delivery data */}
        {delivery.deliveryData && delivery.deliveryStatus === 'delivered' && (
          <div className="mt-4 p-3 bg-mali-blue/5 border border-mali-blue/20 rounded-lg">
            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
              <Package size={16} className="text-mali-blue-accent" />
              Delivery Data
            </h4>
            <div className="space-y-2 text-sm">
              {delivery.deliveryData.code && (
                <div className="flex justify-between items-center">
                  <div className="text-mali-text-secondary">Code:</div>
                  <div className="font-mono text-white bg-mali-blue/20 py-1 px-2 rounded">{delivery.deliveryData.code}</div>
                </div>
              )}
              {delivery.deliveryData.username && (
                <div className="flex justify-between items-center">
                  <div className="text-mali-text-secondary">Username:</div>
                  <div className="font-mono text-white">{delivery.deliveryData.username}</div>
                </div>
              )}
              {delivery.deliveryData.password && (
                <div className="flex justify-between items-center">
                  <div className="text-mali-text-secondary">Password:</div>
                  <div className="font-mono text-white">{delivery.deliveryData.password}</div>
                </div>
              )}
              {delivery.deliveryData.gameAccount && (
                <div className="flex justify-between items-center">
                  <div className="text-mali-text-secondary">Game Account:</div>
                  <div className="font-mono text-white">{delivery.deliveryData.gameAccount}</div>
                </div>
              )}
              {delivery.deliveryData.expiryDate && (
                <div className="flex justify-between items-center">
                  <div className="text-mali-text-secondary">Expires:</div>
                  <div className="text-white">{formatTime(delivery.deliveryData.expiryDate)}</div>
                </div>
              )}
              {delivery.deliveryData.activationInstructions && (
                <div className="mt-2 text-mali-text-secondary text-xs">
                  <div className="font-medium mb-1">Activation Instructions:</div>
                  <div>{delivery.deliveryData.activationInstructions}</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {delivery.deliveryStatus === 'failed' && (
            <button
              onClick={handleRetry}
              disabled={isPending}
              className="py-1.5 px-3 bg-mali-blue-accent text-white rounded-lg text-sm hover:bg-mali-blue-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Retry Delivery
                </>
              )}
            </button>
          )}
          
          {(delivery.deliveryStatus === 'pending' || delivery.deliveryStatus === 'processing') && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="py-1.5 px-3 bg-red-500/80 text-white rounded-lg text-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Cancel
                </>
              )}
            </button>
          )}
          
          {delivery.deliveryStatus === 'delivered' && (
            <button
              onClick={handleResend}
              disabled={isPending}
              className="py-1.5 px-3 bg-mali-blue/20 text-white rounded-lg text-sm hover:bg-mali-blue/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Mail size={14} />
                  Resend
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowTracking(!showTracking)}
            className="py-1.5 px-3 bg-mali-blue/20 text-white rounded-lg text-sm hover:bg-mali-blue/30 flex items-center gap-1.5"
          >
            {showTracking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showTracking ? 'Hide Tracking' : 'View Tracking'}
          </button>
        </div>
        
        {/* Tracking logs */}
        {showTracking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <h4 className="font-medium text-white mb-2">Delivery Tracking</h4>
            <div className="border-l-2 border-mali-blue/30 pl-4 space-y-4 py-2">
              {trackingLogs.map((log, index) => (
                <div key={log.id} className="relative">
                  {/* Status dot */}
                  <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-mali-blue flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-mali-blue-accent"></div>
                  </div>
                  
                  {/* Log details */}
                  <div className="mb-1 flex justify-between">
                    <span className={`text-sm font-medium ${
                      log.status === 'delivered' ? 'text-green-400' :
                      log.status === 'failed' ? 'text-red-400' :
                      log.status === 'processing' ? 'text-blue-400' :
                      'text-mali-blue-accent'
                    }`}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                    <span className="text-xs text-mali-text-secondary">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-mali-text-secondary">{log.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 