'use server'
import { prisma } from '@/lib/db'
import { verifySession } from '../permissions'
import { z } from 'zod'
import { getTranslations } from 'next-intl/server'

function createVehicleSchema () {
  return z.object({
    matricule: z.string().min(1, 'مطلوب'),
    model: z.string().optional(),
    year: z
      .string()
      .optional()
      .refine(
        value =>
          !value ||
          value === '' ||
          value === 'null' ||
          (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()),
        { message: 'السنة غير صحيحة' }
      ),
    brand: z.string().optional()
  })
}

export async function QrRequest (data: any) {
  try {
    const session = await verifySession()
    if (!session || session.status != 200) {
      return { status: 401, data: { message: 'غير مصرح لك' } }
    }

    const existingDevice = await prisma.device.findFirst({
      where: { user_id: session.data.user.id },
      include: { park: true }
    })

    if (!existingDevice)
      return { status: 404, data: { message: 'لم يتم التعرف على جهازك' } }

    if (!existingDevice.park_id)
      return { status: 404, data: { message: 'لم يتم تكوين جهازك' } }

    const park = await prisma.park.findUnique({
      where: { id: existingDevice.park_id }
    })

    const schema = createVehicleSchema()
    const result = schema.safeParse(data)
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(', ')
      return { status: 400, data: { message: errors } }
    }

    const { matricule, model, year, brand } = result.data

    const existingVehicle = await prisma.vehicle.findFirst({
      where: { matricule }
    })

    const park_name =
      existingVehicle && existingVehicle.park_id
        ? (
            await prisma.park.findUnique({
              where: { id: existingVehicle.park_id },
              select: { name: true }
            })
          )?.name
        : null


    await prisma.global_etat.create({
      data: {
        vehicle_id: existingVehicle ? existingVehicle.id : null,
        matricule,
        model,
        year: year ? Number(year) : null,
        brand,
        park_id: existingDevice.park_id,
        park_name: park?.name || 'Unknown',
        vehicle_park_id: existingVehicle ? existingVehicle.park_id : null,
        vehicle_park_name: park_name,
        device_id: existingDevice.id,
        status: existingVehicle ? 'QR code request' : 'Creation request'
      }
    })

    return {
      status: 200,
      data: {
        message:
          'تم تقديم طلبك بنجاح، سيتم مراجعة طلبك من قبل الإدارة وسيتم التواصل معك في حال الحاجة إلى مزيد من المعلومات.'
      }
    }
  } catch (error) {
    return {
      status: 500,
      message:
        'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقًا أو الاتصال بالدعم إذا استمرت المشكلة.'
    }
  }
}

export async function Confirm (data: any) {
  try {
    const v = getTranslations('Vehicle')

    const session = await verifySession()
    if (!session || session.status != 200) {
      return { status: 401, data: { message: 'غير مصرح لك' } }
    }

    const existingDevice = await prisma.device.findFirst({
      where: { user_id: session.data.user.id },
      include: { park: true }
    })

    if (!existingDevice)
      return { status: 404, data: { message: 'لم يتم التعرف على جهازك' } }

    if (!existingDevice.park_id)
      return { status: 404, data: { message: 'لم يتم تكوين جهازك' } }

    const park = await prisma.park.findUnique({
      where: { id: existingDevice.park_id }
    })

    const matricule = data.matricule

    const existingVehicle = await prisma.vehicle.findFirst({
      where: { matricule }
    })

    const park_name =
      existingVehicle && existingVehicle.park_id
        ? (
            await prisma.park.findUnique({
              where: { id: existingVehicle.park_id },
              select: { name: true }
            })
          )?.name
        : null

    await prisma.global_etat.create({
      data: {
        vehicle_id: existingVehicle ? existingVehicle.id : null,
        matricule,
        vehicle_park_id: existingVehicle ? existingVehicle.park_id : null,
        vehicle_park_name: park_name,
        park_id: existingDevice.park_id,
        park_name: park?.name || 'Unknown',
        device_id: existingDevice.id,
        status: existingVehicle ? 'Confirmed' : 'Creation / Confirmed'
      }
    })

    return {
      status: 200,
      data: {
        message:
          'تم تقديم طلبك بنجاح، سيتم مراجعة طلبك من قبل الإدارة وسيتم التواصل معك في حال الحاجة إلى مزيد من المعلومات.'
      }
    }
  } catch (error) {
    return {
      status: 500,
      message:
        'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقًا أو الاتصال بالدعم إذا استمرت المشكلة.'
    }
  }
}

