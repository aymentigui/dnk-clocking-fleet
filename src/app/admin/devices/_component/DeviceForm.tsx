"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Device } from "@/types/device";

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
    const e = useTranslations("Error");

    const [formData, setFormData] = useState({
        code: device?.code || "",
        username: device?.username || "",
        password: device?.password || "",
        type: device?.type?.toString() || "0",
        park: device?.parkId || "",
        region: device?.regionId || ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Effet pour réinitialiser les sélections quand le type change
    useEffect(() => {
        const type = parseInt(formData.type);

        // Si le type est 0, 1 ou 2 (device entrée/sortie), on désactive la région
        if (type === 0 || type === 1 || type === 2) {
            setFormData(prev => ({
                ...prev,
                region: ""
            }));
        }

        // Si le type est 3 (device controller), on désactive le parc
        if (type === 3) {
            setFormData(prev => ({
                ...prev,
                park: ""
            }));
        }
    }, [formData.type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.code.trim()) {
            newErrors.code = t("coderequired");
        }

        if (!formData.username.trim()) {
            newErrors.username = t("usernamerequired");
        } else if (formData.username.includes(' ')) {
            newErrors.username = t("usernamecontainspace");
        }

        if (!formData.password) {
            newErrors.password = t("passwordrequired");
        } else if (formData.password.length < 6) {
            newErrors.password = t("password6");
        }

        // Validation conditionnelle selon le type
        const type = parseInt(formData.type);

        // Pour les types 0, 1, 2 (device entrée/sortie), le parc est requis
        if ((type === 0 || type === 1 || type === 2) && !formData.park) {
            newErrors.park = t("required");
        }

        // Pour le type 3 (device controller), la région est requise
        if (type === 3 && !formData.region) {
            newErrors.region = t("required");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit({
                ...formData,
                type: parseInt(formData.type)
            });
        }
    };

    const deviceTypes = [
        { value: 0, label: t("deviceentree") },
        { value: 1, label: t("devicesortie") },
        { value: 2, label: t("devicesortieentree") },
        { value: 3, label: t("devicecontroller") }
    ];

    const currentType = parseInt(formData.type);
    const showParkSelect = currentType !== 3; // Cache le parc pour le type 3
    const showRegionSelect = currentType === 3; // Montre la région seulement pour le type 3

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
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("code")} *
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("username")} *
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("password")} *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                            )}
                        </div>

                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("type")} *
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                {deviceTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Park - Conditionnel */}
                        {showParkSelect && (
                            <div>
                                <label htmlFor="park" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("park")} {currentType !== 3 && "*"}
                                </label>
                                <select
                                    id="park"
                                    name="park"
                                    value={formData.park}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.park ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    <option value="">{t("selectpark")}</option>
                                    {parks.map((park) => (
                                        <option key={park.id} value={park.id}>
                                            {park.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.park && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.park}</p>
                                )}
                            </div>
                        )}

                        {/* Region - Conditionnel */}
                        {showRegionSelect && (
                            <div>
                                <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("region")} {currentType === 3 && "*"}
                                </label>
                                <select
                                    id="region"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors.region ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    <option value="">{t("selectregion")}</option>
                                    {regions.map((region) => (
                                        <option key={region.id} value={region.id}>
                                            {region.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.region && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.region}</p>
                                )}
                            </div>
                        )}

                        {/* Espace vide pour maintenir l'alignement */}
                        {!showParkSelect && !showRegionSelect && (
                            <div className="hidden md:block"></div>
                        )}
                    </div>

                    {/* Information sur les types */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Information sur les types de devices:
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                            <li>• <strong>{t("deviceentree")}</strong> : Requiert une station (parc)</li>
                            <li>• <strong>{t("devicesortie")}</strong> : Requiert une station (parc)</li>
                            <li>• <strong>{t("devicesortieentree")}</strong> : Requiert une station (parc)</li>
                            <li>• <strong>{t("devicecontroller")}</strong> : Requiert une région</li>
                        </ul>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            {s("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? s("loading") : (device ? s("update") : s("create"))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}