"use client"
import React, { useEffect, useState } from 'react'
import { useOrigin } from '@/hooks/use-origin'
import axios from 'axios'
import FilePreview from '@/components/myui/file-preview'
import { deleteFileFromLocalHost, downloadFileFromLocalHost, getFileFromLocalHost, ViewFileFromLocalHost } from '@/actions/localstorage/util-client'


const ListFilesWithPreview = () => {
    const [files, setFiles] = useState<{file:File,id:string}[] | []>([])
    const origin = useOrigin()

    useEffect(() => {
        if (!origin) return
        axios(origin + "/api/files").then(res => {
            if (res.status === 200) {
              res.data.data.forEach((file:any)=>{
                getFileFromLocalHost(file.id,origin+"/api/files/").then((val)=>{
                  if(val){
                    setFiles((p)=>[...p,{file:val,id:file.id}])
                  }
                })
              })
            }
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
                          file={file.file}
                          size='w-20 h-24'
                          onRemove2={() => handleDelete(file.id)}
                          onDownload={() => handleDownloadDirect(file.id)}
                          onView={() => handleView(file.id)}
                          fileId={file.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ListFilesWithPreview
