"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import AvatarUploader from '@/components/myui/avata-uploader'
import axios from 'axios'
import { useOrigin } from '@/hooks/use-origin'



const ImageForm = ({ image, userId }: { image: string, userId: string }) => {
    const [loading, setLoading] = useState(false)
    const ts = useTranslations('System');
    const u = useTranslations('Users');
    const origin = useOrigin()

    const ImageScema = z.object({
        image: z
            .instanceof(File, { message: u("avatarinvalid") })
            .optional()
            .refine((file) => !file || file.type.startsWith("image/"), {
                message: u("onlyimagesallowed"),
            }),
    })

    const form = useForm<z.infer<typeof ImageScema>>({
        resolver: zodResolver(ImageScema),
    })

    const imageChnage = form.watch('image')

    const onSubmit = async (data: z.infer<typeof ImageScema>) => {
        setLoading(true)
        if (data.image) {
            const formData = new FormData();
            formData.append("file", data.image);
            const res = await axios.put(origin + "/api/admin/users/" + userId+ "/image",formData)
            if (res.data.status === 200) {
                toast.success(ts("updatesuccess"))
                form.reset()
            } else {
                toast.error(res.data.data.message)
            }
        }
        setLoading(false)
    }

    return (
        <div className='my-4'>
            <div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex justify-between items-center flex-nowrap gap-4">
                        <AvatarUploader name="image" image={image} />
                        <div className='pt-6'>
                            {imageChnage && <Button
                                disabled={loading} className={cn('font-bold w-full', loading && 'cursor-wait')} type="submit">{ts('save')}
                            </Button>}
                        </div>
                    </form>
                </Form>
            </div>

        </div>
    )
}

export default ImageForm
