"use client";

import { useState } from 'react';
import { DeliveryStatus } from './DeliveryStatus';
import { useDelivery } from '@/lib/context/delivery-context';
import { 
  Package,
  Search,
  Filter,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

export function DeliveryList() {
  const { deliveryItems } = useDelivery();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter deliveries based on search query and status filter
  const filteredDeliveries = deliveryItems.filter(delivery => {
    const matchesSearch = 
      searchQuery === '' || 
      delivery.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === null || 
      delivery.deliveryStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Group deliveries by status for statistics
  const statusCounts = deliveryItems.reduce((acc, delivery) => {
    acc[delivery.deliveryStatus] = (acc[delivery.deliveryStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="space-y-6">
      {/* Header and Statistics */}
      <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Package className="text-mali-blue-accent" />
          Delivery Management
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-mali-blue/10 rounded-lg p-3">
            <div className="text-xs text-mali-text-secondary">Total Deliveries</div>
            <div className="text-xl font-semibold text-white">{deliveryItems.length}</div>
          </div>
          
          <div className="bg-green-900/20 rounded-lg p-3">
            <div className="text-xs text-mali-text-secondary">Delivered</div>
            <div className="text-xl font-semibold text-green-400">{statusCounts.delivered || 0}</div>
          </div>
          
          <div className="bg-amber-900/20 rounded-lg p-3">
            <div className="text-xs text-mali-text-secondary">Pending</div>
            <div className="text-xl font-semibold text-amber-400">{statusCounts.pending || 0}</div>
          </div>
          
          <div className="bg-blue-900/20 rounded-lg p-3">
            <div className="text-xs text-mali-text-secondary">Processing</div>
            <div className="text-xl font-semibold text-blue-400">{statusCounts.processing || 0}</div>
          </div>
          
          <div className="bg-red-900/20 rounded-lg p-3">
            <div className="text-xs text-mali-text-secondary">Failed</div>
            <div className="text-xl font-semibold text-red-400">{(statusCounts.failed || 0) + (statusCounts.cancelled || 0)}</div>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mali-text-secondary">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name or order ID..."
              className="w-full py-2 pl-10 pr-4 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="py-2 px-4 bg-mali-blue/20 text-white rounded-lg hover:bg-mali-blue/30 flex items-center gap-2"
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} className={showFilters ? "rotate-180 transform" : ""} />
          </button>
        </div>
        
        {/* Filter options */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-mali-blue/20">
            <div className="text-sm text-mali-text-secondary mb-2">Status Filter</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter(null)}
                className={`text-sm py-1 px-3 rounded-md ${
                  statusFilter === null
                    ? 'bg-mali-blue-accent text-white'
                    : 'bg-mali-blue/10 text-mali-text-secondary hover:text-white hover:bg-mali-blue/20'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`text-sm py-1 px-3 rounded-md ${
                  statusFilter === 'delivered'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`text-sm py-1 px-3 rounded-md ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-900/20 text-amber-400 hover:bg-amber-900/30'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('processing')}
                className={`text-sm py-1 px-3 rounded-md ${
                  statusFilter === 'processing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`text-sm py-1 px-3 rounded-md ${
                  statusFilter === 'failed'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                }`}
              >
                Failed
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`text-sm py-1 px-3 rounded-md ${
                  statusFilter === 'cancelled'
                    ? 'bg-gray-600 text-white'
                    : 'bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Delivery List */}
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-10 text-center">
            <div className="flex justify-center mb-4">
              <Package size={48} className="text-mali-text-secondary/50" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No deliveries found</h3>
            <p className="text-mali-text-secondary">
              {searchQuery || statusFilter
                ? "No deliveries match your search criteria. Try adjusting your filters."
                : "You don't have any deliveries yet."}
            </p>
          </div>
        ) : (
          filteredDeliveries.map(delivery => (
            <DeliveryStatus key={delivery.id} deliveryId={delivery.id} />
          ))
        )}
      </div>
    </div>
  );
} 
