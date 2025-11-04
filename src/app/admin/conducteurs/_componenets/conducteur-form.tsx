"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"
import { getConducteur } from "@/actions/conducteur/get"
import { UpdateConducteur } from "@/actions/conducteur/update"
import { createConducteur } from "@/actions/conducteur/set"

interface ConducteurFormProps {
    conducteurId?: string
    onSuccess: () => void
}

export default function ConducteurForm({ conducteurId, onSuccess }: ConducteurFormProps) {
    const t = useTranslations()
    const [isLoading, setIsLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(!!conducteurId)
    const [error, setError] = useState<string | null>(null)

    const conducteurSchema = z.object({
        matricule: z.string().min(1),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        phone: z.string().optional(),
    });

    type ConducteurFormData = z.infer<typeof conducteurSchema>;

    const form = useForm<ConducteurFormData>({
        resolver: zodResolver(conducteurSchema),
        defaultValues: {
            matricule: "",
            firstname: "",
            lastname: "",
            phone: "",
        },
    })

    // Reset form when conducteurId changes
    useEffect(() => {
        form.reset({
            matricule: "",
            firstname: "",
            lastname: "",
            phone: "",
        })
    }, [conducteurId, form])

    useEffect(() => {
        if (!conducteurId) {
            setInitialLoading(false)
            return
        }

        const fetchConducteur = async () => {
            try {
                const result = await getConducteur(conducteurId)
                if (result.status === 200) {
                    const data = result.data
                    form.reset({
                        matricule: data.matricule || "",
                        firstname: data.firstname || "",
                        lastname: data.lastname || "",
                        phone: data.phone || "",
                    })
                } else {
                    setError(result.data.message)
                }
            } catch (err) {
                setError(t("Error.error"))
            } finally {
                setInitialLoading(false)
            }
        }

        fetchConducteur()
    }, [])

    const onSubmit = async (data: ConducteurFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            let result
            if (conducteurId) {
                result = await UpdateConducteur(conducteurId, data)
            } else {
                result = await createConducteur(data)
            }

            if (result.status === 200) {
                onSuccess()
            } else {
                setError(result.data.message || t("Error.error"))
            }
        } catch (err) {
            setError(t("Error.error"))
        } finally {
            setIsLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <Card className="bg-card border-border p-12 text-center">
                <Loader className="animate-spin mx-auto text-primary mb-4" size={32} />
                <p className="text-muted-foreground">{t("System.loading")}</p>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border p-8">
            {error && (
                <Alert className="mb-6 bg-destructive/10 border-destructive/50 text-destructive">
                    <AlertCircle size={20} />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Matricule Field */}
                    <FormField
                        control={form.control}
                        name="matricule"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("Conducteur.matricule")}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t("Conducteur.matricule_placeholder")}
                                        {...field}
                                        className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormDescription>{t("Conducteur.matricule_description")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Grid for First and Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="firstname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Conducteur.firstname")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("Conducteur.firstname_placeholder")}
                                            {...field}
                                            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("Conducteur.lastname")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("Conducteur.lastname_placeholder")}
                                            {...field}
                                            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Phone Field */}
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("Conducteur.phone")}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t("Conducteur.phone_placeholder")}
                                        {...field}
                                        className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Submit Button */}
                    <Button type="submit" disabled={isLoading} className="w-full gap-2 h-11">
                        {isLoading && <Loader size={18} className="animate-spin" />}
                        {conducteurId ? t("System.update") : t("System.create")}
                    </Button>
                </form>
            </Form>
        </Card>
    )
}