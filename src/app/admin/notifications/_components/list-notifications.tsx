"use client"
import { getNotifications } from '@/actions/notification/get';
import Loading from '@/components/myui/loading';
import TablePagination from '@/components/myui/table/table-pagination';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const ListNotifications = () => {

    const params = useSearchParams()
    const pageUrl = params.get('page');

    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(pageUrl ? parseInt(pageUrl) : 1);
    const [ count, setCount ] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        setIsLoading(true);
        const res = await getNotifications(page);
        if (res.status === 200) {
            setNotifications(res.data);
            setCount(res.count);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchNotifications();
    }, [page]);

    if(isLoading) 
        return <div className='flex justify-center items-center h-full w-full'>
            <Loading />
        </div> 

    return (
        <>
            {notifications.map((n: any) =>
                <Link href={`/admin/notifications/${n.id}`} key={n.id} className={
                    cn(
                        'p-4 border border-foreground rounded-xl hover:bg-border dark:hover:bg-sidebar',
                        !n.view?"bg-accent":""
                    )
                }>
                    <div className='flex justify-between items-center'>
                        <h2 className='font-bold text-lg'>{n.title}</h2>
                        <p>{n.created_at}</p>
                    </div>
                    <p className='overflow-hidden text-ellipsis whitespace-nowrap'>{n.contenu}...</p>
                </Link>
            )}
            {count > 10 && <TablePagination page={page} setPage={setPage} count={count} pageSize={10} isLoading={isLoading} debouncedSearchQuery={""} />}
        </>
    )
}

export default ListNotifications
