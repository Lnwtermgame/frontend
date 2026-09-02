"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/framer-exports";
import {
    Activity,
    CheckCircle2,
    CreditCard,
    FileCode2,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Settings,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    AdminLayout,
    AdminPageHeader,
    PageContainer,
} from "@/components/admin";
import { useAuth } from "@/lib/hooks/use-auth";
import {
    AdminPaymentGateway,
    AdminPaymentOption,
    PaymentAuditLogItem,
    PaymentMethodCode,
    WebhookNonceItem,
    paymentApi,
} from "@/lib/services/payment-api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/Badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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

/** Card chrome shared by every section on this page. */
function SectionCard({
    icon: Icon,
    title,
    iconClassName,
    children,
    description,
}: {
    icon: typeof CreditCard;
    title: string;
    iconClassName?: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-site-surface border border-site-border-soft rounded-12 overflow-hidden"
        >
            <div className="px-4 py-3 border-b border-site-border-soft flex items-center gap-3">
                <div className="p-2 bg-site-raised rounded-lg border border-site-border">
                    <Icon className={`h-4 w-4 ${iconClassName ?? "text-site-accent"}`} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-site-text thai-font">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-xs text-site-muted thai-font">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children}
        </motion.div>
    );
}

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
        <AdminLayout>
            <PageContainer>
                <AdminPageHeader
                    title="จัดการช่องทางชำระเงิน"
                    description="จัดการผู้ให้บริการชำระเงินและช่องทางรับเงินทั้งหมด"
                    actions={
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fetchAll(false)}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3 w-3" />
                            )}
                            รีเฟรช
                        </Button>
                    }
                />

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-site-accent" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <SectionCard icon={CreditCard} title="Payment Gateways">
                            <div className="p-3 space-y-3">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-5">
                                    <Input
                                        size="sm"
                                        placeholder="ชื่อ Gateway"
                                        value={gatewayForm.name}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        placeholder="Provider (e.g. feelfreepay)"
                                        value={gatewayForm.provider}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                provider: e.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        type="number"
                                        step="0.01"
                                        placeholder="Gateway Fee %"
                                        value={gatewayForm.feePercent}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                feePercent: e.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        type="number"
                                        step="0.01"
                                        placeholder="Flat Fee"
                                        value={gatewayForm.flatFee}
                                        onChange={(e) =>
                                            setGatewayForm((prev) => ({
                                                ...prev,
                                                flatFee: e.target.value,
                                            }))
                                        }
                                    />
                                    <label className="flex items-center justify-between gap-2 rounded-6 border border-site-border bg-site-raised px-3 py-1.5 text-sm font-medium text-site-text">
                                        Active
                                        <Switch
                                            checked={gatewayForm.isActive}
                                            onCheckedChange={(checked) =>
                                                setGatewayForm((prev) => ({
                                                    ...prev,
                                                    isActive: checked,
                                                }))
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveGateway}
                                        disabled={savingGateway}
                                    >
                                        {savingGateway ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Save className="h-3 w-3" />
                                        )}
                                        {editingGatewayId ? "บันทึกการแก้ไข" : "สร้าง Gateway"}
                                    </Button>
                                    {editingGatewayId && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={resetGatewayForm}
                                        >
                                            <XCircle className="h-3 w-3" />
                                            ยกเลิก
                                        </Button>
                                    )}
                                </div>

                                <div className="border border-site-border-soft rounded-lg overflow-hidden">
                                    <Table className="min-w-[720px] text-xs">
                                        <TableHeader>
                                            <TableRow className="border-site-border-soft hover:bg-transparent">
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Gateway</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Provider</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Fee %</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Flat Fee</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Options</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Status</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {gateways.map((gateway) => (
                                                <TableRow key={gateway.id} className="border-site-border-soft hover:bg-site-raised/50">
                                                    <TableCell className="px-3 py-2 font-bold text-white text-xs">
                                                        {gateway.name}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-mono text-[11px] font-medium text-site-muted">
                                                        {gateway.provider}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium">
                                                        {gateway.feePercent}%
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium">
                                                        ฿{gateway.flatFee}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium">
                                                        {gateway.optionCount}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2">
                                                        {gateway.isActive ? (
                                                            <Badge variant="success">
                                                                <CheckCircle2 /> Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="neutral">
                                                                <XCircle /> Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2.5 text-xs"
                                                                onClick={() => handleEditGateway(gateway)}
                                                            >
                                                                แก้ไข
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2.5 text-xs"
                                                                onClick={() => toggleGateway(gateway)}
                                                            >
                                                                {gateway.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={Settings} title="Payment Options">
                            <div className="p-3 space-y-3">
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                    <Select
                                        value={optionForm.gatewayId}
                                        onValueChange={(value) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                gatewayId: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="h-9 rounded-6 border-site-border bg-site-raised text-sm">
                                            <SelectValue placeholder="เลือก Gateway" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gateways.map((gateway) => (
                                                <SelectItem key={gateway.id} value={gateway.id}>
                                                    {gateway.name} ({gateway.provider})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        size="sm"
                                        placeholder="Option Code (e.g. PROMPTPAY_DEFAULT)"
                                        value={optionForm.code}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({ ...prev, code: e.target.value }))
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        placeholder="Label"
                                        value={optionForm.label}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                label: e.target.value,
                                            }))
                                        }
                                    />
                                    <Select
                                        value={optionForm.method}
                                        onValueChange={(value) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                method: value as PaymentMethodCode,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="h-9 rounded-6 border-site-border bg-site-raised text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((method) => (
                                                <SelectItem key={method} value={method}>
                                                    {method}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        size="sm"
                                        type="number"
                                        step="0.01"
                                        placeholder="Surcharge %"
                                        value={optionForm.surchargePercent}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                surchargePercent: e.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        type="number"
                                        step="0.01"
                                        placeholder="Flat Fee"
                                        value={optionForm.flatFee}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                flatFee: e.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        type="number"
                                        step="0.01"
                                        placeholder="Min Amount (optional)"
                                        value={optionForm.minAmount}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                minAmount: e.target.value,
                                            }))
                                        }
                                    />
                                    <Input
                                        size="sm"
                                        type="number"
                                        step="0.01"
                                        placeholder="Max Amount (optional)"
                                        value={optionForm.maxAmount}
                                        onChange={(e) =>
                                            setOptionForm((prev) => ({
                                                ...prev,
                                                maxAmount: e.target.value,
                                            }))
                                        }
                                    />
                                    <label className="flex items-center justify-between gap-2 rounded-6 border border-site-border bg-site-raised px-3 py-1.5 text-sm font-medium text-site-text">
                                        Active
                                        <Switch
                                            checked={optionForm.isActive}
                                            onCheckedChange={(checked) =>
                                                setOptionForm((prev) => ({
                                                    ...prev,
                                                    isActive: checked,
                                                }))
                                            }
                                        />
                                    </label>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveOption}
                                        disabled={savingOption}
                                    >
                                        {savingOption ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : editingOptionId ? (
                                            <Save className="h-3 w-3" />
                                        ) : (
                                            <Plus className="h-3 w-3" />
                                        )}
                                        {editingOptionId ? "บันทึกการแก้ไข" : "สร้าง Option"}
                                    </Button>
                                    {editingOptionId && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={resetOptionForm}
                                        >
                                            <XCircle className="h-3 w-3" />
                                            ยกเลิก
                                        </Button>
                                    )}
                                </div>

                                <div className="border border-site-border-soft rounded-lg overflow-hidden">
                                    <Table className="min-w-[900px] text-xs">
                                        <TableHeader>
                                            <TableRow className="border-site-border-soft hover:bg-transparent">
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Code</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Label</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Gateway</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Method</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Surcharge %</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Flat Fee</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Range</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Status</TableHead>
                                                <TableHead className="h-auto px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-site-dim">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {options.map((option) => (
                                                <TableRow key={option.id} className="border-site-border-soft hover:bg-site-raised/50">
                                                    <TableCell className="px-3 py-2 font-mono text-[11px] font-bold text-white">
                                                        {option.code}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium">
                                                        {option.label}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium">
                                                        {gatewayNameMap[option.gatewayId] ||
                                                            option.gateway.name}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-mono text-[11px] font-medium text-site-muted">
                                                        {option.method}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium">
                                                        {option.surchargePercent}%
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium">
                                                        ฿{option.flatFee}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 font-medium text-site-muted text-[11px]">
                                                        {option.minAmount ?? "-"} - {option.maxAmount ?? "-"}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2">
                                                        {option.isActive ? (
                                                            <Badge variant="success">
                                                                <CheckCircle2 /> Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="neutral">
                                                                <XCircle /> Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2.5 text-xs"
                                                                onClick={() => handleEditOption(option)}
                                                            >
                                                                แก้ไข
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2.5 text-xs"
                                                                onClick={() => toggleOption(option)}
                                                            >
                                                                {option.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            icon={ShieldCheck}
                            title="Security Monitoring"
                            iconClassName="text-semantic-green"
                            description="ติดตามสถานะและตรวจสอบเหตุการณ์ต้องสงสัยในระบบชำระเงิน"
                        >
                            <div className="p-3">
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-white text-xs flex items-center thai-font">
                                            <Activity className="mr-1.5 h-3.5 w-3.5 text-site-muted" />
                                            Payment Audit Logs
                                        </h4>
                                        <div className="max-h-[300px] overflow-auto border border-site-border-soft rounded-lg">
                                            <Table className="min-w-[760px] text-[10px]">
                                                <TableHeader>
                                                    <TableRow className="border-site-border-soft hover:bg-transparent">
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Time</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Severity</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Event</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Order</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Status</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Message</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {auditLogs.map((log) => (
                                                        <TableRow key={log.id} className="border-site-border-soft hover:bg-site-raised/50 align-top">
                                                            <TableCell className="px-2 py-1.5 whitespace-nowrap">
                                                                {new Date(log.createdAt).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5 font-semibold">
                                                                {log.severity}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5">{log.eventType}</TableCell>
                                                            <TableCell className="px-2 py-1.5">
                                                                {log.order?.orderNumber || log.orderId || "-"}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5">
                                                                {log.previousStatus || "-"} {"->"}{" "}
                                                                {log.newStatus || "-"}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5">{log.message}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {auditLogs.length === 0 && (
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableCell
                                                                colSpan={6}
                                                                className="px-2 py-4 text-center text-site-muted"
                                                            >
                                                                No audit logs
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-white text-xs flex items-center thai-font">
                                            <FileCode2 className="mr-1.5 h-3.5 w-3.5 text-site-muted" />
                                            Webhook Nonce Store
                                        </h4>
                                        <div className="max-h-[300px] overflow-auto border border-site-border-soft rounded-lg">
                                            <Table className="min-w-[680px] text-[10px]">
                                                <TableHeader>
                                                    <TableRow className="border-site-border-soft hover:bg-transparent">
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Created</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Provider</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Nonce Hash</TableHead>
                                                        <TableHead className="h-auto px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">Expires</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {webhookNonces.map((item) => (
                                                        <TableRow key={item.id} className="border-site-border-soft hover:bg-site-raised/50 align-top">
                                                            <TableCell className="px-2 py-1.5 whitespace-nowrap">
                                                                {new Date(item.createdAt).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5">{item.provider}</TableCell>
                                                            <TableCell className="px-2 py-1.5 font-mono text-[9px]">
                                                                {item.nonceHash.slice(0, 18)}...
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1.5 whitespace-nowrap">
                                                                {new Date(item.expiresAt).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {webhookNonces.length === 0 && (
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableCell
                                                                colSpan={4}
                                                                className="px-2 py-4 text-center text-site-muted"
                                                            >
                                                                No nonce records
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                )}
            </PageContainer>
        </AdminLayout>
    );
}
