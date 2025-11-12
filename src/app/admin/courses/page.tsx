"use client"
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    CalendarIcon,
    Search,
    RefreshCw,
    MapPin,
    Bus,
    User,
    Building2,
    TrendingUp,
    CheckCircle2,
    Clock,
    RotateCcw
} from "lucide-react";
import { StatsCard } from "./_components/StatsCard";
import { SearchableSelect } from "./_components/SearchableSelect";
import { useTranslations } from "next-intl";
import { getVehiclesAll } from "@/actions/vehicle/get";
import { getRegionsAdmin } from "@/actions/region/get";
import { getEnteprisesAdmin } from "@/actions/entreprise/get";
import { getConducteursAdmin } from "@/actions/conducteur/get";
import { getCourse } from "@/actions/clocking/get-course";
import ExportButton from "@/components/my/export-button";
import { generateFileClient } from "@/actions/util/export-data/export-client";

// Mock translations - replace with actual translation hook


/*interface Course {
    id: string;
    vehicle_id: string;
    conducteur_id: string;
    conducteur_name: string;
    conducteur_matricule: string;
    start_date: Date;
    end_date?: Date;
    waiting: boolean;
    start_station?: string;
    end_station?: string;
    rotation?: number;
    course_retour?: Course;
}
*/

const selectors = [
    { title: "Vehicle", selector: "vehicle_matricule" },
    { title: "Conductor", selector: "conducteur_name" },
    { title: "Conductor Matricule", selector: "conducteur_matricule" },
    { title: "Start Station", selector: "start_station" },
    { title: "End Station", selector: "end_station" },
    { title: "Start Date", selector: "start_date" },
    { title: "End Date", selector: "end_date" },
    { title: "Status", selector: "status" },
    { title: "Rotation", selector: "rotation" },
];

