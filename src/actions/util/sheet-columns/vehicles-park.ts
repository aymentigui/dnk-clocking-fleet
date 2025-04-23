"use client";
import { ColumnSheetsImport } from "@/hooks/use-import-csv";
import { useTranslations } from "next-intl";

export function getColumns(): ColumnSheetsImport[] {
     const translate = useTranslations("sheet")
     
    return [
        {
            title: "matricule",
            require: { req: true, message: translate("required") },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "park",
            require: { req: false },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
    ];
}

