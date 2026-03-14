"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    ReactNode,
} from "react";
import {
    paymentApi,
    PaymentMethodOption,
    PaymentIntentResponse,
    PaymentStatusResponse,
} from "../services/payment-api";
import toast from "react-hot-toast";

type PaymentContextType = {
    paymentMethods: PaymentMethodOption[];
    selectedMethod: PaymentMethodOption | null;
    setSelectedMethod: (method: PaymentMethodOption | null) => void;
    isLoading: boolean;
    error: string | null;
    fetchPaymentMethods: () => Promise<void>;
    createPaymentIntent: (
        orderId: string,
        paymentOptionCode?: string,
    ) => Promise<PaymentIntentResponse | null>;
    getPaymentStatus: (
        orderId: string,
    ) => Promise<PaymentStatusResponse | null>;
};

export const PaymentContext = createContext<PaymentContextType | undefined>(
    undefined,
);

export function PaymentProvider({ children }: { children: ReactNode }) {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>(
        [],
    );
    const [selectedMethod, setSelectedMethod] =
        useState<PaymentMethodOption | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPaymentMethods = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await paymentApi.getMethods();
            if (response.success) {
                setPaymentMethods(response.data);
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load payment methods";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createPaymentIntent = useCallback(
        async (
            orderId: string,
            paymentOptionCode?: string,
        ): Promise<PaymentIntentResponse | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await paymentApi.createIntent(
                    orderId,
                    paymentOptionCode,
                );
                if (response.success) {
                    return response.data;
                }
                return null;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Payment processing failed";
                setError(message);
                toast.error(message);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    const getPaymentStatus = useCallback(
        async (orderId: string): Promise<PaymentStatusResponse | null> => {
            try {
                const response = await paymentApi.getStatus(orderId);
                if (response.success) {
                    return response.data;
                }
                return null;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to get payment status";
                toast.error(message);
                return null;
            }
        },
        [],
    );

    const contextValue = useMemo(
        () => ({
            paymentMethods,
            selectedMethod,
            setSelectedMethod,
            isLoading,
            error,
            fetchPaymentMethods,
            createPaymentIntent,
            getPaymentStatus,
        }),
        [
            paymentMethods,
            selectedMethod,
            isLoading,
            error,
            fetchPaymentMethods,
            createPaymentIntent,
            getPaymentStatus,
        ],
    );

    return (
        <PaymentContext.Provider value={contextValue}>
            {children}
        </PaymentContext.Provider>
    );
}

export function usePayment() {
    const context = useContext(PaymentContext);
    if (context === undefined) {
        throw new Error("usePayment must be used within a PaymentProvider");
    }
    return context;
}
