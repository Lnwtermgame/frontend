"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Clock, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink
} from "lucide-react";

// Mock invoice data - would normally be fetched from an API
const invoicesData = {
  "INV12345": {
    id: "INV12345",
    date: "2023-10-15",
    dueDate: "2023-10-15", // Same day for digital goods
    amount: 29.99,
    status: "Paid",
    paymentMethod: "Credit Card",
    paymentId: "PAY78912345",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    billingAddress: {
      name: "John Doe",
      address: "Digital delivery only",
      phone: "+1 555-123-4567"
    },
    items: [
      { 
        id: "ITEM001", 
        name: "Steam Gift Card", 
        value: "$20", 
        quantity: 1, 
        price: 20.99,
        image: "https://placehold.co/100x60/2a429b/white?text=Steam"
      },
      { 
        id: "ITEM002", 
        name: "Processing Fee", 
        value: "Service", 
        quantity: 1, 
        price: 9.00,
        image: null
      }
    ],
    orderReference: "ORD12345",
    notes: "Thank you for your purchase!",
    deliveryMethod: "Digital - Email",
    orderDate: "2023-10-15",
    orderTime: "14:35:29"
  },
  "INV12346": {
    id: "INV12346",
    date: "2023-09-28",
    dueDate: "2023-09-28",
    amount: 49.99,
    status: "Paid",
    paymentMethod: "PayPal",
    paymentId: "PAY78912346",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    billingAddress: {
      name: "Jane Smith",
      address: "Digital delivery only",
      phone: "+1 555-987-6543"
    },
    items: [
      { 
        id: "ITEM003", 
        name: "Google Play Gift Card", 
        value: "$50", 
        quantity: 1, 
        price: 49.99,
        image: "https://placehold.co/100x60/4caf50/white?text=Google"
      }
    ],
    orderReference: "ORD12346",
    notes: "Thank you for your purchase!",
    deliveryMethod: "Digital - Email",
    orderDate: "2023-09-28",
    orderTime: "09:12:05"
  }
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Copy invoice ID to clipboard
  const copyInvoiceId = () => {
    if (typeof window !== "undefined" && invoice) {
      navigator.clipboard.writeText(invoice.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch invoice data - in a real app, this would be an API call
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Simulate API fetch with timeout
    const timer = setTimeout(() => {
      setLoading(false);
      
      if (typeof invoiceId !== 'string') {
        setError("Invalid invoice ID");
        return;
      }
      
      const foundInvoice = invoicesData[invoiceId as keyof typeof invoicesData];
      
      if (!foundInvoice) {
        setError("Invoice not found");
        return;
      }
      
      setInvoice(foundInvoice);
    }, 500);

    return () => clearTimeout(timer);
  }, [invoiceId, router, user]);

  // Show loading state
  if (loading) {
    return (
      <div className="page-container text-center">
        <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-8">
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-mali-blue/20 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-mali-blue/20 rounded w-3/4"></div>
              <div className="h-4 bg-mali-blue/20 rounded"></div>
              <div className="h-4 bg-mali-blue/20 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="page-container">
        <motion.div 
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-full bg-mali-blue/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-mali-text-secondary mb-6">{error}</p>
          <button 
            onClick={() => router.push('/invoice')}
            className="inline-flex items-center bg-gradient-to-r from-mali-blue-light to-mali-purple text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-blue-glow transition-all hover:shadow-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </button>
        </motion.div>
      </div>
    );
  }
  
  if (!invoice) {
    return null;
  }

  return (
    <div className="page-container">
      {/* Page Header with blur effect - redesigned to match the screenshot */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mali-purple/20 blur-3xl"></div>
        <div className="absolute -top-10 right-10 w-80 h-80 rounded-full bg-mali-blue/20 blur-3xl"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link 
              href="/invoice" 
              className="text-mali-blue-light hover:text-mali-blue-accent inline-flex items-center text-sm mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> 
              Back to Invoices
            </Link>
          </div>
          
          <div className="flex gap-2">
            <motion.button
              className="p-2 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors inline-flex items-center text-mali-blue-light"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyInvoiceId}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </motion.button>
            
            <motion.button
              className="p-2 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors inline-flex items-center text-mali-blue-light"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Printer className="h-4 w-4" />
            </motion.button>
            
            <motion.button
              className="p-2 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors inline-flex items-center text-mali-blue-light"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="h-4 w-4" />
            </motion.button>
            
            <motion.button
              className="px-5 py-2 rounded-lg bg-mali-blue-accent hover:bg-mali-blue-light text-white font-medium inline-flex items-center shadow-blue-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Download PDF
            </motion.button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white relative">
            Invoice #{invoice.id}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-mali-text-secondary">
              {new Date(invoice.date).toLocaleDateString()}
            </p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              invoice.status === "Paid" 
                ? "bg-green-500/20 text-green-400" 
                : invoice.status === "Refunded"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-blue-500/20 text-blue-400"
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>
      
      {/* Invoice Content */}
      <div className="space-y-6">
        {/* Invoice Summary Card */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-medium text-mali-text-secondary uppercase mb-3">Customer</h3>
              <p className="text-white font-medium">{invoice.customerName}</p>
              <p className="text-mali-text-secondary text-sm">{invoice.customerEmail}</p>
              <p className="text-mali-text-secondary text-sm mt-1">{invoice.billingAddress.phone}</p>
            </div>
            
            {/* Payment Info */}
            <div>
              <h3 className="text-sm font-medium text-mali-text-secondary uppercase mb-3">Payment Details</h3>
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-mali-blue/20 text-mali-blue-light mt-0.5">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-white font-medium">{invoice.paymentMethod}</p>
                  <p className="text-mali-text-secondary text-sm">ID: {invoice.paymentId}</p>
                  <p className="text-mali-text-secondary text-sm mt-1">
                    {invoice.orderDate} at {invoice.orderTime}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Order Info */}
            <div>
              <h3 className="text-sm font-medium text-mali-text-secondary uppercase mb-3">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-mali-text-secondary text-sm">Order Ref:</span>
                  <Link 
                    href={`/orders/${invoice.orderReference}`} 
                    className="text-mali-blue-light hover:text-mali-blue-accent hover:underline transition-colors flex items-center text-sm"
                  >
                    {invoice.orderReference}
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-mali-text-secondary text-sm">Delivery:</span>
                  <span className="text-white text-sm">{invoice.deliveryMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mali-text-secondary text-sm">Status:</span>
                  <span className="text-green-400 text-sm flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Invoice Items */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Invoice Items</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-mali-blue/20">
                    <th className="text-left text-xs uppercase text-mali-text-secondary font-medium pb-4">Item</th>
                    <th className="text-center text-xs uppercase text-mali-text-secondary font-medium pb-4">Value</th>
                    <th className="text-center text-xs uppercase text-mali-text-secondary font-medium pb-4">Quantity</th>
                    <th className="text-right text-xs uppercase text-mali-text-secondary font-medium pb-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-mali-blue/10">
                      <td className="py-4">
                        <div className="flex items-center">
                          {item.image ? (
                            <div className="h-12 w-16 bg-mali-blue/10 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-mali-blue/10 rounded-lg flex items-center justify-center mr-4">
                              <FileText className="h-5 w-5 text-mali-blue-light" />
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium">{item.name}</div>
                            <div className="text-mali-text-secondary text-sm">{item.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center text-mali-blue-light">{item.value}</td>
                      <td className="py-4 text-center text-mali-text-secondary">{item.quantity}</td>
                      <td className="py-4 text-right text-white font-medium">${item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Invoice Summary */}
            <div className="mt-6 border-t border-mali-blue/20 pt-4">
              <div className="flex flex-col items-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-mali-text-secondary">
                    <span>Subtotal:</span>
                    <span>${(invoice.amount - 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-mali-text-secondary">
                    <span>Tax:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-mali-blue/20 pt-2 mt-2">
                    <span>Total:</span>
                    <span>${invoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Notes & Info */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
            <p className="text-mali-text-secondary">{invoice.notes}</p>
            
            <div className="mt-6 border-t border-mali-blue/20 pt-6">
              <div className="flex items-center gap-2 text-mali-text-secondary">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Invoice generated on {new Date(invoice.date).toLocaleDateString()} at {invoice.orderTime}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Footer Actions */}
      <motion.div
        className="mt-8 flex flex-col sm:flex-row justify-between items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <Link 
            href="/invoice" 
            className="inline-flex items-center px-4 py-2 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors text-mali-blue-light"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </div>
        <p className="text-mali-text-secondary text-sm">
          If you have any questions, please contact our support team.
        </p>
      </motion.div>
    </div>
  );
} 