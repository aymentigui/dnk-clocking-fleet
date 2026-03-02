"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw, Clock, AlertTriangle, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getVehiclesExceedingThreshold } from "@/actions/clocking/get";
import { useTranslations } from "next-intl";

const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
};

export default function VehicleThresholdPage() {
    const t = useTranslations();
    const [date, setDate] = useState<Date>(new Date());
    const [thresholdHours, setThresholdHours] = useState<number>(1);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>("all");

    useEffect(() => {
        loadVehicles();
    }, [date, thresholdHours]);

    useEffect(() => {
        filterVehicles();
    }, [vehicles, typeFilter]);

    const loadVehicles = async () => {
        setLoading(true);
        try {
            const result = await getVehiclesExceedingThreshold(date, thresholdHours);
            if (result.success && result.data) {
                setVehicles(result.data);
            }
        } catch (error) {
            console.error("Error loading vehicles:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterVehicles = () => {
        if (typeFilter === "all") {
            setFilteredVehicles(vehicles);
        } else {
            setFilteredVehicles(vehicles.filter(vehicle => 
                vehicle.type.toString() === typeFilter
            ));
        }
    };

    const getSeverityColor = (hours: number) => {
        if (hours >= 6) return "destructive";
        if (hours >= 3) return "default";
        return "secondary";
    };

    const getTypeOptions = () => {
        const types = Array.from(new Set(vehicles.map(item => item.type)));
        return types.map(type => {
            const vehicle = vehicles.find(item => item.type === type);
            return {
                value: type.toString(),
                label: vehicle?.typeName || `Type ${type}`
            };
        });
    };

    return (
        <Card className='p-4 w-full'>
            <div className="container mx-auto py-8 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t("Clocking.vehicleThresholdStatistics")}</h1>
                        <p className="text-muted-foreground">{t("Clocking.vehicleThresholdDescription")}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="threshold" className="whitespace-nowrap">{t("Clocking.threshold")}:</Label>
                            <Input
                                id="threshold"
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={thresholdHours}
                                onChange={(e) => setThresholdHours(parseFloat(e.target.value) || 1)}
                                className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">{t("Clocking.hours")}</span>
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {formatDate(date)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => newDate && setDate(newDate)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button onClick={loadVehicles} disabled={loading} size="icon" variant="outline">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* Filtres */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="type-filter">{t("Clocking.filterByType")}:</Label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t("Clocking.selectType")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("Clocking.allTypes")}</SelectItem>
                                {getTypeOptions().map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <Badge variant="outline" className="ml-auto">
                        {t("Clocking.resultsCount", { count: filteredVehicles.length })}
                    </Badge>
                </div>

                {filteredVehicles.length > 0 && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t("Clocking.alertTitle")}</AlertTitle>
                        <AlertDescription>
                            {t("Clocking.alertDescription", { 
                                count: filteredVehicles.length, 
                                threshold: thresholdHours 
                            })}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("Clocking.vehicle")}</TableHead>
                                    <TableHead>{t("Clocking.type")}</TableHead>
                                    <TableHead>{t("Clocking.hoursExceeded")}</TableHead>
                                    <TableHead>{t("Clocking.lastClocking")}</TableHead>
                                    <TableHead>{t("Clocking.conducteur")}</TableHead>
                                    <TableHead>{t("Clocking.region")}</TableHead>
                                    <TableHead>{t("Clocking.park")}</TableHead>
                                    <TableHead>{t("Clocking.status")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVehicles.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {item.vehicle?.matricule || t("Clocking.unknown")}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {item.vehicle?.brand} {item.vehicle?.model} 
                                                    {item.vehicle?.year ? ` (${item.vehicle.year})` : ""}
                                                </div>
                                                {item.vehicle?.vin && (
                                                    <div className="text-xs font-mono text-muted-foreground">
                                                        {t("Clocking.vin")}: {item.vehicle.vin}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.type === 3 ? "destructive" : "default"}>
                                                {item.typeName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getSeverityColor(item.hoursSince)}>
                                                {item.hoursSince}h
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {formatDateTime(new Date(item.created_at))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.conducteur_name ? (
                                                <div className="space-y-1">
                                                    <div className="font-medium">{item.conducteur_name}</div>
                                                    {item.conducteur_matricule && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {item.conducteur_matricule}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.region ? (
                                                <div className="font-medium">{item.region.name}</div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.park ? (
                                                <div className="font-medium">{item.park.name}</div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.vehicle ? (
                                                item.vehicle.in_park ? (
                                                    <Badge variant="outline">{t("Clocking.inPark")}</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{t("Clocking.outOfPark")}</Badge>
                                                )
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {filteredVehicles.length === 0 && !loading && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">
                                {typeFilter === "all" 
                                    ? t("Clocking.noVehiclesExceeding")
                                    : t("Clocking.noVehiclesForType")
                                }
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {typeFilter === "all" 
                                    ? t("Clocking.allVehiclesWithinThreshold", { threshold: thresholdHours })
                                    : t("Clocking.tryDifferentFilter")
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}

                {loading && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                            <p className="text-muted-foreground">{t("System.loading")}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Card>
    );
}