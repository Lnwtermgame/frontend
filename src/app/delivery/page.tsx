"use client";

import { motion } from '@/lib/framer-exports';
import { DeliveryList } from '@/components/delivery/DeliveryList';
import { DeliveryProvider } from '@/lib/context/delivery-context';
import { Package, Truck } from 'lucide-react';

export default function DeliveryPage() {
  return (
    <DeliveryProvider>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Truck className="text-mali-blue-accent" />
                  Delivery System
                </h1>
                <p className="text-mali-text-secondary">
                  Track and manage your digital product deliveries
                </p>
              </div>
            </div>
            
            <DeliveryList />
          </motion.div>
        </div>
      </div>
    </DeliveryProvider>
  );
} 