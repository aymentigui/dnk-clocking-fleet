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
            title: "model",
            require: { req: false },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "year",
            require: { req: false },
            type: { tp: "string", message: translate("invalidyear") },
            condition: [
                { cond: (val: any) => (val == null || !isNaN(Number(val)) && Number(val) > 1900 && Number(val) < new Date().getFullYear()), message: translate("invalidyear") },
            ],
        },
        {
            title: "brand",
            require: { req: false },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "vin",
            require: { req: false },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [  ],
        },
        {
            title: "park",
            require: { req: false },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
    ];
}

