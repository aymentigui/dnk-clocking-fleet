"use client";

import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { columns } from "./columns-table-clocking";
import { Columns } from "./columns-table-clocking";
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useTranslations } from "next-intl";
import { useOrigin } from "@/hooks/use-origin";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/myui/loading";
import TablePagination from "@/components/myui/table/table-pagination";
import { getClockings } from "@/actions/clocking/get";
import { DatePicker } from "@/components/ui/date-picker"; // Assurez-vous d'avoir ce composant

export function DataTable() {
    const origin = useOrigin()
    const searchParams = useSearchParams();
    const s = useTranslations('System')

    const [data, setData] = useState<Columns[]>([]);
    const [page, setPage] = useState(searchParams.get("page") ? Number(searchParams.get("page")) : 1);
    const pageSize = 20
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [searchDate, setSearchDate] = useState<Date | null>(null);

    useEffect(() => {
        setSelectedLanguage(Cookies.get('lang') || 'en')
        setMounted(true);
    }, [])

    useEffect(() => {
        fetch();
    }, [page, mounted, searchDate]); // Ajout de searchDate pour actualiser lorsque la date change

    const handleDateChange = (date: Date | null) => {
        setSearchDate(date);
        setPage(1); // Réinitialiser à la première page lors du changement de filtre
    };

    const fetch = async () => {
        setIsLoading(true);
        setData([]);
        try {
            if (!origin) return

            // Modifier l'appel API pour inclure la date si elle est sélectionnée
            const response = await getClockings(
                page, 
                pageSize, 
                searchDate ? new Date(searchDate).toISOString() : undefined
            );

            if (response.status === 200) {
                setData(response.data);
                setCount(response.count);
            }
        } catch (error) {
            console.error("Error fetching vehicle clocking:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const table = useReactTable({
        data: data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (!mounted) {
        return (
            <div className="h-[300px] flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <div>
            {/* Ajout du sélecteur de date */}
            <div className="mb-4">
                <DatePicker
                    selected={searchDate}
                    onChange={handleDateChange}
                    placeholderText={s("date")}
                    isClearable={true}
                    className="border p-2 rounded"
                />
            </div>

            {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                    <Loading />
                </div>
            ) : (
                <div className="rounded-md border p-2">
                    <Table className="border">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header, index) => (
                                        <TableHead 
                                            key={index}
                                            className={`${selectedLanguage == "ar" ? "text-right " : ""}`}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row, index) => (
                                    <TableRow key={index}>
                                        {row.getVisibleCells().map((cell, index) => (
                                            <TableCell key={index}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        {s("noresults")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
            
            {/* Pagination */}
            {!isLoading && (
                <TablePagination 
                    page={page} 
                    setPage={setPage} 
                    count={count} 
                    pageSize={pageSize} 
                    isLoading={isLoading} 
                    debouncedSearchQuery={""} 
                />
            )}
        </div>
    );
}