export async function Edit (data: any) {
  try {
    const session = await verifySession()
    if (!session || session.status != 200) {
      return { status: 401, data: { message: 'غير مصرح لك' } }
    }

    const existingDevice = await prisma.device.findFirst({
      where: { user_id: session.data.user.id },
      include: { park: true }
    })

    if (!existingDevice)
      return { status: 404, data: { message: 'لم يتم التعرف على جهازك' } }

    if (!existingDevice.park_id)
      return { status: 404, data: { message: 'لم يتم تكوين جهازك' } }

    const park = await prisma.park.findUnique({
      where: { id: existingDevice.park_id }
    })

    const schema = createVehicleSchema()
    const result = schema.safeParse(data)
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(', ')
      return { status: 400, data: { message: errors } }
    }

    const { matricule, model, year, brand } = result.data

    const existingVehicle = await prisma.vehicle.findFirst({
      where: { matricule }
    })

    const park_name =
      existingVehicle && existingVehicle.park_id
        ? (
            await prisma.park.findUnique({
              where: { id: existingVehicle.park_id },
              select: { name: true }
            })
          )?.name
        : null

    await prisma.global_etat.create({
      data: {
        vehicle_id: existingVehicle ? existingVehicle.id : null,
        matricule,
        model,
        year: year ? Number(year) : null,
        old_matricule: existingVehicle ? existingVehicle.matricule : null,
        old_model: existingVehicle ? existingVehicle.model : null,
        old_year: existingVehicle ? existingVehicle.year : null,
        old_brand: existingVehicle ? existingVehicle.brand : null,
        vehicle_park_id: existingVehicle ? existingVehicle.park_id : null,
        vehicle_park_name: park_name,
        brand,
        park_id: existingDevice.park_id,
        park_name: park?.name || 'Unknown',
        device_id: existingDevice.id,
        status: existingVehicle ? 'Edit request' : 'Edit / Create'
      }
    })

    return {
      status: 200,
      data: {
        message:
          'تم تقديم طلبك بنجاح، سيتم مراجعة طلبك من قبل الإدارة وسيتم التواصل معك في حال الحاجة إلى مزيد من المعلومات.'
      }
    }
  } catch (error) {
    return {
      status: 500,
      message:
        'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقًا أو الاتصال بالدعم إذا استمرت المشكلة.'
    }
  }
}

export async function getVehicleData (matricule: string | null) {
  try {
    const session = await verifySession()
    if (!session || session.status != 200) {
      return { status: 401, data: { message: 'غير مصرح لك' } }
    }

    if (!matricule) {
      return { status: 400, data: { message: 'الرقم التسلسلي للمركبة مطلوب' } }
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { matricule },
      select: {
        matricule: true,
        model: true,
        year: true,
        brand: true
      }
    })

    if (!vehicle) {
      return { status: 404, data: { message: 'المركبة غير موجودة' } }
    }

    return { status: 200, data: vehicle }
  } catch (error) {
    return {
      status: 500,
      data: { message: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقًا.' }
    }
  }
}

export async function markAsView (id: string) {
  try {
    const session = await verifySession()
    if (!session || session.status != 200) {
      return { status: 401, data: { message: 'غير مصرح لك' } }
    }

    const globalEtat = await prisma.global_etat.findUnique({ where: { id } })
    if (!globalEtat) {
      return { status: 404, data: { message: 'غير موجودة' } }
    }

    await prisma.global_etat.update({
      where:{
        id
      },
      data:{
        view_at: new Date()
      }
    })

    return { status: 200, data: { message: 'تم وضع علامة كمقروء' } }

  } catch (error) {
    return {
      status: 500,
      data: { message: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقًا.' }
    }
  }
}


export const updateParkVehicleFromGlobalEtat = async (id: string) => {
  try {
    const session = await verifySession()
    if (!session || session.status != 200) {
      return { status: 401, data: { message: 'غير مصرح لك' } }
    }

    const globalEtat = await prisma.global_etat.findUnique({ where: { id } })
    if (!globalEtat) {
      return { status: 404, data: { message: 'غير موجودة' } }
    }

    if (!globalEtat.matricule) {
      return { status: 400, data: { message: 'رقم المركبة غير موجود في السجل' } }
    }

    const vehicle = await prisma.vehicle.findFirst({ where: { matricule: globalEtat.matricule } })
    if (!vehicle) {
      return { status: 404, data: { message: 'المركبة غير موجودة' } }
    }

    if(vehicle.park_id === globalEtat.park_id){
      return { status: 400, data: { message: 'المركبة بالفعل في نفس الموقع' } }
    }

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        park_id: globalEtat.park_id,
      }
    })

    await prisma.vehicle_park.create({
      data: {
        vehicle_id: vehicle.id,
        park_id: globalEtat.park_id,
        added_from: session.data.user.id,
        added_at: new Date(),
      }
    })
    
    return { status: 200, data: { message: 'تم تحديث موقع المركبة بنجاح' } }
  } catch (error) {
    return {
      status: 500,
      data: { message: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقًا.' }
    }
  }
}


export const updateVehicleDataFromGlobalEtat = async (id: string, data: { brand?: string; model?: string; year?: number }) => {
  try {
    const session = await verifySession()
    if (!session || session.status != 200) {
      return { status: 401, data: { message: 'غير مصرح لك' } }
    }

    const globalEtat = await prisma.global_etat.findUnique({ where: { id } })
    if (!globalEtat) {
      return { status: 404, data: { message: 'غير موجودة' } }
    }

    if (!globalEtat.matricule) {
      return { status: 400, data: { message: 'رقم المركبة غير موجود في السجل' } }
    }

    const vehicle = await prisma.vehicle.findFirst({ where: { matricule: globalEtat.matricule } })
    if (!vehicle) {
      return { status: 404, data: { message: 'المركبة غير موجودة' } }
    }

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        brand: data.brand?? vehicle.brand,
        model: data.model?? vehicle.model,
        year: data.year?? vehicle.year,
      }
    })

    return { status: 200, data: { message: 'تم تحديث بيانات المركبة بنجاح' } }
  } catch (error) {
    return {
      status: 500,
      data: { message: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقًا.' }
    }
  }
}