"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/framer-exports";
import {
    CheckCircle2,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    XCircle,
    CreditCard,
    Settings,
    ShieldCheck,
    Activity,
    FileCode2,
} from "lucide-react";
import toast from "react-hot-toast";

import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/lib/hooks/use-auth";
import {
    AdminPaymentGateway,
    AdminPaymentOption,
    PaymentAuditLogItem,
    PaymentMethodCode,
    WebhookNonceItem,
    paymentApi,
} from "@/lib/services/payment-api";

type GatewayFormState = {
    name: string;
    provider: string;
    feePercent: string;
    flatFee: string;
    isActive: boolean;
};

type OptionFormState = {
    gatewayId: string;
    code: string;
    label: string;
    method: PaymentMethodCode;
    surchargePercent: string;
    flatFee: string;
    minAmount: string;
    maxAmount: string;
    isActive: boolean;
};

const PAYMENT_METHODS: PaymentMethodCode[] = [
    "PROMPTPAY",
    "TRUEMONEY",
    "LINEPAY",
    "BANK_TRANSFER",
];

const defaultGatewayForm: GatewayFormState = {
    name: "",
    provider: "",
    feePercent: "0",
    flatFee: "0",
    isActive: true,
};

const defaultOptionForm: OptionFormState = {
    gatewayId: "",
    code: "",
    label: "",
    method: "PROMPTPAY",
    surchargePercent: "0",
    flatFee: "0",
    minAmount: "",
    maxAmount: "",
    isActive: true,
};

