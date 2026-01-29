"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTranslations } from "@/lib/context/language-context";
import { Plus, Search, Users, Edit, ChartBar, Trash2, MoreHorizontal, BadgePercent, Link as LinkIcon, ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";

// Mock reseller data
const mockResellers = [
  {
    id: "res-1",
    name: "GamingZone",
    email: "contact@gamingzone.com",
    owner: "John Smith",
    registeredDate: "2022-08-15",
    salesCount: 1245,
    totalSales: 15780.50,
    commission: "12%",
    status: "verified",
    apiAccess: true
  },
  {
    id: "res-2",
    name: "TopUpHub",
    email: "support@topuphub.com",
    owner: "Emma Johnson",
    registeredDate: "2022-09-23",
    salesCount: 983,
    totalSales: 10235.75,
    commission: "10%",
    status: "verified",
    apiAccess: true
  },
  {
    id: "res-3",
    name: "GamersDelight",
    email: "info@gamersdelight.net",
    owner: "Michael Chen",
    registeredDate: "2022-11-10",
    salesCount: 456,
    totalSales: 6540.25,
    commission: "8%",
    status: "verified",
    apiAccess: true
  },
  {
    id: "res-4",
    name: "DigiCards",
    email: "sales@digicards.io",
    owner: "Sarah Williams",
    registeredDate: "2023-01-05",
    salesCount: 312,
    totalSales: 4950.00,
    commission: "8%",
    status: "pending",
    apiAccess: false
  },
  {
    id: "res-5",
    name: "GameCredits",
    email: "admin@gamecredits.com",
    owner: "Robert Taylor",
    registeredDate: "2023-02-18",
    salesCount: 198,
    totalSales: 3250.80,
    commission: "7%",
    status: "verified",
    apiAccess: true
  },
  {
    id: "res-6",
    name: "QuickGame",
    email: "hello@quickgame.co",
    owner: "Lisa Anderson",
    registeredDate: "2023-04-07",
    salesCount: 87,
    totalSales: 1450.30,
    commission: "6%",
    status: "suspended",
    apiAccess: false
  },
];

export default function AdminResellers() {
  const { t } = useTranslations();
  const [resellers, setResellers] = useState(mockResellers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  const filteredResellers = resellers.filter(reseller => {
    const matchesSearch = reseller.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          reseller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          reseller.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || reseller.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'verified':
        return 'text-green-400 bg-green-900/30';
      case 'pending':
        return 'text-amber-400 bg-amber-900/30';
      case 'suspended':
        return 'text-red-400 bg-red-900/30';
      default:
        return 'text-mali-blue bg-mali-blue/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'verified':
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      case 'pending':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'suspended':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };
  
  return (
    <AdminLayout title={"Resellers" as any}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">Total Resellers</h3>
              <div className="p-2 rounded-full bg-blue-900/40 text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white">
              {resellers.length}
            </div>
            <div className="mt-1 text-gray-400 text-sm">
              Registered resellers
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">Total Sales</h3>
              <div className="p-2 rounded-full bg-green-900/40 text-green-400">
                <ChartBar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white">
              ${resellers.reduce((sum, reseller) => sum + reseller.totalSales, 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className="mt-1 text-gray-400 text-sm">
              All-time reseller revenue
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">Orders</h3>
              <div className="p-2 rounded-full bg-purple-900/40 text-purple-400">
                <BadgePercent className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white">
              {resellers.reduce((sum, reseller) => sum + reseller.salesCount, 0).toLocaleString()}
            </div>
            <div className="mt-1 text-gray-400 text-sm">
              Total orders through resellers
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 border border-indigo-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">API Users</h3>
              <div className="p-2 rounded-full bg-indigo-900/40 text-indigo-400">
                <LinkIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-white">
              {resellers.filter(reseller => reseller.apiAccess).length}
            </div>
            <div className="mt-1 text-gray-400 text-sm">
              Resellers using our API
            </div>
          </div>
        </motion.div>

        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-mali-blue/70" />
              </div>
              <input
                type="text"
                placeholder="Search resellers..."
                className="bg-mali-card border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-mali-blue focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-mali-blue/70" />
              </div>
              <select
                className="bg-mali-card border border-mali-blue/20 text-white rounded-lg pl-10 pr-4 py-2 w-full appearance-none focus:ring-2 focus:ring-mali-blue focus:outline-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mali-blue/70">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Add Reseller Button */}
          <button className="bg-mali-blue text-white w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-mali-blue/90 transition-colors">
            <Plus className="h-5 w-5" />
            <span>Add Reseller</span>
          </button>
        </div>
        
        {/* Resellers Table */}
        <motion.div 
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="p-5 border-b border-mali-blue/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Users className="mr-2 h-5 w-5 text-mali-blue" />
              Reseller Management
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-mali-blue/70 text-sm">
                  <th className="px-5 py-3 text-left">Reseller</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">Orders</th>
                  <th className="px-5 py-3 text-left">Sales Volume</th>
                  <th className="px-5 py-3 text-left">Commission</th>
                  <th className="px-5 py-3 text-left">API</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mali-blue/10">
                {filteredResellers.length > 0 ? (
                  filteredResellers.map((reseller) => (
                    <tr key={reseller.id} className="text-sm hover:bg-mali-blue/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{reseller.name}</div>
                        <div className="text-xs text-gray-400">Since {new Date(reseller.registeredDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div>{reseller.email}</div>
                        <div className="text-xs text-gray-400">{reseller.owner}</div>
                      </td>
                      <td className="px-5 py-4">{reseller.salesCount.toLocaleString()}</td>
                      <td className="px-5 py-4 font-medium">${reseller.totalSales.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}</td>
                      <td className="px-5 py-4 text-mali-blue">{reseller.commission}</td>
                      <td className="px-5 py-4">
                        {reseller.apiAccess ? (
                          <span className="px-2 py-1 rounded-full text-xs text-green-400 bg-green-900/30">
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs text-gray-400 bg-gray-900/30">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusStyles(reseller.status)}`}>
                          {getStatusIcon(reseller.status)}
                          {reseller.status.charAt(0).toUpperCase() + reseller.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex space-x-2">
                          <Link href={`/admin/resellers/${reseller.id}`}>
                            <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                              <ChartBar className="h-4 w-4" />
                            </button>
                          </Link>
                          <button className="p-1 rounded-md hover:bg-mali-blue/20 text-mali-blue hover:text-white transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan={8}>
                      No resellers found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-mali-blue/20 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Showing {filteredResellers.length} of {resellers.length} resellers
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-mali-blue/20 text-white rounded">
                1
              </button>
              <button className="px-3 py-1 text-sm text-mali-blue hover:text-white hover:bg-mali-blue/20 rounded transition-colors">
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
} 