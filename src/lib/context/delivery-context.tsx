"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "../hooks/use-auth";
import {
  deliveryApi,
  OrderDeliveryStatus,
  DeliveryHistoryEntry,
  DeliveryStatus,
} from "../services/delivery-api";
import toast from "react-hot-toast";

type DeliveryContextType = {
  deliveries: OrderDeliveryStatus[];
  isLoading: boolean;
  error: string | null;
  fetchDeliveries: (status?: DeliveryStatus) => Promise<void>;
  getDeliveryStatus: (orderId: string) => Promise<OrderDeliveryStatus | null>;
  getDeliveryHistory: (orderId: string) => Promise<DeliveryHistoryEntry[]>;
  resendDelivery: (orderId: string, itemId: string) => Promise<boolean>;
  cancelDelivery: (orderId: string) => Promise<boolean>;
};

export const DeliveryContext = createContext<DeliveryContextType | undefined>(
  undefined,
);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<OrderDeliveryStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(
    async (status?: DeliveryStatus) => {
      if (!user) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await deliveryApi.getUserDeliveries({ status });
        if (response.success) {
          setDeliveries(response.data);
        }
      } catch (err) {
        const message = deliveryApi.getErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  const getDeliveryStatus = useCallback(
    async (orderId: string): Promise<OrderDeliveryStatus | null> => {
      try {
        return await deliveryApi.getDeliveryStatus(orderId);
      } catch (err) {
        const message = deliveryApi.getErrorMessage(err);
        toast.error(message);
        return null;
      }
    },
    [],
  );

  const getDeliveryHistory = useCallback(
    async (orderId: string): Promise<DeliveryHistoryEntry[]> => {
      try {
        const response = await deliveryApi.getDeliveryHistory(orderId);
        return response.history;
      } catch (err) {
        const message = deliveryApi.getErrorMessage(err);
        toast.error(message);
        return [];
      }
    },
    [],
  );

  const resendDelivery = useCallback(
    async (orderId: string, itemId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await deliveryApi.resendDelivery(orderId, itemId);
        if (result.success) {
          toast.success(result.message || "ส่งข้อมูลใหม่สำเร็จ");
          // Refresh deliveries to get updated state
          await fetchDeliveries();
          return true;
        }
        toast.error(result.error || "ไม่สามารถส่งข้อมูลใหม่ได้");
        return false;
      } catch (err) {
        const message = deliveryApi.getErrorMessage(err);
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchDeliveries],
  );

  const cancelDelivery = useCallback(
    async (orderId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await deliveryApi.cancelDelivery(orderId);
        if (result.success) {
          toast.success(result.message || "ยกเลิกการจัดส่งสำเร็จ");
          // Refresh deliveries to get updated state
          await fetchDeliveries();
          return true;
        }
        return false;
      } catch (err) {
        const message = deliveryApi.getErrorMessage(err);
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchDeliveries],
  );

  const contextValue = useMemo(
    () => ({
      deliveries,
      isLoading,
      error,
      fetchDeliveries,
      getDeliveryStatus,
      getDeliveryHistory,
      resendDelivery,
      cancelDelivery,
    }),
    [
      deliveries,
      isLoading,
      error,
      fetchDeliveries,
      getDeliveryStatus,
      getDeliveryHistory,
      resendDelivery,
      cancelDelivery,
    ],
  );

  return (
    <DeliveryContext.Provider value={contextValue}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error("useDelivery must be used within a DeliveryProvider");
  }
  return context;
}