export default function AdminPaymentsPage() {
    const { isAdmin, isInitialized, isSessionChecked } = useAuth();
    const [gateways, setGateways] = useState<AdminPaymentGateway[]>([]);
    const [options, setOptions] = useState<AdminPaymentOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [auditLogs, setAuditLogs] = useState<PaymentAuditLogItem[]>([]);
    const [webhookNonces, setWebhookNonces] = useState<WebhookNonceItem[]>([]);

    const [gatewayForm, setGatewayForm] =
        useState<GatewayFormState>(defaultGatewayForm);
    const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
    const [savingGateway, setSavingGateway] = useState(false);

    const [optionForm, setOptionForm] =
        useState<OptionFormState>(defaultOptionForm);
    const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
    const [savingOption, setSavingOption] = useState(false);

    const gatewayNameMap = useMemo(() => {
        return Object.fromEntries(
            gateways.map((gateway) => [gateway.id, gateway.name]),
        );
    }, [gateways]);

    const fetchAll = async (showSpinner = true) => {
        try {
            if (showSpinner) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const [gatewayRes, optionRes, auditRes, nonceRes] = await Promise.all([
                paymentApi.getAdminGateways(),
                paymentApi.getAdminOptions(),
                paymentApi.getAdminAuditLogs({ page: 1, limit: 30 }),
                paymentApi.getAdminWebhookNonces({
                    provider: "SEAGM",
                    page: 1,
                    limit: 30,
                }),
            ]);

            setGateways(gatewayRes.data);
            setOptions(optionRes.data);
            setAuditLogs(auditRes.data.items);
            setWebhookNonces(nonceRes.data.items);

            setOptionForm((prev) => {
                if (prev.gatewayId) {
                    return prev;
                }
                return {
                    ...prev,
                    gatewayId: gatewayRes.data[0]?.id || "",
                };
            });
        } catch (error) {
            console.error(error);
            toast.error("ไม่สามารถโหลดข้อมูลการชำระเงินได้");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isInitialized || !isSessionChecked || !isAdmin) {
            return;
        }
        fetchAll();
    }, [isInitialized, isSessionChecked, isAdmin]);

    const resetGatewayForm = () => {
        setGatewayForm(defaultGatewayForm);
        setEditingGatewayId(null);
    };

    const resetOptionForm = () => {
        setOptionForm({
            ...defaultOptionForm,
            gatewayId: gateways[0]?.id || "",
        });
        setEditingOptionId(null);
    };

    const handleEditGateway = (gateway: AdminPaymentGateway) => {
        setEditingGatewayId(gateway.id);
        setGatewayForm({
            name: gateway.name,
            provider: gateway.provider,
            feePercent: String(gateway.feePercent),
            flatFee: String(gateway.flatFee),
            isActive: gateway.isActive,
        });
    };

    const handleEditOption = (option: AdminPaymentOption) => {
        setEditingOptionId(option.id);
        setOptionForm({
            gatewayId: option.gatewayId,
            code: option.code,
            label: option.label,
            method: option.method,
            surchargePercent: String(option.surchargePercent),
            flatFee: String(option.flatFee),
            minAmount: option.minAmount === null ? "" : String(option.minAmount),
            maxAmount: option.maxAmount === null ? "" : String(option.maxAmount),
            isActive: option.isActive,
        });
    };

    const handleSaveGateway = async () => {
        if (!gatewayForm.name.trim() || !gatewayForm.provider.trim()) {
            toast.error("กรอกชื่อและ provider ของ gateway ให้ครบ");
            return;
        }

        setSavingGateway(true);
        try {
            const payload = {
                name: gatewayForm.name.trim(),
                provider: gatewayForm.provider.trim().toLowerCase(),
                feePercent: Number(gatewayForm.feePercent || 0),
                flatFee: Number(gatewayForm.flatFee || 0),
                isActive: gatewayForm.isActive,
            };

            if (editingGatewayId) {
                await paymentApi.updateGateway(editingGatewayId, payload);
                toast.success("อัปเดต gateway สำเร็จ");
            } else {
                await paymentApi.createGateway(payload);
                toast.success("สร้าง gateway สำเร็จ");
            }

            resetGatewayForm();
            await fetchAll(false);
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message || "ไม่สามารถบันทึก gateway ได้";
            toast.error(message);
        } finally {
            setSavingGateway(false);
        }
    };

    const handleSaveOption = async () => {
        if (
            !optionForm.gatewayId ||
            !optionForm.code.trim() ||
            !optionForm.label.trim()
        ) {
            toast.error("กรอกข้อมูล payment option ให้ครบ");
            return;
        }

        const minAmount = optionForm.minAmount.trim()
            ? Number(optionForm.minAmount)
            : null;
        const maxAmount = optionForm.maxAmount.trim()
            ? Number(optionForm.maxAmount)
            : null;

        if (minAmount !== null && maxAmount !== null && maxAmount < minAmount) {
            toast.error("จำนวนสูงสุดต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ");
            return;
        }

        setSavingOption(true);
        try {
            const payload = {
                gatewayId: optionForm.gatewayId,
                code: optionForm.code.trim().toUpperCase(),
                label: optionForm.label.trim(),
                method: optionForm.method,
                surchargePercent: Number(optionForm.surchargePercent || 0),
                flatFee: Number(optionForm.flatFee || 0),
                minAmount,
                maxAmount,
                isActive: optionForm.isActive,
            };

            if (editingOptionId) {
                await paymentApi.updateOption(editingOptionId, payload);
                toast.success("อัปเดต payment option สำเร็จ");
            } else {
                await paymentApi.createOption(payload);
                toast.success("สร้าง payment option สำเร็จ");
            }

            resetOptionForm();
            await fetchAll(false);
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                "ไม่สามารถบันทึก payment option ได้";
            toast.error(message);
        } finally {
            setSavingOption(false);
        }
    };

    const toggleGateway = async (gateway: AdminPaymentGateway) => {
        try {
            await paymentApi.updateGateway(gateway.id, {
                isActive: !gateway.isActive,
            });
            toast.success(`เปลี่ยนสถานะ ${gateway.name} สำเร็จ`);
            await fetchAll(false);
        } catch {
            toast.error("ไม่สามารถเปลี่ยนสถานะ gateway ได้");
        }
    };

    const toggleOption = async (option: AdminPaymentOption) => {
        try {
            await paymentApi.updateOption(option.id, { isActive: !option.isActive });
            toast.success(`เปลี่ยนสถานะ ${option.code} สำเร็จ`);
            await fetchAll(false);
        } catch {
            toast.error("ไม่สามารถเปลี่ยนสถานะ payment option ได้");
        }
    };

    return (
        <AdminLayout title="จัดการช่องทางชำระเงิน">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-black thai-font">
                            Payment Gateways & Options
                        </h2>
                        <p className="text-xs text-gray-600 thai-font">
                            จัดการผู้ให้บริการชำระเงินและช่องทางรับเงินทั้งหมด
                        </p>
                    </div>
                    <button
                        onClick={() => fetchAll(false)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 border-[2px] border-black bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-100 disabled:opacity-60"
                        style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                        {refreshing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3" />
                        )}
                        รีเฟรช
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-brutal-pink" />
                    </div>
                ) : (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-none border-[3px] border-black bg-white overflow-hidden"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                            <div className="p-3 border-b-[2px] border-black flex justify-between items-center bg-gray-50">
                                <h3 className="text-sm font-semibold text-black flex items-center thai-font">
                                    <span className="w-1.5 h-4 bg-brutal-pink mr-2"></span>
                                    <CreditCard className="mr-2 h-4 w-4 text-brutal-pink" />
                                    Payment Gateways
                                </h3>
                            </div>
                            <div className="p-3 space-y-3">
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                                    <input
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="ชื่อ Gateway"
                                        value={gatewayForm.name}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Provider (e.g. feelfreepay)"
                                        value={gatewayForm.provider}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                provider: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Gateway Fee %"
                                        value={gatewayForm.feePercent}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                feePercent: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Flat Fee"
                                        value={gatewayForm.flatFee}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                flatFee: e.target.value,
                                            }))
                                        }
                                    />
                                    <label className="flex items-center gap-2 border-2 border-black px-2 py-1.5 font-medium text-sm">
                                        <input
                                            type="checkbox"
                                            checked={gatewayForm.isActive}
                                            onChange={(e) =>
                                                setGatewayForm((prev) => ({
                                                    ...prev,
                                                    isActive: e.target.checked,
                                                }))
                                            }
                                        />
                                        Active
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleSaveGateway}
                                        disabled={savingGateway}
                                        className="inline-flex items-center gap-2 border-[2px] border-black bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                                    >
                                        {savingGateway ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Save className="h-3 w-3" />
                                        )}
                                        {editingGatewayId ? "บันทึกการแก้ไข" : "สร้าง Gateway"}
                                    </button>
                                    {editingGatewayId && (
                                        <button
                                            onClick={resetGatewayForm}
                                            className="inline-flex items-center gap-2 border-[2px] border-black bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
                                        >
                                            <XCircle className="h-3 w-3" />
                                            ยกเลิก
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-x-auto border-2 border-black">
                                    <table className="w-full min-w-[720px] text-xs">
                                        <thead className="bg-gray-50 text-left border-b-2 border-black">
                                            <tr>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Gateway</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Provider</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Fee %</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Flat Fee</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Options</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Status</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {gateways.map((gateway) => (
                                                <tr key={gateway.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 py-2 font-bold text-black text-xs">
                                                        {gateway.name}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-[11px] font-medium text-gray-600">{gateway.provider}</td>
                                                    <td className="px-3 py-2 font-medium">{gateway.feePercent}%</td>
                                                    <td className="px-3 py-2 font-medium">฿{gateway.flatFee}</td>
                                                    <td className="px-3 py-2 font-medium">{gateway.optionCount}</td>
                                                    <td className="px-3 py-2">
                                                        {gateway.isActive ? (
                                                            <span className="px-2 py-1 rounded-sm text-[10px] sm:text-xs border-[1px] font-medium whitespace-nowrap text-green-700 bg-green-100 border-green-300 flex items-center gap-1 w-fit">
                                                                <CheckCircle2 className="h-3 w-3" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-sm text-[10px] sm:text-xs border-[1px] font-medium whitespace-nowrap text-gray-600 bg-gray-100 border-gray-300 flex items-center gap-1 w-fit">
                                                                <XCircle className="h-3 w-3" /> Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditGateway(gateway)}
                                                                className="rounded-none border border-black px-2 py-0.5 font-medium hover:bg-gray-100"
                                                            >
                                                                แก้ไข
                                                            </button>
                                                            <button
                                                                onClick={() => toggleGateway(gateway)}
                                                                className="rounded-none border border-black px-2 py-0.5 font-medium hover:bg-gray-100"
                                                            >
                                                                {gateway.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-none border-[3px] border-black bg-white overflow-hidden"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                            <div className="p-3 border-b-[2px] border-black flex justify-between items-center bg-gray-50">
                                <h3 className="text-sm font-semibold text-black flex items-center thai-font">
                                    <span className="w-1.5 h-4 bg-brutal-blue mr-2"></span>
                                    <Settings className="mr-2 h-4 w-4 text-brutal-blue" />
                                    Payment Options
                                </h3>
                            </div>
                            <div className="p-3 space-y-3">
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                    <select
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        value={optionForm.gatewayId}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                gatewayId: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">เลือก Gateway</option>
                                        {gateways.map((gateway) => (
                                            <option key={gateway.id} value={gateway.id}>
                                                {gateway.name} ({gateway.provider})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Option Code (e.g. PROMPTPAY_DEFAULT)"
                                        value={optionForm.code}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({ ...prev, code: e.target.value }))
                                        }
                                    />
                                    <input
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Label"
                                        value={optionForm.label}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                label: e.target.value,
                                            }))
                                        }
                                    />
                                    <select
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        value={optionForm.method}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                method: e.target.value as PaymentMethodCode,
                                            }))
                                        }
                                    >
                                        {PAYMENT_METHODS.map((method) => (
                                            <option key={method} value={method}>
                                                {method}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Surcharge %"
                                        value={optionForm.surchargePercent}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                surchargePercent: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Flat Fee"
                                        value={optionForm.flatFee}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                flatFee: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Min Amount (optional)"
                                        value={optionForm.minAmount}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                minAmount: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="border-2 border-black px-2 py-1.5 text-sm"
                                        placeholder="Max Amount (optional)"
                                        value={optionForm.maxAmount}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                maxAmount: e.target.value,
                                            }))
                                        }
                                    />
                                    <label className="flex items-center gap-2 border-2 border-black px-2 py-1.5 font-medium text-sm">
                                        <input
                                            type="checkbox"
                                            checked={optionForm.isActive}
                                            onChange={(e) =>
                                                setOptionForm((prev) => ({
                                                    ...prev,
                                                    isActive: e.target.checked,
                                                }))
                                            }
                                        />
                                        Active
                                    </label>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleSaveOption}
                                        disabled={savingOption}
                                        className="inline-flex items-center gap-2 border-[2px] border-black bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                                    >
                                        {savingOption ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : editingOptionId ? (
                                            <Save className="h-3 w-3" />
                                        ) : (
                                            <Plus className="h-3 w-3" />
                                        )}
                                        {editingOptionId ? "บันทึกการแก้ไข" : "สร้าง Option"}
                                    </button>
                                    {editingOptionId && (
                                        <button
                                            onClick={resetOptionForm}
                                            className="inline-flex items-center gap-2 border-[2px] border-black bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
                                        >
                                            <XCircle className="h-3 w-3" />
                                            ยกเลิก
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-x-auto border-2 border-black">
                                    <table className="w-full min-w-[900px] text-xs">
                                        <thead className="bg-gray-50 text-left border-b-2 border-black">
                                            <tr>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Code</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Label</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Gateway</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Method</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Surcharge %</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Flat Fee</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Range</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Status</th>
                                                <th className="px-3 py-2 thai-font text-gray-600 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {options.map((option) => (
                                                <tr key={option.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 py-2 font-mono text-[11px] font-bold text-black">
                                                        {option.code}
                                                    </td>
                                                    <td className="px-3 py-2 font-medium">{option.label}</td>
                                                    <td className="px-3 py-2 font-medium">
                                                        {gatewayNameMap[option.gatewayId] ||
                                                            option.gateway.name}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-[11px] font-medium text-gray-600">{option.method}</td>
                                                    <td className="px-3 py-2 font-medium">
                                                        {option.surchargePercent}%
                                                    </td>
                                                    <td className="px-3 py-2 font-medium">฿{option.flatFee}</td>
                                                    <td className="px-3 py-2 font-medium text-gray-600 text-[11px]">
                                                        {option.minAmount ?? "-"} - {option.maxAmount ?? "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {option.isActive ? (
                                                            <span className="px-2 py-1 rounded-sm text-[10px] sm:text-xs border-[1px] font-medium whitespace-nowrap text-green-700 bg-green-100 border-green-300 flex items-center gap-1 w-fit">
                                                                <CheckCircle2 className="h-3 w-3" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-sm text-[10px] sm:text-xs border-[1px] font-medium whitespace-nowrap text-gray-600 bg-gray-100 border-gray-300 flex items-center gap-1 w-fit">
                                                                <XCircle className="h-3 w-3" /> Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditOption(option)}
                                                                className="rounded-none border border-black px-2 py-0.5 font-medium hover:bg-gray-100"
                                                            >
                                                                แก้ไข
                                                            </button>
                                                            <button
                                                                onClick={() => toggleOption(option)}
                                                                className="rounded-none border border-black px-2 py-0.5 font-medium hover:bg-gray-100"
                                                            >
                                                                {option.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-none border-[3px] border-black bg-white overflow-hidden"
                            style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                            <div className="p-3 border-b-[2px] border-black flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-sm font-semibold text-black flex items-center thai-font">
                                        <span className="w-1.5 h-4 bg-brutal-green mr-2"></span>
                                        <ShieldCheck className="mr-2 h-4 w-4 text-brutal-green" />
                                        Security Monitoring
                                    </h3>
                                    <p className="text-[10px] text-gray-500 mt-1 thai-font ml-3">
                                        ติดตามสถานะและตรวจสอบเหตุการณ์ต้องสงสัยในระบบชำระเงิน
                                    </p>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-black text-xs flex items-center thai-font">
                                            <Activity className="mr-1.5 h-3.5 w-3.5 text-gray-600" />
                                            Payment Audit Logs
                                        </h4>
                                        <div className="max-h-[300px] overflow-auto border-2 border-black">
                                            <table className="w-full min-w-[760px] text-[10px]">
                                                <thead className="bg-gray-50 text-left border-b-2 border-black">
                                                    <tr>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Time</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Severity</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Event</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Order</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Status</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Message</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {auditLogs.map((log) => (
                                                        <tr
                                                            key={log.id}
                                                            className="hover:bg-gray-50 transition-colors align-top"
                                                        >
                                                            <td className="px-2 py-1.5 whitespace-nowrap">
                                                                {new Date(log.createdAt).toLocaleString()}
                                                            </td>
                                                            <td className="px-2 py-1.5 font-semibold">
                                                                {log.severity}
                                                            </td>
                                                            <td className="px-2 py-1.5">{log.eventType}</td>
                                                            <td className="px-2 py-1.5">
                                                                {log.order?.orderNumber || log.orderId || "-"}
                                                            </td>
                                                            <td className="px-2 py-1.5">
                                                                {log.previousStatus || "-"} {"->"}{" "}
                                                                {log.newStatus || "-"}
                                                            </td>
                                                            <td className="px-2 py-1.5">{log.message}</td>
                                                        </tr>
                                                    ))}
                                                    {auditLogs.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={6}
                                                                className="px-2 py-4 text-center text-gray-500"
                                                            >
                                                                No audit logs
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-black text-xs flex items-center thai-font">
                                            <FileCode2 className="mr-1.5 h-3.5 w-3.5 text-gray-600" />
                                            Webhook Nonce Store
                                        </h4>
                                        <div className="max-h-[300px] overflow-auto border-2 border-black">
                                            <table className="w-full min-w-[680px] text-[10px]">
                                                <thead className="bg-gray-50 text-left border-b-2 border-black">
                                                    <tr>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Created</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Provider</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Nonce Hash</th>
                                                        <th className="px-2 py-1.5 thai-font text-gray-600 font-semibold">Expires</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {webhookNonces.map((item) => (
                                                        <tr
                                                            key={item.id}
                                                            className="hover:bg-gray-50 transition-colors align-top"
                                                        >
                                                            <td className="px-2 py-1.5 whitespace-nowrap">
                                                                {new Date(item.createdAt).toLocaleString()}
                                                            </td>
                                                            <td className="px-2 py-1.5">{item.provider}</td>
                                                            <td className="px-2 py-1.5 font-mono text-[9px]">
                                                                {item.nonceHash.slice(0, 18)}...
                                                            </td>
                                                            <td className="px-2 py-1.5 whitespace-nowrap">
                                                                {new Date(item.expiresAt).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {webhookNonces.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="px-2 py-4 text-center text-gray-500"
                                                            >
                                                                No nonce records
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
