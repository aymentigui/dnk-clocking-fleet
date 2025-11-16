"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { BarChart3, Clock, Route } from "lucide-react";
import GlobalStatisticsTab from "../_component/GlobalStatisticsTab";
import ClockingStatisticsTab from "../_component/ClockingStatisticsTab";
import CourseStatisticsTab from "../_component/CourseStatisticsTab";

export default function VehicleStatisticsPage() {
    const t = useTranslations("vehicleStatistics");
    const [activeTab, setActiveTab] = useState("global");

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground mt-1">{t("description")}</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                    <TabsTrigger value="global" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("tabs.global")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="clocking" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("tabs.clocking")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="course" className="flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("tabs.course")}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="global" className="space-y-6">
                    <GlobalStatisticsTab />
                </TabsContent>

                <TabsContent value="clocking" className="space-y-6">
                    <ClockingStatisticsTab />
                </TabsContent>

                <TabsContent value="course" className="space-y-6">
                    <CourseStatisticsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}