const Courses = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [totalRotations, setTotalRotations] = useState(0);
    const translations = useTranslations()
    // Filter states
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [selectedDepartureRegion, setSelectedDepartureRegion] = useState("");
    const [selectedArrivalRegion, setSelectedArrivalRegion] = useState("");
    const [selectedEnterprise, setSelectedEnterprise] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedConductor, setSelectedConductor] = useState("");
    const [showCompleted, setShowCompleted] = useState(true);
    const [withRotation, setWithRotation] = useState(false);
    const [enableAll, setEnableAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Data for filters
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [enterprises, setEnterprises] = useState<any[]>([]);
    const [conductors, setConductors] = useState<any[]>([]);

    const t = (key: string) => {
        return translations(key)
    };
    // Fetch filter data
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                // Fetch vehicles, regions, enterprises, conductors
                // Replace with actual API calls
                const vehiclesData = await getVehiclesAll()
                const regionsData = await getRegionsAdmin()
                const enterprisesData = await getEnteprisesAdmin()
                const conductorsData = await getConducteursAdmin()

                setVehicles(vehiclesData.data || []);
                setRegions(regionsData.data || []);
                setEnterprises(enterprisesData.data || []);
                setConductors(conductorsData.data || []);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            }
        };

        fetchFilterData();
    }, []);

    const exportAll = async (type: number = 1) => {
        // Récupérer toutes les données sans pagination
        const res = await getCourse(
            1,
            0, // pageSize = 0 pour récupérer toutes les données
            selectedVehicle,
            selectedEnterprise,
            selectedDate,
            selectedConductor,
            selectedDepartureRegion,
            selectedArrivalRegion,
            enableAll,
            showCompleted,
            withRotation,
        );
        if (res.status === 200 && res.data) {
            // Formater les données pour correspondre aux selectors
            const formattedData = res.data.map((course: any) => {
                const vehicle = vehicles.find(v => v.id === course.vehicle_id);
                return {
                    ...course,
                    vehicle_matricule: vehicle?.matricule || course.vehicle_id,
                    status: course.waiting ? t("courses.status.pending") : t("courses.status.completed"),
                    start_date: course.start_date ? format(new Date(course.start_date), "PPp") : '-',
                    end_date: course.end_date ? format(new Date(course.end_date), "PPp") : '-',
                    rotation: course.rotation || (withRotation ? 0.5 : undefined),
                };
            });
            // Utilisez votre fonction d'exportation existante
            generateFileClient(selectors, formattedData, type);
        }
    };

    // Fetch courses
    const fetchCourses = async () => {
        setLoading(true);
        try {
            // Call your API with filters
            const response = await getCourse(
                page,
                pageSize,
                selectedVehicle,
                selectedEnterprise,
                selectedDate,
                selectedConductor,
                selectedDepartureRegion,
                selectedArrivalRegion,
                enableAll,
                showCompleted,
                withRotation,
            )

            if (response.status === 200)
                setCourses(response.data);
            else
                setCourses([])
            setTotalCount(response.count || 0);
            setTotalRotations(response.totalRotations || 0);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [page, pageSize]);

    // Apply filters
    const applyFilters = () => {
        setPage(1);
        fetchCourses();
    };

    // Reset filters
    const resetFilters = () => {
        setSelectedVehicle("");
        setSelectedDepartureRegion("");
        setSelectedArrivalRegion("");
        setSelectedEnterprise("");
        setSelectedDate(undefined);
        setSelectedConductor("");
        setShowCompleted(true);
        setWithRotation(false);
        setEnableAll(false);
        setSearchQuery("");
        setPage(1);
    };

    // Statistics
    const completedCount = courses.filter(c => !c.waiting).length;
    const pendingCount = courses.filter(c => c.waiting).length;

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">{t("courses.title")}</h1>
                <p className="text-muted-foreground">{t("courses.subtitle")}</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title={t("courses.stats.total")}
                    value={totalCount}
                    icon={<Bus className="h-5 w-5" />}
                    trend=""
                    iconBg="bg-primary/10"
                    iconColor="text-primary"
                />
                <StatsCard
                    title={t("courses.stats.completed")}
                    value={completedCount}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    trend=""
                    iconBg="bg-success/10"
                    iconColor="text-success"
                />
                <StatsCard
                    title={t("courses.stats.pending")}
                    value={pendingCount}
                    icon={<Clock className="h-5 w-5" />}
                    trend=""
                    iconBg="bg-warning/10"
                    iconColor="text-warning"
                />
                <StatsCard
                    title={t("courses.stats.rotations")}
                    value={totalRotations}
                    icon={<RotateCcw className="h-5 w-5" />}
                    trend=""
                    iconBg="bg-info/10"
                    iconColor="text-info"
                />
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="w-full">
                        <Input
                            placeholder={t("courses.filters.search")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Vehicle */}
                        <SearchableSelect
                            placeholder={t("courses.filters.vehicle")}
                            value={selectedVehicle}
                            onValueChange={setSelectedVehicle}
                            options={vehicles.map(v => ({ value: v.id, label: v.matricule }))}
                            searchPlaceholder="Search vehicle..."
                            icon={<Bus className="h-4 w-4" />}
                        />

                        {/* Departure Region */}
                        <SearchableSelect
                            placeholder={t("courses.filters.departureRegion")}
                            value={selectedDepartureRegion}
                            onValueChange={setSelectedDepartureRegion}
                            options={regions.map(r => ({ value: r.name, label: r.name }))}
                            searchPlaceholder="Search region..."
                            icon={<MapPin className="h-4 w-4" />}
                        />

                        {/* Arrival Region */}
                        <SearchableSelect
                            placeholder={t("courses.filters.arrivalRegion")}
                            value={selectedArrivalRegion}
                            onValueChange={setSelectedArrivalRegion}
                            options={regions.map(r => ({ value: r.name, label: r.name }))}
                            searchPlaceholder="Search region..."
                            icon={<MapPin className="h-4 w-4" />}
                        />

                        {/* Enterprise */}
                        <Select value={selectedEnterprise} onValueChange={setSelectedEnterprise}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("courses.filters.enterprise")} />
                            </SelectTrigger>
                            <SelectContent>
                                {enterprises.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Conductor */}
                        <SearchableSelect
                            placeholder={t("courses.filters.conductor")}
                            value={selectedConductor}
                            onValueChange={setSelectedConductor}
                            options={conductors.map(c => ({
                                value: c.id,
                                label: `${c.firstname || ''} ${c.lastname || ''}`.trim()
                            }))}
                            searchPlaceholder="Search conductor..."
                            icon={<User className="h-4 w-4" />}
                        />

                        {/* Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : t("courses.filters.date")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="completed"
                                checked={showCompleted}
                                onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                            />
                            <label
                                htmlFor="completed"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {t("courses.filters.completed")}
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="rotation"
                                checked={withRotation}
                                onCheckedChange={(checked) => setWithRotation(checked as boolean)}
                            />
                            <label
                                htmlFor="rotation"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {t("courses.filters.rotation")}
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="enableAll"
                                checked={enableAll}
                                onCheckedChange={(checked) => setEnableAll(checked as boolean)}
                            />
                            <label
                                htmlFor="enableAll"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {t("courses.filters.enableAll")}
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button onClick={applyFilters} className="flex-1 md:flex-none">
                            <Search className="mr-2 h-4 w-4" />
                            {t("courses.filters.apply")}
                        </Button>
                        <Button onClick={resetFilters} variant="outline" className="flex-1 md:flex-none">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t("courses.filters.reset")}
                        </Button>
                        {/* Boutons Export */}
                        <ExportButton
                            all={true}
                            handleExportCSV={() => exportAll(1)}
                            handleExportXLSX={() => exportAll(2)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("courses.table.vehicle")}</TableHead>
                                            <TableHead>{t("courses.table.conductor")}</TableHead>
                                            <TableHead>{t("courses.table.startStation")}</TableHead>
                                            <TableHead>{t("courses.table.endStation")}</TableHead>
                                            <TableHead>{t("courses.table.startDate")}</TableHead>
                                            <TableHead>{t("courses.table.endDate")}</TableHead>
                                            <TableHead>{t("courses.table.status")}</TableHead>
                                            {withRotation && <TableHead>{t("courses.table.rotation")}</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {courses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={withRotation ? 8 : 7} className="text-center text-muted-foreground py-12">
                                                    No courses found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            courses.map((course) => (
                                                <TableRow key={course.id}>
                                                    <TableCell className="font-medium">
                                                        {vehicles.find(v => v.id === course.vehicle_id)?.matricule || course.vehicle_id}
                                                    </TableCell>
                                                    <TableCell>{course.conducteur_name}</TableCell>
                                                    <TableCell>{course.start_station || '-'}</TableCell>
                                                    <TableCell>{course.end_station || '-'}</TableCell>
                                                    <TableCell>{format(new Date(course.start_date), "PPp")}</TableCell>
                                                    <TableCell>{course.end_date ? format(new Date(course.end_date), "PPp") : '-'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={course.waiting ? "secondary" : "default"}>
                                                            {course.waiting ? t("courses.status.pending") : t("courses.status.completed")}
                                                        </Badge>
                                                    </TableCell>
                                                    {withRotation && (
                                                        <TableCell>
                                                            <Badge variant="outline">{course.rotation || 0}</Badge>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t("courses.pagination.rowsPerPage")}:
                                    </span>
                                    <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t("courses.pagination.page")} {page} {t("courses.pagination.of")} {Math.ceil(totalCount / pageSize)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= Math.ceil(totalCount / pageSize)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Courses;
