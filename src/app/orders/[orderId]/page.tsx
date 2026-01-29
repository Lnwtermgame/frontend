"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { ChevronLeft, Download, Copy, CheckCircle, XCircle, Clock, Edit, Headphones, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { OrderModificationModal, OrderItem } from "@/components/OrderModificationModal";

// Mock order data
const getOrderDetails = (id: string) => {
  return {
    id,
    date: "2023-10-15T14:30:00Z",
    total: 29.99,
    status: "pending",
    paymentMethod: "Credit Card",
    paymentId: "PAY7890123",
    items: [
      {
        id: "ITEM1",
        name: "Steam Gift Card",
        value: "$20",
        price: 19.99,
        quantity: 1,
        code: "XXXX-YYYY-ZZZZ-ABCD",
        status: "Delivered",
        isModifiable: false
      },
      {
        id: "ITEM2",
        name: "Mobile Legends Diamonds",
        value: "100 Diamonds",
        price: 10.00,
        quantity: 1,
        playerInfo: {
          id: "12345678",
          server: "NA"
        },
        status: "Processing",
        isModifiable: true
      }
    ],
    isCancellable: true
  };
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isInitialized } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
      return;
    }

    // Simulate API call to get order details
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        const orderData = getOrderDetails(params.orderId as string);
        setOrder(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, router, params.orderId]);

  const copyToClipboard = (code: string, itemId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(itemId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handler functions for order modification
  const handleModifyQuantity = async (itemId: string, quantity: number) => {
    console.log(`Modifying item ${itemId} quantity to ${quantity}`);
    // In a real app, this would be an API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Update order state with new quantity
        setOrder((prev: any) => ({
          ...prev,
          items: prev.items.map((item: any) =>
            item.id === itemId ? { ...item, quantity } : item
          )
        }));
        resolve();
      }, 500);
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    console.log(`Removing item ${itemId}`);
    // In a real app, this would be an API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Update order state by removing the item
        setOrder((prev: any) => ({
          ...prev,
          items: prev.items.filter((item: any) => item.id !== itemId),
          // Recalculate total
          total: prev.items
            .filter((item: any) => item.id !== itemId)
            .reduce((sum: number, item: any) => sum + item.price, 0)
        }));
        resolve();
      }, 500);
    });
  };

  const handleCancelOrder = async (reason: string) => {
    console.log(`Cancelling order with reason: ${reason}`);
    // In a real app, this would be an API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Update order status to cancelled
        setOrder((prev: any) => ({
          ...prev,
          status: "cancelled",
          cancellationReason: reason
        }));
        resolve();
      }, 500);
    });
  };

  if (!isInitialized || !user || loading) {
    return (
      <div className="page-container min-h-screen flex items-center justify-center">
        <div className="relative w-20 h-20 animate-pulse-glow">
          <div className="absolute inset-0 bg-glow-gradient animate-glow"></div>
          <div className="absolute inset-0 border-2 border-mali-blue-light rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-mali-purple rounded-full animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <div className="relative glass-card p-8 text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mali-red via-mali-purple to-mali-blue-light"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mali-red/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-mali-purple/10 blur-3xl"></div>

          <XCircle className="h-16 w-16 mx-auto text-mali-red mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Order not found</h2>
          <p className="text-mali-text-secondary mb-6">We couldn't find the order you're looking for.</p>
          <Link
            href="/orders"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-mali-blue/30 hover:bg-mali-blue/40 transition-colors text-mali-blue-light"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <span className="text-xs px-3 py-1 bg-gradient-to-r from-mali-green/20 to-mali-green/10 text-mali-green rounded-full flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> {status}</span>;
      case 'processing':
        return <span className="text-xs px-3 py-1 bg-gradient-to-r from-mali-blue-light/20 to-mali-blue-light/10 text-mali-blue-light rounded-full flex items-center"><Clock className="h-3 w-3 mr-1" /> {status}</span>;
      case 'cancelled':
        return <span className="text-xs px-3 py-1 bg-gradient-to-r from-mali-red/20 to-mali-red/10 text-mali-red rounded-full flex items-center"><XCircle className="h-3 w-3 mr-1" /> {status}</span>;
      default:
        return <span className="text-xs px-3 py-1 bg-gradient-to-r from-mali-purple/20 to-mali-purple/10 text-mali-purple rounded-full flex items-center"><Clock className="h-3 w-3 mr-1" /> {status}</span>;
    }
  };

  // Check if the order can be modified or cancelled
  const canModifyOrder = order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing';

  return (
    <div className="page-container">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mali-purple/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-mali-blue-light/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-mali-pink/5 rounded-full blur-3xl"></div>
      </div>

      {/* Order Modification Modal */}
      <OrderModificationModal
        isOpen={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
        order={{
          id: order.id,
          date: order.date,
          status: order.status.toLowerCase(),
          items: order.items.map((item: any) => ({
            id: item.id,
            name: `${item.name} ${item.value}`,
            quantity: item.quantity,
            price: item.price,
            status: item.status.toLowerCase(),
            isModifiable: item.isModifiable
          })),
          total: order.total,
          paymentMethod: order.paymentMethod,
          isCancellable: order.isCancellable
        }}
        onModifyQuantity={handleModifyQuantity}
        onRemoveItem={handleRemoveItem}
        onCancelOrder={handleCancelOrder}
      />

      {/* Page Header with enhanced glow effects */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-mali-purple/10 blur-3xl animate-pulse-glow"></div>
        <div className="absolute -top-10 right-10 w-96 h-96 rounded-full bg-mali-blue-light/10 blur-3xl animate-pulse-glow"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <Link
              href="/orders"
              className="text-mali-blue-light hover:text-mali-blue-accent inline-flex items-center text-sm mb-3 transition-all hover:translate-x-[-2px]"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Orders
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(order.status)}
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-mali-blue/30 to-mali-blue/20 hover:from-mali-blue/40 hover:to-mali-blue/30 transition-colors flex items-center text-mali-blue-light text-sm group">
              <Download className="h-4 w-4 mr-1.5 group-hover:animate-bounce" />
              Invoice
            </button>

            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-mali-purple/30 to-mali-purple/20 hover:from-mali-purple/40 hover:to-mali-purple/30 transition-colors flex items-center text-mali-purple text-sm">
              <Headphones className="h-4 w-4 mr-1.5" />
              Support
            </button>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-3xl font-bold text-white">
            Order #{order.id}
            <span className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-mali-blue-light to-mali-purple"></span>
          </h1>
          <p className="text-mali-text-secondary mt-2 flex items-center">
            <Clock className="inline h-4 w-4 mr-1.5 text-mali-text-muted" />
            Placed on {new Date(order.date).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-mali-blue/20 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-mali-blue-light/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <h2 className="text-lg font-semibold text-white relative z-10">Order Items</h2>

              {canModifyOrder && (
                <button
                  onClick={() => setModifyModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-mali-blue/30 to-mali-blue/20 hover:from-mali-blue/40 hover:to-mali-blue/30 transition-colors flex items-center text-mali-blue-light text-sm"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Modify Order
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              {order.items.map((item: any) => (
                <div key={item.id} className="rounded-lg bg-mali-dark bg-opacity-50 border border-mali-blue/10 hover:border-mali-blue/20 transition-colors overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-mali-blue-light to-mali-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-mali-text-secondary text-sm">{item.value}</div>
                      </div>
                    </div>

                    <div className="text-right md:ml-auto">
                      <div className="text-white font-medium">${item.price.toFixed(2)}</div>
                      <div className="text-mali-text-secondary text-xs">Qty: {item.quantity}</div>
                    </div>
                  </div>

                  <div className="border-t border-mali-blue/10 bg-mali-blue/5 p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-mali-text-secondary">Status:</span>
                      {getStatusBadge(item.status)}
                    </div>

                    {item.code && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-mali-text-secondary">Redemption Code:</span>
                          <button
                            onClick={() => copyToClipboard(item.code, item.id)}
                            className="text-xs text-mali-blue-light hover:text-mali-blue-accent transition-colors flex items-center"
                          >
                            {copiedCode === item.id ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Code
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-mali-darker rounded-lg font-mono text-mali-text-primary text-sm select-all flex items-center justify-between group relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-mali-blue-light/5 to-mali-purple/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span>{item.code}</span>
                          {copiedCode === item.id && (
                            <span className="text-xs text-mali-green animate-fade-in-out">Copied!</span>
                          )}
                        </div>
                      </div>
                    )}

                    {item.playerInfo && (
                      <div className="mt-4">
                        <span className="text-xs text-mali-text-secondary block mb-2">Player Information:</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-mali-darker rounded-lg">
                            <span className="text-xs text-mali-text-secondary block mb-1">ID:</span>
                            <span className="text-mali-text-primary text-sm font-medium">{item.playerInfo.id}</span>
                          </div>
                          <div className="p-3 bg-mali-darker rounded-lg">
                            <span className="text-xs text-mali-text-secondary block mb-1">Server:</span>
                            <span className="text-mali-text-primary text-sm font-medium">{item.playerInfo.server}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-mali-purple/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="p-5 border-b border-mali-blue/20">
              <h2 className="text-lg font-semibold text-white">Order Summary</h2>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-mali-text-secondary">Subtotal:</span>
                <span className="text-white font-medium">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mali-text-secondary">Tax:</span>
                <span className="text-white font-medium">$0.00</span>
              </div>
              <div className="border-t border-mali-blue/10 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white font-semibold">Total:</span>
                  <span className="text-lg text-mali-blue-light font-bold">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {order.status.toLowerCase() === "cancelled" && order.cancellationReason && (
            <div className="glass-card rounded-xl shadow-lg bg-mali-red/5 border border-mali-red/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mali-red/40 to-mali-red/20"></div>
              <div className="p-5">
                <h3 className="text-mali-red font-medium mb-2 flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Order Cancelled
                </h3>
                <p className="text-sm text-mali-text-secondary">
                  <span className="text-mali-text-muted">Reason:</span> {order.cancellationReason}
                </p>
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-mali-blue-light/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="p-5 border-b border-mali-blue/20">
              <h2 className="text-lg font-semibold text-white">Payment Information</h2>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-mali-text-secondary">Method:</span>
                <span className="text-white font-medium px-3 py-1 bg-mali-blue/10 rounded-lg text-sm">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mali-text-secondary">Transaction ID:</span>
                <div className="flex items-center gap-1">
                  <span className="text-mali-text-primary text-sm font-mono">{order.paymentId}</span>
                  <button
                    onClick={() => copyToClipboard(order.paymentId, 'payment-id')}
                    className="text-mali-blue-light hover:text-mali-blue-accent p-1 rounded-full transition-colors"
                  >
                    {copiedCode === 'payment-id' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-mali-blue/5 border-t border-mali-blue/10">
              <Link href="/support/contact" className="text-sm text-mali-blue-light hover:text-mali-blue-accent flex items-center justify-center w-full">
                <Headphones className="h-4 w-4 mr-1.5" />
                Need help with this order?
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 