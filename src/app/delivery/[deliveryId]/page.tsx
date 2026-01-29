"use client";

import { useParams, useRouter } from 'next/navigation';
import { motion } from '@/lib/framer-exports';
import { DeliveryStatus } from '@/components/delivery/DeliveryStatus';
import { DeliveryProvider } from '@/lib/context/delivery-context';
import { ArrowLeft, Package } from 'lucide-react';

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.deliveryId as string;
  
  return (
    <DeliveryProvider>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 bg-mali-blue/10 hover:bg-mali-blue/20 rounded-lg text-mali-text-secondary hover:text-white"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="text-mali-blue-accent" />
                  Delivery Details
                </h1>
                <p className="text-mali-text-secondary">
                  Delivery ID: {deliveryId}
                </p>
              </div>
            </div>
            
            <DeliveryStatus deliveryId={deliveryId} />
            
          </motion.div>
        </div>
      </div>
    </DeliveryProvider>
  );
} 