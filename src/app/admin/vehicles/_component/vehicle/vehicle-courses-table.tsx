'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Calendar, Navigation } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getVehicleCourses, VehicleCourse } from '@/actions/vehicle/get-vehicle';

interface VehicleCoursesTableProps {
    vehicleId: string;
    selectedDate: string;
    initialCourses: VehicleCourse[];
    onDateChange: (date: string) => void;
}

export default function VehicleCoursesTable({
    vehicleId,
    selectedDate,
    initialCourses,
    onDateChange,
}: VehicleCoursesTableProps) {
    const t = useTranslations('Vehicle');
    const [courses, setCourses] = useState<VehicleCourse[]>(initialCourses);
    const [isLoading, setIsLoading] = useState(false);

    const handleDateChange = useCallback(
        async (newDate: string) => {
            onDateChange(newDate);
            setIsLoading(true);

            try {
                const date = new Date(newDate);
                const newCourses = await getVehicleCourses(vehicleId, date);
                setCourses(newCourses);
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [vehicleId, onDateChange]
    );

    const getStatusBadge = (course: VehicleCourse) => {
        if (course.waiting) {
            return <Badge className="bg-yellow-100 text-yellow-800">{t('waiting')}</Badge>;
        }
        if (course.end_station !== null) {
            return <Badge className="bg-green-100 text-green-800">{t('completed')}</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-800">{t('in_progress')}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        {t('courses')}
                    </CardTitle>
                    <div className="flex gap-2 items-center">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="px-2 py-1 border rounded-md text-sm"
                            disabled={isLoading}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDateChange(format(new Date(), 'yyyy-MM-dd'))}
                            disabled={isLoading}
                        >
                            {t('today')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {courses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">{t('no_courses')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('start_time')}</TableHead>
                                    <TableHead>{t('end_time')}</TableHead>
                                    <TableHead>{t('driver')}</TableHead>
                                    <TableHead>{t('from')}</TableHead>
                                    <TableHead>{t('to')}</TableHead>
                                    <TableHead className="text-right">{t('status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((course) => (
                                    <TableRow key={course.id} className="hover:bg-muted/50">
                                        <TableCell className="font-mono text-sm">
                                            {format(course.start_date, 'HH:mm')}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {course.end_date ? format(course.end_date, 'HH:mm') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold text-sm">{course.conducteur_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {course.conducteur_matricule}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{course.start_station || 'N/A'}</TableCell>
                                        <TableCell className="text-sm">{course.end_station || '—'}</TableCell>
                                        <TableCell className="text-right">{getStatusBadge(course)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}