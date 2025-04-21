"use client";
import { ColumnSheetsImport } from "@/hooks/use-import-csv";
import { useTranslations } from "next-intl";

export function getColumns(): ColumnSheetsImport[] {
     const translate = useTranslations("sheet")
    return [
        {
            title: "name",
            require: { req: true, message: translate("required") },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "address",
            require: { req: false, message: ""},
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "description",
            require: { req: false, message: ""},
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
    ];
}

