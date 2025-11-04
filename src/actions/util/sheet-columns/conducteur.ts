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
            title: "firstname",
            require: { req: false, message: ""},
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "lastname",
            require: { req: false, message: ""},
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "phone",
            require: { req: false, message: ""},
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
    ];
}

