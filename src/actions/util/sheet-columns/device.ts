"use client";
import { ColumnSheetsImport } from "@/hooks/use-import-csv";
import { useTranslations } from "next-intl";

export function getColumns(): ColumnSheetsImport[] {
     const translate = useTranslations("sheet")
     
    return [
        {
            title: "code",
            require: { req: true, message: translate("required") },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "username",
            require: { req: true, message: translate("required") },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [
                { cond: (val: string) => !val.includes(" "), message: translate("nospacesallowed") },            
            ],
        },
        {
            title: "password",
            require: { req: true, message: translate("required") },
            type: { tp: "string", message: translate("invalidtext") },
            condition: [
                { cond: (val: string) => val.length >= 1, message: translate("invalidpassword") },
            ],
        },
        {
            title: "park",
            require: { req: false},
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "region",
            require: { req: false},
            type: { tp: "string", message: translate("invalidtext") },
            condition: [],
        },
        {
            title: "type",
            require: { req: false},
            type: { tp: "number", message: translate("invalidnumber") },
            condition: [],
        },
    ];
}

