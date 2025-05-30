"use client"
import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { BusFront, ScanQrCode, Users, Warehouse } from 'lucide-react';
import Loading from '@/components/myui/loading';
import { getDevicesCount, getParksCount, getParkVehiclesCount, getUsersCount, getVehiclesCount } from '@/actions/statistic/statistic';
import CardStatic from '@/components/my/admin/card-static';
import { BarChartPark } from '@/components/my/admin/bar-chart-park';

const AdminPage = () => {
  const t = useTranslations('Index');
  const v = useTranslations('Vehicle');
  const d = useTranslations('Device');
  const u = useTranslations('Users');

  const [vehcileCount, setVehcileCount] = useState(0);
  const [isLoadinVehcileCount, setIsLoadinVehcileCount] = useState(true);

  const [parkCount, setParkCount] = useState(0)
  const [isLoadingParkCount, setIsLoadinParkCount] = useState(true);

  const [deviceCount, setDeviceCount] = useState(0);
  const [isLoadingDeviceCount, setIsLoadingDeviceCount] = useState(true);

  const [userCount, setUserCount] = useState(0);
  const [isLoadingUserCount, setIsLoadingUserCount] = useState(true);

  const [parkVehicleCount, setParkVehicleCount] = useState([]);
  const [isLoadingParkVehicleCount, setIsLoadingParkVehicleCount] = useState(true);

  useEffect(() => {
    getVehiclesCount().then((res) => {
      if (res.status === 200) {
        setVehcileCount(res.data);
        setIsLoadinVehcileCount(false);
      } else {
        setIsLoadinVehcileCount(false);
      }
    })

    getParksCount().then((res) => {
      if (res.status === 200) {
        setParkCount(res.data);
        setIsLoadinParkCount(false);
      } else {
        setIsLoadinParkCount(false);
      }
    })

    getDevicesCount().then((res) => {
      if (res.status === 200) {
        setDeviceCount(res.data);
        setIsLoadingDeviceCount(false);
      } else {
        setIsLoadingDeviceCount(false);
      }
    })

    getUsersCount().then((res) => {
      if (res.status === 200) {
        setUserCount(res.data);
        setIsLoadingUserCount(false);
      } else {
        setIsLoadingUserCount(false);
      }
    })

    getParkVehiclesCount().then((res) => {
      if (res.status === 200) {
        const newData = res.data.map((item: any) => ({
          name: item.name,
          count: item.count,
          mobile: item.count,
        }))
        setParkVehicleCount(newData)
        setIsLoadingParkVehicleCount(false);
      } else {
        setIsLoadingParkVehicleCount(false);
      }
    })

  }, [])

  return (
    <Card className='p-4 flex flex-col gap-4'>
      <div className='flex flex-wrap gap-4'>
        <CardStatic Icon={BusFront} title={v("title")} data={vehcileCount} isLoading={isLoadinVehcileCount}></CardStatic>
        <CardStatic Icon={Warehouse} title={v("park")} data={parkCount} isLoading={isLoadingParkCount}></CardStatic>
        <CardStatic Icon={ScanQrCode} title={d("title")} data={deviceCount} isLoading={isLoadingDeviceCount}></CardStatic>
        <CardStatic Icon={Users} title={u("title")} data={userCount} isLoading={isLoadingUserCount}></CardStatic>
      </div>
      <div>
        {isLoadingParkVehicleCount
          ? <div className='flex justify-center items-center p-4 h-72 w-full'>
            <Loading></Loading>
          </div>
          : <BarChartPark chartData={parkVehicleCount}></BarChartPark>
          }
      </div>
    </Card >
  )
}

export default AdminPage