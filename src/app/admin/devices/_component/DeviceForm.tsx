"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Device } from "@/types/device";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DeviceFormProps {
    device?: Device;
    parks: any[];
    regions: any[];
    onSubmit: (data: any) => void;
    onCancel: () => void;
    loading: boolean;
}

export function DeviceForm({ device, parks, regions, onSubmit, onCancel, loading }: DeviceFormProps) {
    const t = useTranslations("Device");
    const s = useTranslations("System");

    const [formData, setFormData] = useState({
        code: device?.code || "",
        username: device?.username || "",
        password: device?.password || "",
        type: device?.type?.toString() || "0",
        park: device?.parkId || "",
        region: device?.regionId || "",
        regionsSupervisor: device?.regionsSupervisor || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedRegion, setSelectedRegion] = useState("");

    // Effect reset fields when type changes
    useEffect(() => {
        const type = parseInt(formData.type);

        if (type === 0 || type === 1 || type === 2) {
            setFormData(prev => ({
                ...prev,
                region: "",
                regionsSupervisor: []
            }));
        }

        if (type === 3) {
            setFormData(prev => ({
                ...prev,
                park: "",
                regionsSupervisor: []
            }));
        }

        if (type === 5) {
            setFormData(prev => ({
                ...prev,
                park: "",
                region: ""
            }));
        }

    }, [formData.type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const addSupervisorRegion = () => {
        if (selectedRegion && !formData.regionsSupervisor.includes(selectedRegion)) {
            setFormData(prev => ({
                ...prev,
                regionsSupervisor: [...prev.regionsSupervisor, selectedRegion]
            }));
            setSelectedRegion("");

            if (errors.regionsSupervisor) {
                setErrors(prev => ({
                    ...prev,
                    regionsSupervisor: ""
                }));
            }
        }
    };

    const removeSupervisorRegion = (regionId: string) => {
        setFormData(prev => ({
            ...prev,
            regionsSupervisor: prev.regionsSupervisor.filter(id => id !== regionId)
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.code.trim()) newErrors.code = t("coderequired");

        if (!formData.username.trim()) newErrors.username = t("usernamerequired");
        else if (formData.username.includes(" "))
            newErrors.username = t("usernamecontainspace");

        if (!formData.password) newErrors.password = t("passwordrequired");
        else if (formData.password.length < 6)
            newErrors.password = t("password6");

        const type = parseInt(formData.type);

        if ([0, 1, 2].includes(type) && !formData.park)
            newErrors.park = t("required");

        if (type === 3 && !formData.region)
            newErrors.region = t("required");

        if (type === 5 && formData.regionsSupervisor.length === 0)
            newErrors.regionsSupervisor = t("required");

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit({
                ...formData,
                type: parseInt(formData.type),
                allregion: formData.regionsSupervisor
            });
        }
    };

    const deviceTypes = [
        { value: 0, label: t("deviceentree") },
        { value: 1, label: t("devicesortie") },
        { value: 2, label: t("devicesortieentree") },
        { value: 3, label: t("devicecontroller") },
        { value: 5, label: "Supervisor" },
    ];

    const currentType = parseInt(formData.type);

    const showParkSelect = currentType !== 3 && currentType !== 5;
    const showRegionSelect = currentType === 3;
    const showSupervisorRegions = currentType === 5;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {device ? t("updatedevice") : t("adddevice")}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Code */}
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">{t("code")} *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${errors.code ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                            />
                            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">{t("username")} *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${errors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                            />
                            {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">{t("password")} *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                            />
                            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">{t("type")} *</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            >
                                {deviceTypes.map(t => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Park */}
                        {showParkSelect && (
                            <div>
                                <label className="block text-sm mb-1 dark:text-gray-300">{t("park")} *</label>
                                <select
                                    name="park"
                                    value={formData.park}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${errors.park ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                                >
                                    <option value="">{t("selectpark")}</option>
                                    {parks.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {errors.park && <p className="text-red-500 text-sm">{errors.park}</p>}
                            </div>
                        )}

                        {/* Region */}
                        {showRegionSelect && (
                            <div>
                                <label className="block text-sm mb-1 dark:text-gray-300">{t("region")} *</label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${errors.region ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                                >
                                    <option value="">{t("selectregion")}</option>
                                    {regions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                {errors.region && <p className="text-red-500 text-sm">{errors.region}</p>}
                            </div>
                        )}

                        {/* Supervisor Regions */}
                        {showSupervisorRegions && (
                            <div className="md:col-span-2">
                                <label className="block text-sm mb-2 dark:text-gray-300">Supervisor regions *</label>

                                <div className="space-y-3">
                                    {/* Sélection de région */}
                                    <div className="flex gap-2">
                                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select a region" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {regions
                                                    .filter(region => !formData.regionsSupervisor.includes(region.id))
                                                    .map(region => (
                                                        <SelectItem key={region.id} value={region.id}>
                                                            {region.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            type="button"
                                            onClick={addSupervisorRegion}
                                            disabled={!selectedRegion}
                                            variant="outline"
                                        >
                                            Add
                                        </Button>
                                    </div>

                                    {/* Liste des régions sélectionnées */}
                                    <div className="flex flex-wrap gap-2">
                                        {formData.regionsSupervisor.map(regionId => {
                                            const region = regions.find(r => r.id === regionId);
                                            return (
                                                <Badge key={regionId} variant="secondary" className="px-3 py-1 text-sm">
                                                    {region?.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSupervisorRegion(regionId)}
                                                        className="ml-2 hover:text-red-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>

                                {errors.regionsSupervisor && (
                                    <p className="text-red-500 text-sm mt-1">{errors.regionsSupervisor}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
                        >
                            {s("cancel")}
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                            {loading ? s("loading") : (device ? s("update") : s("create"))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}