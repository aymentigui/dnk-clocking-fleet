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
import { columns } from "./columns-table-clocking"; // Importez les colonnes
import { Columns } from "./columns-table-clocking";
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useTranslations } from "next-intl";
import { useOrigin } from "@/hooks/use-origin";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/myui/loading";
import TablePagination from "@/components/myui/table/table-pagination";
import { getClockingsVehicle } from "@/actions/clocking/get";
import { DatePicker } from "@/components/ui/date-picker";

interface DataTableProps {
    id: string;
}

export function DataTable({
    id,
}: DataTableProps) {

    const origin = useOrigin()
    const searchParams = useSearchParams();

    const [data, setData] = useState<Columns[]>([]);

    const [page, setPage] = useState(searchParams.get("page") ? Number(searchParams.get("page")) : 1);
    const pageSize = 8
    const [count, setCount] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [searchDate, setSearchDate] = useState<Date | null>(null);

    const s = useTranslations('System')
    useEffect(() => {
        setSelectedLanguage(Cookies.get('lang') || 'en')
        setMounted(true);
    }, [])



    useEffect(() => {
        fetch();
    }, [page, mounted,searchDate]); // Ajouter debouncedSearchQuery comme dépendance


    const fetch = async () => {
        setIsLoading(true);
        setData([]);
        try {
            if (!origin) return

            const response = await getClockingsVehicle(id, page, pageSize,searchDate ? new Date(searchDate).toISOString() : undefined);

            if (response.status === 200) {
                setData(response.data);
                setCount(response.count);
            }

        } catch (error) {
            console.error("Error fetching vehcile clocking:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (date: Date | null) => {
        setSearchDate(date);
        setPage(1); // Réinitialiser à la première page lors du changement de filtre
    };

    const table = useReactTable({
        data: data,
        columns, // Utilisez les colonnes importées
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
            {
                isLoading
                    ?
                    (<div className="h-[300px] flex items-center justify-center">
                        <Loading />
                    </div>)
                    :
                    <div className="rounded-md border p-2">
                        <div className="mb-4">
                            <DatePicker
                                selected={searchDate}
                                onChange={handleDateChange}
                                placeholderText={s("date")}
                                isClearable={true}
                                className="border p-2 rounded"
                            />
                        </div>
                        <Table className="border">
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header, index) => (
                                            <TableHead key={index}
                                                className={`
                                                            ${selectedLanguage == "ar" ? "text-right " : ""} 
                                                            `}>
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
            }
            {/* Pagination */}
            {!isLoading &&
                <TablePagination page={page} setPage={setPage} count={count} pageSize={pageSize} isLoading={isLoading} debouncedSearchQuery={""} />
            }
        </div>
    );
}