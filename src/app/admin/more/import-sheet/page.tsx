// src/app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./_component/DataTable";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { ColumnSheetsImport, useImportSheetsStore } from "@/hooks/use-import-csv";

const columns: ColumnSheetsImport[] = [
    {
        title: "nom",
        require: { req: true, message: "Ce champ est obligatoire" },
        type: { tp: "string", message: "Ce champ doit être une chaîne de caractères" },
        condition: [],
    },
    {
        title: "age",
        require: { req: false },
        type: { tp: "number", message: "Ce champ doit être un entier" },
        condition: [
            { cond: (val: number) => Number(val) > 0, message: "L'âge doit être supérieur à 0" },
        ],
    },
    {
        title: "date",
        require: { req: false },
        type: { tp: "date", message: "Ce champ doit être une date valide" },
        condition: [
            // { cond: (val: string) => moment(val, "YYYY-MM-DD").isAfter(moment()), message: "La date doit être supérieure à aujourd'hui" },
        ],
    },
];


export default function Home() {
    const { data, setColumns } = useImportSheetsStore();
    const s= useTranslations("System")

    useEffect(() => {
        setColumns(columns);
    }, []);

    return (
        <Card className='p-4'>
            <div className="container mx-auto p-6">
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">{s("tabledata")}</h1>
                    <Link href="/admin/more/mysheetimport">
                        <Button>{s('import')}</Button>
                    </Link>
                </div>
                <div className="border rounded-lg p-2">
                    <DataTable data={data} />
                </div>
            </div>
        </Card>
    );
}
