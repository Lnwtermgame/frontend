"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { FileText, Download, ChevronRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import { motion } from "@/lib/framer-exports";

// Mock invoices data
const invoices = [
  {
    id: "INV12345",
    date: "2023-10-15",
    amount: 29.99,
    status: "Paid",
    items: [
      { name: "Steam Gift Card", value: "$20", quantity: 1 }
    ],
    orderReference: "ORD12345"
  },
  {
    id: "INV12346",
    date: "2023-09-28",
    amount: 49.99,
    status: "Paid",
    items: [
      { name: "Google Play Gift Card", value: "$50", quantity: 1 }
    ],
    orderReference: "ORD12346"
  },
  {
    id: "INV12347",
    date: "2023-08-05",
    amount: 9.99,
    status: "Paid",
    items: [
      { name: "Mobile Legends Diamonds", value: "100 Diamonds", quantity: 1 }
    ],
    orderReference: "ORD12347"
  },
  {
    id: "INV12348",
    date: "2023-11-01",
    amount: 50.00,
    status: "Refunded",
    items: [
      { name: "PUBG Mobile UC", value: "500 UC", quantity: 1 }
    ],
    orderReference: "ORD12348"
  }
];

export default function InvoicePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter invoices based on search term and filter status
  useEffect(() => {
    let result = invoices;

    // Apply status filter
    if (filter !== "all") {
      result = result.filter(invoice => invoice.status.toLowerCase() === filter);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(invoice =>
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orderReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredInvoices(result);
  }, [searchTerm, filter]);

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
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

  return (
    <div className="page-container">
      {/* Page Header with blur effect - redesigned to match the preferred style */}
      <div className="relative mb-8">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mali-purple/20 blur-3xl"></div>
        <div className="absolute -top-10 right-10 w-80 h-80 rounded-full bg-mali-blue/20 blur-3xl"></div>

        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">
              My Invoices
            </h1>
            <p className="text-mali-text-secondary mt-1">
              View and download your purchase invoices
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <span className="bg-mali-blue/20 text-mali-blue-light px-3 py-1.5 rounded-lg text-xs font-medium">
            Total: {filteredInvoices.length} Invoices
          </span>
        </div>

        <div className="flex w-full sm:w-auto space-x-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-mali-text-secondary" />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-mali-blue/10 border border-mali-blue/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder-mali-text-secondary focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none rounded-lg bg-mali-blue/10 border border-mali-blue/20 px-4 py-2.5 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent transition-colors"
            >
              <option value="all">All Invoices</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <Filter className="h-4 w-4 text-mali-text-secondary" />
            </div>
          </div>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="w-16 h-16 rounded-full bg-mali-blue/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-mali-blue-light" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No invoices found</h2>
          <p className="text-mali-text-secondary mb-4">You don't have any invoices matching your search criteria.</p>
        </motion.div>
      ) : (
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-mali-blue/20">
                  <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-4">Invoice #</th>
                  <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-4">Date</th>
                  <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-4">Order Ref</th>
                  <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-4">Amount</th>
                  <th className="text-left text-xs uppercase text-mali-text-secondary font-medium px-4 py-4">Status</th>
                  <th className="text-right text-xs uppercase text-mali-text-secondary font-medium px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    className="border-t border-mali-blue/10 hover:bg-mali-blue/10 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                  >
                    <td className="px-4 py-4 text-white font-medium">{invoice.id}</td>
                    <td className="px-4 py-4 text-mali-text-secondary text-sm">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm">
                      <Link href={`/orders/${invoice.orderReference}`} className="text-mali-blue-light hover:text-mali-blue-accent hover:underline transition-colors">
                        {invoice.orderReference}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-white font-medium">${invoice.amount.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.status === "Paid"
                        ? "bg-green-500/20 text-green-400"
                        : invoice.status === "Refunded"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                        }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <motion.button
                          className="p-2 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Download className="h-4 w-4 text-mali-blue-light" />
                        </motion.button>
                        <motion.button
                          className="p-2 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/invoice/${invoice.id}`)}
                        >
                          <ChevronRight className="h-4 w-4 text-mali-blue-light" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Footer info */}
      <motion.div
        className="mt-4 text-center text-mali-text-secondary text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        Invoices are available for download for 12 months after purchase
      </motion.div>
    </div>
  );
} 
