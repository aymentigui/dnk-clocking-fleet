"use client"
import React, { useEffect, useState } from 'react'
import { useOrigin } from '@/hooks/use-origin'
import axios from 'axios'
import FilePreview from '@/components/myui/file-preview2'
import { deleteFileFromLocalHost, downloadFileFromLocalHost, ViewFileFromLocalHost } from '@/actions/localstorage/util-client'


const ListFilesSansPreview = () => {
    const [files, setFiles] = useState<any[] | []>([])
    const origin = useOrigin()

    useEffect(() => {
        if (!origin) return
        axios(origin + "/api/files").then(res => {
            setFiles(res.data.data);
        })
    }, [origin])

    const handleDownloadDirect = async (id: string) => {
        if (!origin) return
        downloadFileFromLocalHost(id, origin + "/api/files/")
    }

    const handleView = async (id: string) => {
        if (!origin) return
        ViewFileFromLocalHost(id, origin + "/api/files/")
    }

    const handleDelete = async (id: string) => {
        if (!origin) return
        deleteFileFromLocalHost(id, origin + "/api/files/").then((val) => {
            if (val && val.status === 200) {
                setFiles((p) => p.filter((file: any) => file.id !== id));
            }
        })
    }

    return (
        <div>
            {files.length > 0 && (
                <div className='flex flex-wrap gap-2 p-2'>
                    {files.map((file: any, index) => (
                        <FilePreview
                            key={index}
                            file={{ fileid: file.id, filename: file.name, filetype: file.mimeType }}
                            size='w-20 h-24'
                            onRemove={() => handleDelete(file.id)}
                            onDownload={() => handleDownloadDirect(file.id)}
                            onView={() => handleView(file.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ListFilesSansPreview
