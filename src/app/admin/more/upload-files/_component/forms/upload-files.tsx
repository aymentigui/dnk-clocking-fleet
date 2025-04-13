'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import toast from 'react-hot-toast'
import { FileDropzone } from '@/components/myui/file-dropzone'
import { useTranslations } from 'next-intl'
import Loading from '@/components/myui/loading-line'
import axios from 'axios'

const formSchema = z.object({
  files: z.array(z.instanceof(File)).refine((files) => files.length > 0, {
    message: "Veuillez sélectionner au moins un fichier.",
  }),
})

interface FileUploadProps {
  acceptedFileTypes?: Record<string, string[]>
  multiple?: boolean
}

export default function FileUploadForm({ acceptedFileTypes, multiple = true }: FileUploadProps) {
  // acceptedFileTypes = {
  //   'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
  //   'video/*': ['.mp4', '.avi', '.mov', '.webm']
  // }
  const [uploading, setUploading] = useState(false)
  const f = useTranslations("Files")
  const s = useTranslations("System")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setUploading(true)
    try {
      handleUpload(values.files)
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
    }
  }
  const handleUpload = async (file: File[]) => {
    if (file) {
      const data = new FormData()
      file.forEach((file) => {
        data.append("file", file)
      })

      const config = {
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          //console.log(percentCompleted);
        }
      }

      let files;
      axios.post('/api/files', data, config).then((res) => {
        if (res.data.every((s: any) => s.status === 200)) {
          toast.success("File uploaded successfully")
          files=res.data
          form.reset()
        }else{
          console.log(res.data)
          res.data.forEach((file:any)=>{
            file.status!==200 && toast.error(file.data.message)
          })
        }
      })
    }
  }
  const handleRemoveFile = (event: React.MouseEvent, file: File) => {
    event.stopPropagation()
    form.setValue('files', form.getValues('files').filter(f => f.name !== file.name))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{f("title")}</FormLabel>
              <FormControl>
                <FileDropzone
                  onFilesSelected={(files) => field.onChange(
                    field.value.find(file => file.name === files[0].name) ? field.value : [...field.value, ...files]
                  )}
                  value={field.value}
                  accept={acceptedFileTypes}
                  multiple={multiple}
                  onRemove={handleRemoveFile}
                />
              </FormControl>
              <FormDescription>
                {multiple ? f("selectoneormorefiles") : f("selectonefile")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={uploading} className="relative">
          {uploading ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            </>
          ) : (
            s("save")
          )}
        </Button>
      </form>
      {uploading && (
        <Loading />
      )}
    </Form>
  )
}