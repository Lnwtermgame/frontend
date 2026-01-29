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
        return <PieChart className="h-5 w-5 text-blue-500" />;
      case "users":
        return <Users className="h-5 w-5 text-purple-500" />;
      case "products":
        return <Activity className="h-5 w-5 text-emerald-500" />;
      case "marketing":
        return <FileText className="h-5 w-5 text-rose-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <span className="px-3 py-1 rounded-full text-xs bg-green-900/30 text-green-400">Available</span>;
      case "scheduled":
        return <span className="px-3 py-1 rounded-full text-xs bg-blue-900/30 text-blue-400">Scheduled</span>;
      case "processing":
        return <span className="px-3 py-1 rounded-full text-xs bg-yellow-900/30 text-yellow-400">Processing</span>;
      case "failed":
        return <span className="px-3 py-1 rounded-full text-xs bg-red-900/30 text-red-400">Failed</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs bg-gray-900/30 text-gray-400">Unknown</span>;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const badges: Record<string, ReactElement> = {
      once: <span className="px-2 py-0.5 rounded-full text-xs bg-mali-blue/10 text-mali-blue/70">One-time</span>,
      daily: <span className="px-2 py-0.5 rounded-full text-xs bg-purple-900/10 text-purple-400/70">Daily</span>,
      weekly: <span className="px-2 py-0.5 rounded-full text-xs bg-blue-900/10 text-blue-400/70">Weekly</span>,
      monthly: <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-900/10 text-emerald-400/70">Monthly</span>,
      custom: <span className="px-2 py-0.5 rounded-full text-xs bg-amber-900/10 text-amber-400/70">Custom</span>
    };
    return badges[frequency] || badges.once;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center mb-4 lg:mb-0">
          <Activity className="mr-2 h-5 w-5 text-mali-blue" />
          {t("Custom Reports" as any)}
        </h3>
        
        <button 
          className="px-4 py-2 rounded-lg bg-mali-blue text-white text-sm hover:bg-mali-blue/80 transition-colors flex items-center"
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mali-blue/50" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="w-full pl-10 pr-3 py-2 bg-mali-900/50 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex">
          <div className="relative w-full">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mali-blue/50" />
            <select 
              className="w-full appearance-none pl-10 pr-8 py-2 bg-mali-900/50 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue"
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
              <svg className="h-4 w-4 text-mali-blue/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Report Form (conditionally displayed) */}
      {showCreateForm && (
        <motion.div 
          className="bg-mali-card rounded-xl border border-mali-blue/20 p-5 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-medium text-white">Create New Report</h4>
            <button 
              className="p-1 rounded-full hover:bg-mali-blue/10 text-mali-blue/70 hover:text-mali-blue transition-colors"
              onClick={() => setShowCreateForm(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-mali-blue/70 mb-1.5">Report Title</label>
              <input 
                type="text" 
                placeholder="e.g., Monthly Sales Analysis" 
                className="w-full px-3 py-2 bg-mali-900/50 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-mali-blue/70 mb-1.5">Report Type</label>
              <select className="w-full px-3 py-2 bg-mali-900/50 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue">
                {reportTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-mali-blue/70 mb-1.5">Frequency</label>
              <select className="w-full px-3 py-2 bg-mali-900/50 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue">
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-mali-blue/70 mb-1.5">Description (Optional)</label>
              <input 
                type="text" 
                placeholder="Brief description of the report" 
                className="w-full px-3 py-2 bg-mali-900/50 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue"
              />
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <h5 className="text-white font-medium">Select Metrics</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center p-3 rounded-lg bg-mali-900/30 border border-mali-blue/10 hover:border-mali-blue/30 transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-mali-blue" />
                <span className="text-white text-sm">Revenue</span>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-mali-900/30 border border-mali-blue/10 hover:border-mali-blue/30 transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-mali-blue" />
                <span className="text-white text-sm">Orders Count</span>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-mali-900/30 border border-mali-blue/10 hover:border-mali-blue/30 transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-mali-blue" />
                <span className="text-white text-sm">Top Products</span>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-mali-900/30 border border-mali-blue/10 hover:border-mali-blue/30 transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-mali-blue" />
                <span className="text-white text-sm">Average Order Value</span>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-mali-900/30 border border-mali-blue/10 hover:border-mali-blue/30 transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-mali-blue" />
                <span className="text-white text-sm">Conversion Rate</span>
              </div>
              <div className="flex items-center p-3 rounded-lg bg-mali-900/30 border border-mali-blue/10 hover:border-mali-blue/30 transition-colors">
                <input type="checkbox" className="h-4 w-4 mr-3 accent-mali-blue" />
                <span className="text-white text-sm">Traffic Sources</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-mali-blue/10">
              <button className="text-sm text-mali-blue hover:text-mali-blue/80 flex items-center">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Custom Metric
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              className="px-4 py-2 rounded-lg border border-mali-blue/30 text-mali-blue text-sm hover:bg-mali-blue/10 transition-colors"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
            <button className="px-4 py-2 rounded-lg bg-mali-blue text-white text-sm hover:bg-mali-blue/80 transition-colors">
              Create Report
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-8 text-center">
          <div className="inline-block p-3 bg-mali-blue/10 rounded-full mb-3">
            <FileText className="h-6 w-6 text-mali-blue" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
          <p className="text-mali-blue/70 mb-4">
            {searchQuery || typeFilter
              ? "Try adjusting your search or filters to find what you're looking for."
              : "You haven't created any reports yet."}
          </p>
          <button 
            className="px-4 py-2 rounded-lg bg-mali-blue text-white text-sm hover:bg-mali-blue/80 transition-colors"
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
              className="bg-mali-card rounded-xl border border-mali-blue/20 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-mali-blue/10 mr-4">
                  {getReportTypeIcon(report.type)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                    <h4 className="text-white font-medium flex items-center">
                      {report.title}
                      <span className="ml-2">{getFrequencyBadge(report.frequency)}</span>
                    </h4>
                    {getStatusBadge(report.status)}
                  </div>
                  <p className="text-mali-blue/70 text-sm">{report.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-end gap-2 mt-4">
                <div className="flex-1 text-xs text-mali-blue/50 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Last generated: {report.lastGenerated}
                </div>
                
                <button className="px-3 py-1.5 text-xs rounded-lg bg-mali-blue/20 text-mali-blue hover:bg-mali-blue/30 flex items-center">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </button>
                
                {report.status === "available" && (
                  <button className="px-3 py-1.5 text-xs rounded-lg bg-mali-blue/20 text-mali-blue hover:bg-mali-blue/30 flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </button>
                )}
                
                <button className="px-3 py-1.5 text-xs rounded-lg bg-mali-900/40 border border-mali-blue/20 text-mali-blue/80 hover:bg-mali-blue/10 flex items-center">
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
