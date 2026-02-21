"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import {
  BarChart3,
  Target,
  PlusCircle,
  X,
  Check,
  LineChart,
} from "lucide-react";

// Dummy translation helper
const t = (str: any) => str;

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "paused";
  startDate: string;
  endDate: string | null;
  variants: {
    name: string;
    visitors: number;
    conversion: number;
    change: number;
  }[];
}

interface ABTestingPanelProps {
  initialTests?: ABTest[];
}

export default function ABTestingPanel({
  initialTests = [],
}: ABTestingPanelProps) {
  const [tests, setTests] = useState<ABTest[]>(
    initialTests.length > 0
      ? initialTests
      : [
          {
            id: "test1",
            name: "Homepage Layout Test",
            description: "Testing header design variants",
            status: "active",
            startDate: "2023-11-28",
            endDate: null,
            variants: [
              {
                name: "Variant A",
                visitors: 4532,
                conversion: 2.8,
                change: 0.3,
              },
              {
                name: "Variant B",
                visitors: 4489,
                conversion: 3.2,
                change: 0.7,
              },
            ],
          },
          {
            id: "test2",
            name: "Checkout Flow Test",
            description: "Testing single-page vs multi-step checkout",
            status: "active",
            startDate: "2023-12-05",
            endDate: null,
            variants: [
              {
                name: "Single-page",
                visitors: 2145,
                conversion: 64.3,
                change: -2.1,
              },
              {
                name: "Multi-step",
                visitors: 2168,
                conversion: 72.8,
                change: 6.4,
              },
            ],
          },
          {
            id: "test3",
            name: "Call-to-Action Test",
            description: "Testing button colors and text",
            status: "completed",
            startDate: "2023-10-15",
            endDate: "2023-11-15",
            variants: [
              {
                name: "Blue Button",
                visitors: 3245,
                conversion: 4.2,
                change: 0.0,
              },
              {
                name: "Green Button",
                visitors: 3198,
                conversion: 5.1,
                change: 0.9,
              },
              {
                name: "Red Button",
                visitors: 3267,
                conversion: 3.8,
                change: -0.4,
              },
            ],
          },
        ],
  );
  const [selectedTab, setSelectedTab] = useState<
    "active" | "completed" | "all"
  >("active");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredTests =
    selectedTab === "all"
      ? tests
      : tests.filter((test) =>
          selectedTab === "active"
            ? test.status === "active"
            : test.status === "completed",
        );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 text-xs bg-green-100 border-2 border-black text-green-700 font-medium">
            Active
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 text-xs bg-blue-100 border-2 border-black text-blue-700 font-medium">
            Completed
          </span>
        );
      case "paused":
        return (
          <span className="px-3 py-1 text-xs bg-yellow-100 border-2 border-black text-yellow-700 font-medium">
            Paused
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs bg-gray-100 border-2 border-black text-gray-700 font-medium">
            Unknown
          </span>
        );
    }
  };

  // Find the winning variant for completed tests
  const getWinningVariant = (variants: ABTest["variants"]) => {
    if (variants.length <= 1) return null;
    return variants.reduce((prev, current) =>
      current.conversion > prev.conversion ? current : prev,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-bold text-black flex items-center mb-4 lg:mb-0">
          <Target className="mr-2 h-5 w-5 text-brutal-blue" />
          {t("A/B Testing" as any)}
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex bg-white border-2 border-black overflow-hidden mr-2"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            {[
              { id: "active", label: "Active Tests" },
              { id: "completed", label: "Completed" },
              { id: "all", label: "All Tests" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-1.5 text-sm transition-colors font-medium ${
                  selectedTab === tab.id
                    ? "bg-brutal-blue text-white"
                    : "text-black hover:bg-gray-100"
                }`}
                onClick={() => setSelectedTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            className="px-3 py-1.5 bg-brutal-blue text-white text-sm hover:bg-brutal-blue/90 transition-colors flex items-center border-2 border-black font-medium"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
            onClick={() => setShowCreateForm(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            {t("New Test" as any)}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <motion.div
          className="bg-white border-[3px] border-black p-5 mb-6"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-bold text-black">
              Create New A/B Test
            </h4>
            <button
              className="p-1 hover:bg-gray-100 text-gray-600 hover:text-black border-2 border-black transition-colors"
              onClick={() => setShowCreateForm(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">
                Test Name
              </label>
              <input
                type="text"
                className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                placeholder="e.g., Homepage Hero Image Test"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">
                Description
              </label>
              <input
                type="text"
                className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                placeholder="e.g., Testing different hero images for conversion"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">
                Target Page
              </label>
              <input
                type="text"
                className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                placeholder="e.g., /homepage"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5 font-medium">
                Test Duration
              </label>
              <select className="w-full bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue">
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1.5 font-medium">
              Variants
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                  placeholder="Variant A"
                />
                <input
                  type="text"
                  className="flex-1 bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                  placeholder="Description for Variant A"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                  placeholder="Variant B"
                />
                <input
                  type="text"
                  className="flex-1 bg-white border-2 border-black px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-brutal-blue"
                  placeholder="Description for Variant B"
                />
              </div>
            </div>
            <button className="mt-2 text-sm text-brutal-blue hover:underline flex items-center font-medium">
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Add Another Variant
            </button>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 border-2 border-black text-black text-sm hover:bg-gray-100 transition-colors font-medium"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-brutal-blue text-white text-sm hover:bg-brutal-blue/90 transition-colors font-medium border-2 border-black"
              style={{ boxShadow: "2px 2px 0 0 #000000" }}
            >
              Create Test
            </button>
          </div>
        </motion.div>
      )}

      {filteredTests.length === 0 ? (
        <div
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="inline-block p-3 bg-brutal-blue/10 border-2 border-black mb-3">
            <Target className="h-6 w-6 text-brutal-blue" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">
            No {selectedTab} tests found
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedTab === "active"
              ? "You don't have any active tests running."
              : selectedTab === "completed"
                ? "You don't have any completed tests yet."
                : "You haven't created any A/B tests yet."}
          </p>
          <button
            className="px-4 py-2 bg-brutal-blue text-white text-sm hover:bg-brutal-blue/90 transition-colors font-medium border-2 border-black"
            style={{ boxShadow: "3px 3px 0 0 #000000" }}
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First Test
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => (
            <motion.div
              key={test.id}
              className="bg-white border-[3px] border-black p-5"
              style={{ boxShadow: "4px 4px 0 0 #000000" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center">
                    <h4 className="text-black font-bold">{test.name}</h4>
                    <span className="text-xs text-gray-500 ml-3">
                      ID: {test.id}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{test.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  {getStatusBadge(test.status)}
                  <span className="text-xs text-gray-500 mt-1">
                    {test.startDate} {test.endDate ? `to ${test.endDate}` : ""}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {test.variants.map((variant, idx) => {
                  const winningVariant =
                    test.status === "completed"
                      ? getWinningVariant(test.variants)
                      : null;
                  const isWinner =
                    winningVariant && variant.name === winningVariant.name;

                  return (
                    <div
                      key={idx}
                      className={`p-3 border-2 border-black ${
                        isWinner ? "bg-green-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-bold ${isWinner ? "text-green-700" : "text-black"}`}
                        >
                          {variant.name}
                          {isWinner && (
                            <Check className="inline-block h-3.5 w-3.5 ml-1.5 text-green-600" />
                          )}
                        </span>
                        <span className="text-xs text-gray-600">
                          {variant.visitors.toLocaleString()} visitors
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          Conversion: {variant.conversion}%
                        </span>
                        <span
                          className={`text-xs font-medium ${variant.change > 0 ? "text-green-600" : variant.change < 0 ? "text-red-600" : "text-gray-500"}`}
                        >
                          {variant.change > 0 ? "+" : ""}
                          {variant.change}%
                        </span>
                      </div>

                      {/* Simple bar visualization */}
                      <div className="mt-2 w-full bg-gray-200 h-2 border border-black">
                        <div
                          className={`h-full ${
                            isWinner ? "bg-green-500" : "bg-brutal-blue"
                          }`}
                          style={{
                            width: `${Math.min(100, variant.conversion * 5)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {test.status === "active" && (
                <div className="flex gap-2 mt-3">
                  <button
                    className="px-3 py-1.5 text-xs bg-brutal-blue/20 text-brutal-blue hover:bg-brutal-blue/30 flex items-center border-2 border-black font-medium transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <LineChart className="h-3.5 w-3.5 mr-1.5" />
                    View Full Stats
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs bg-gray-100 border-2 border-black text-gray-700 hover:bg-gray-200 font-medium transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    Stop Test
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs bg-gray-100 border-2 border-black text-gray-700 hover:bg-gray-200 font-medium transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    Edit
                  </button>
                </div>
              )}

              {test.status === "completed" && (
                <div className="flex gap-2 mt-3">
                  <button
                    className="px-3 py-1.5 text-xs bg-brutal-blue/20 text-brutal-blue hover:bg-brutal-blue/30 flex items-center border-2 border-black font-medium transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                    View Report
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs bg-green-100 border-2 border-black text-green-700 hover:bg-green-200 flex items-center font-medium transition-colors"
                    style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Apply Winner
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
