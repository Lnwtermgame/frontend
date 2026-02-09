"use client";

import React, { useState, ReactElement } from "react";
import { motion } from "@/lib/framer-exports";
import {
  Activity,
  Calendar,
  Download,
  FileText,
  Filter,
  PieChart,
  Plus,
  Search,
  Settings,
  Users
} from "lucide-react";

// Dummy translation helper
const t = (str: any) => str;

interface Report {
  id: string;
  title: string;
  description: string;
  type: "sales" | "users" | "products" | "marketing";
  lastGenerated: string;
  frequency: "once" | "daily" | "weekly" | "monthly" | "custom";
  status: "available" | "scheduled" | "processing" | "failed";
}

interface CustomReportsProps {
  initialReports?: Report[];
}

export default function CustomReports({ initialReports = [] }: CustomReportsProps) {

  const [reports, setReports] = useState<Report[]>(initialReports.length > 0 ? initialReports : [
    {
      id: "rep1",
      title: "Monthly Sales Summary",
      description: "Revenue, transaction count, and top products",
      type: "sales",
      lastGenerated: "2023-12-01",
      frequency: "monthly",
      status: "available"
    },
    {
      id: "rep2",
      title: "User Acquisition Channels",
      description: "Traffic sources, conversion rates by source",
      type: "marketing",
      lastGenerated: "2023-12-15",
      frequency: "weekly",
      status: "scheduled"
    },
    {
      id: "rep3",
      title: "Product Performance Report",
      description: "Sales by product, category performance",
      type: "products",
      lastGenerated: "2023-12-10",
      frequency: "monthly",
      status: "available"
    },
    {
      id: "rep4",
      title: "User Retention Analysis",
      description: "User retention rates and cohort analysis",
      type: "users",
      lastGenerated: "2023-12-05",
      frequency: "monthly",
      status: "available"
    }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter reports based on search query and type filter
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === "" ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === null || report.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Report type options with icons
  const reportTypeOptions = [
    { value: "sales", label: "Sales", icon: <PieChart className="h-4 w-4" /> },
    { value: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { value: "products", label: "Products", icon: <Activity className="h-4 w-4" /> },
    { value: "marketing", label: "Marketing", icon: <FileText className="h-4 w-4" /> }
  ];

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "sales":
        return <PieChart className="h-5 w-5 text-blue-600" />;
      case "users":
        return <Users className="h-5 w-5 text-purple-600" />;
      case "products":
        return <Activity className="h-5 w-5 text-emerald-600" />;
      case "marketing":
        return <FileText className="h-5 w-5 text-rose-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <span className="px-3 py-1 text-xs bg-green-100 border-2 border-black text-green-700 font-medium">Available</span>;
      case "scheduled":
        return <span className="px-3 py-1 text-xs bg-blue-100 border-2 border-black text-blue-700 font-medium">Scheduled</span>;
      case "processing":
        return <span className="px-3 py-1 text-xs bg-yellow-100 border-2 border-black text-yellow-700 font-medium">Processing</span>;
      case "failed":
        return <span className="px-3 py-1 text-xs bg-red-100 border-2 border-black text-red-700 font-medium">Failed</span>;
      default:
        return <span className="px-3 py-1 text-xs bg-gray-100 border-2 border-black text-gray-700 font-medium">Unknown</span>;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const badges: Record<string, ReactElement> = {
      once: <span className="px-2 py-0.5 text-xs bg-gray-100 border border-black text-gray-700">One-time</span>,
      daily: <span className="px-2 py-0.5 text-xs bg-purple-100 border border-black text-purple-700">Daily</span>,
      weekly: <span className="px-2 py-0.5 text-xs bg-blue-100 border border-black text-blue-700">Weekly</span>,
      monthly: <span className="px-2 py-0.5 text-xs bg-emerald-100 border border-black text-emerald-700">Monthly</span>,
      custom: <span className="px-2 py-0.5 text-xs bg-amber-100 border border-black text-amber-700">Custom</span>
    };
    return badges[frequency] || badges.once;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-bold text-black flex items-center mb-4 lg:mb-0">
          <Activity className="mr-2 h-5 w-5 text-brutal-blue" />
          {t("Custom Reports" as any)}
        </h3>

        <button
          className="px-4 py-2 bg-brutal-blue text-white text-sm hover:bg-brutal-blue/90 transition-colors flex items-center border-2 border-black font-medium"
          style={{ boxShadow: '3px 3px 0 0 #000000' }}
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("Create Report" as any)}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full pl-10 pr-3 py-2 bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex">
          <div className="relative w-full">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select
              className="w-full appearance-none pl-10 pr-8 py-2 bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
              value={typeFilter || ""}
              onChange={(e) => setTypeFilter(e.target.value === "" ? null : e.target.value)}
            >
              <option value="">All Types</option>
              {reportTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Create Report Form (conditionally displayed) */}
      {showCreateForm && (
        <motion.div
          className="bg-white border-[3px] border-black p-5 mb-6"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-black">Create New Report</h4>
            <button
              className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors border-2 border-black"
              onClick={() => setShowCreateForm(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">Report Title</label>
              <input
                type="text"
                placeholder="e.g., Monthly Sales Analysis"
                className="w-full px-3 py-2 bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">Report Type</label>
              <select className="w-full px-3 py-2 bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue">
                {reportTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">Frequency</label>
              <select className="w-full px-3 py-2 bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue">
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief description of the report"
                className="w-full px-3 py-2 bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
              />
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h5 className="text-black font-bold">Select Metrics</h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center p-3 bg-gray-50 border-2 border-black hover:border-brutal-blue transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-brutal-blue" />
                <span className="text-black text-sm font-medium">Revenue</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 border-2 border-black hover:border-brutal-blue transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-brutal-blue" />
                <span className="text-black text-sm font-medium">Orders Count</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 border-2 border-black hover:border-brutal-blue transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-brutal-blue" />
                <span className="text-black text-sm font-medium">Top Products</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 border-2 border-black hover:border-brutal-blue transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-brutal-blue" />
                <span className="text-black text-sm font-medium">Average Order Value</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 border-2 border-black hover:border-brutal-blue transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-brutal-blue" />
                <span className="text-black text-sm font-medium">Conversion Rate</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 border-2 border-black hover:border-brutal-blue transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-brutal-blue" />
                <span className="text-black text-sm font-medium">Traffic Sources</span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-gray-200">
              <button className="text-sm text-brutal-blue hover:underline flex items-center font-medium">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Custom Metric
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 border-2 border-black text-black text-sm hover:bg-gray-100 transition-colors font-medium"
              style={{ boxShadow: '2px 2px 0 0 #000000' }}
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-brutal-blue text-white text-sm hover:bg-brutal-blue/90 transition-colors font-medium border-2 border-black"
              style={{ boxShadow: '2px 2px 0 0 #000000' }}
            >
              Create Report
            </button>
          </div>
        </motion.div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border-[3px] border-black p-8 text-center" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
          <div className="inline-block p-3 bg-brutal-blue/10 border-2 border-black mb-3">
            <FileText className="h-6 w-6 text-brutal-blue" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">No reports found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || typeFilter
              ? "Try adjusting your search or filters to find what you're looking for."
              : "You haven't created any reports yet."}
          </p>
          <button
            className="px-4 py-2 bg-brutal-blue text-white text-sm hover:bg-brutal-blue/90 transition-colors font-medium border-2 border-black"
            style={{ boxShadow: '3px 3px 0 0 #000000' }}
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <motion.div
              key={report.id}
              className="bg-white border-[3px] border-black p-5"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 border-2 border-black mr-4">
                  {getReportTypeIcon(report.type)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                    <h4 className="text-black font-bold flex items-center">
                      {report.title}
                      <span className="ml-2">{getFrequencyBadge(report.frequency)}</span>
                    </h4>
                    {getStatusBadge(report.status)}
                  </div>
                  <p className="text-gray-600 text-sm">{report.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 mt-4">
                <div className="flex-1 text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Last generated: {report.lastGenerated}
                </div>

                <button className="px-3 py-1.5 text-xs bg-brutal-blue/20 text-brutal-blue hover:bg-brutal-blue/30 flex items-center border-2 border-black font-medium transition-colors"
                  style={{ boxShadow: '2px 2px 0 0 #000000' }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </button>

                {report.status === "available" && (
                  <button className="px-3 py-1.5 text-xs bg-brutal-blue/20 text-brutal-blue hover:bg-brutal-blue/30 flex items-center border-2 border-black font-medium transition-colors"
                    style={{ boxShadow: '2px 2px 0 0 #000000' }}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </button>
                )}

                <button className="px-3 py-1.5 text-xs bg-gray-100 border-2 border-black text-gray-700 hover:bg-gray-200 flex items-center font-medium transition-colors"
                  style={{ boxShadow: '2px 2px 0 0 #000000' }}
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
