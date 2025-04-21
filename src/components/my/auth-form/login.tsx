"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Form,
    FormField,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { loginUser } from '@/actions/auth/auth'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { getConfirmationCodePasswordChange } from '@/actions/auth/password-change'
import { useLocale, useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'  // Assurez-vous d'installer react-feather

const LoginForm = () => {
    const [loading, setLoading] = useState(false)
    const [twoFactorConfermation, setTwoFactorConfermation] = useState(false)
    const [showPassword, setShowPassword] = useState(false)  // Pour gérer l'affichage du mot de passe
    const router = useRouter()
    const locale =useLocale()

    const t = useTranslations("Settings")
    const s = useTranslations("System")
    const u = useTranslations("Users")

    const LoginSchema = z.object({
        email: z.string({ required_error: u("emailrequired") }).email({ message: u("emailinvalid") }),
        password: z.string({ required_error: u("passwordrequired") }).min(6, { message: u("password6") }),
        code: z.string().optional(),
    });

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })
    
    function onSubmit(values: z.infer<typeof LoginSchema>) {
        setLoading(true)
        loginUser(values).then((res) => {
            if (res.status === 200) {
                if (res.data.twoFactorConfermation) {
                    setTwoFactorConfermation(true)
                } else {
                    router.push("/admin");
                }
            } else {
                toast.error(res.data.message);
            }
        })
        setLoading(false)
    }

    const passwordForget = async () => {
        if (!form.getValues().email) {
            toast.error(t("emailorusername"))
            return
        }
        getConfirmationCodePasswordChange(form.getValues().email).then((res) => {
            if (res.status === 200) {
                router.push(`/auth/reset?email=${encodeURIComponent(form.getValues().email)}`)
            } else {
                toast.error(res.data.message)
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 text-black">
                {!twoFactorConfermation && <>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("emailorusername")}</FormLabel>
                                <FormControl>
                                    <Input className='border-gray-200 focus:border-black' placeholder={t("emailorusername")} {...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("password")}</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}  // Toggle du type du champ de mot de passe
                                            className='border-gray-200 focus:border-black'
                                            placeholder={t("password")}
                                            {...field}
                                        />
                                        <Button
                                            type="button"
                                            className={"absolute p-3 bg-background hover:bg-border border top-0 "+(locale!=="ar" ? "right-0" : "left-0")}
                                            onClick={() => setShowPassword(!showPassword)}  // Toggle pour l'icône
                                        >
                                            {showPassword ? <EyeOff className='text-foreground' size={20} /> : <Eye className='text-foreground' size={20} />}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                </>}
                {twoFactorConfermation && <>
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("codeverification")} </FormLabel>
                                <FormControl>
                                    <Input className='border-gray-200 focus:border-black' placeholder={t("codeverification")} {...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                </>}
                <Button variant='link' type='button' onClick={passwordForget} className='p-0 text-black'>{t("forgetpassword")}</Button>
                <div className='pt-4'>
                    <Button
                        disabled={loading} className={cn('font-bold w-full bg-black hover:bg-gray-800 text-white', loading && 'cursor-wait')} type="submit">{twoFactorConfermation ? s("confirm") : s("login")}</Button>
                </div>
            </form>
        </Form>
    )
}

export default LoginForm
