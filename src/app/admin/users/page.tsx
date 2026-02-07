"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Mock users data
const mockUsers = [
  {
    id: "1",
    name: "สมชาย ใจดี",
    email: "somchai@example.com",
    role: "user",
    status: "active",
    joinedDate: "2024-01-15",
    orders: 12,
    totalSpent: 15400,
  },
  {
    id: "2",
    name: "สมหญิง รักเรียน",
    email: "somying@example.com",
    role: "user",
    status: "active",
    joinedDate: "2024-02-20",
    orders: 8,
    totalSpent: 8900,
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@gametopup.com",
    role: "admin",
    status: "active",
    joinedDate: "2023-12-01",
    orders: 0,
    totalSpent: 0,
  },
  {
    id: "4",
    name: "ทดสอบ ระบบ",
    email: "test@example.com",
    role: "user",
    status: "inactive",
    joinedDate: "2024-03-10",
    orders: 3,
    totalSpent: 2500,
  },
  {
    id: "5",
    name: "เกมเมอร์ ตัวจริง",
    email: "gamer@example.com",
    role: "user",
    status: "active",
    joinedDate: "2024-01-05",
    orders: 25,
    totalSpent: 45000,
  },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  return (
    <AdminLayout title="ผู้ใช้">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-yellow mr-2"></span>
            <h1 className="text-2xl font-bold text-black">จัดการผู้ใช้</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-black text-white border-[3px] border-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center font-medium"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}>
              <Users className="h-4 w-4 mr-2" />
              เพิ่มผู้ใช้
            </button>
          </div>
        </div>

        {/* Filters */}
        <motion.div
          className="bg-white border-[3px] border-black rounded-xl p-4"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:border-black focus:outline-none"
              >
                <option value="all">ทุกบทบาท</option>
                <option value="user">ผู้ใช้</option>
                <option value="admin">แอดมิน</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:border-black focus:outline-none"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          className="bg-white border-[3px] border-black rounded-xl overflow-hidden"
          style={{ boxShadow: '4px 4px 0 0 #000000' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-[2px] border-black">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      onChange={toggleAllSelection}
                      className="w-4 h-4 border-[2px] border-black rounded text-brutal-purple focus:ring-black"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    ผู้ใช้
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    บทบาท
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    สถานะ
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    วันที่สมัคร
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">
                    คำสั่งซื้อ
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-black">
                    ยอดใช้จ่าย
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-black">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 border-[2px] border-black rounded text-brutal-purple focus:ring-black"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brutal-purple flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border-[2px] ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 border-purple-500"
                            : "bg-gray-100 text-gray-700 border-gray-500"
                        }`}
                      >
                        {user.role === "admin" ? "แอดมิน" : "ผู้ใช้"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border-[2px] ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700 border-green-500"
                            : "bg-red-100 text-red-700 border-red-500"
                        }`}
                      >
                        {user.status === "active" ? "ใช้งาน" : "ไม่ใช้งาน"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.joinedDate).toLocaleDateString("th-TH")}
                    </td>
                    <td className="py-3 px-4 text-sm text-black">
                      {user.orders}
                    </td>
                    <td className="py-3 px-4 text-sm text-black text-right font-medium">
                      ฿{user.totalSpent.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-brutal-blue hover:bg-blue-50 rounded-lg transition-colors border-[2px] border-transparent hover:border-brutal-blue">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-[2px] border-transparent hover:border-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t-[2px] border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              แสดง {filteredUsers.length} จาก {mockUsers.length} รายการ
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border-[2px] border-gray-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm text-black font-medium">
                หน้า {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-lg border-[2px] border-gray-300 hover:border-black transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <motion.div
            className="bg-brutal-yellow border-[3px] border-black rounded-xl p-4 flex items-center justify-between"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-black font-medium">
              เลือก {selectedUsers.length} รายการ
            </span>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border-[2px] border-black rounded-lg text-black hover:bg-gray-100 transition-colors flex items-center text-sm font-medium">
                <UserCheck className="h-4 w-4 mr-2" />
                เปิดใช้งาน
              </button>
              <button className="px-4 py-2 bg-white border-[2px] border-black rounded-lg text-black hover:bg-gray-100 transition-colors flex items-center text-sm font-medium">
                <UserX className="h-4 w-4 mr-2" />
                ปิดใช้งาน
              </button>
              <button className="px-4 py-2 bg-red-500 border-[2px] border-black rounded-lg text-white hover:bg-red-600 transition-colors flex items-center text-sm font-medium">
                <Trash2 className="h-4 w-4 mr-2" />
                ลบ
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
