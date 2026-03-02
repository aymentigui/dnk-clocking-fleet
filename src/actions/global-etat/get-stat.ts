'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export type ConfirmVehicleParams = {
  startDate?: Date // inclusive
  endDate?: Date // inclusive
  parkId?: string
  page?: number // 1-based
  pageSize?: number
  markAsRead?: any
  all?: boolean
}

export type ConfirmVehicleItem = {
  id: string
  matricule: string
  parkName: string | null
  date: Date
  markAsRead?: any
}

export type ConfirmVehicleResult = {
  total: number // total distinct matricule (sans pagination)
  page: number
  pageSize: number
  items: ConfirmVehicleItem[]
}

export type ConfirmVehicleNotParkParams = {
  startDate?: Date // inclusive
  endDate?: Date // inclusive
  parkId?: string // filtre sur ge.park_id
  page?: number // 1-based
  pageSize?: number
  markAsRead?: any
  all?: boolean
}

export type ConfirmVehicleNotParkItem = {
  id: string
  matricule: string
  parkName: string | null
  oldParkName?: string | null
  date: Date
  markAsRead?: any
}

export type ConfirmVehicleNotParkResult = {
  total: number // total distinct matricule (sans pagination)
  page: number
  pageSize: number
  items: ConfirmVehicleNotParkItem[]
}

export type GetCodeQrRequestParams = {
  startDate?: Date // inclusive
  endDate?: Date // inclusive
  parkId?: string // filtre sur ge.park_id
  markAsRead?: any
  all?: boolean
  page?: number // 1-based
  pageSize?: number
}

export type QrRequestItem = {
  id: string
  matricule: string
  parkName: string | null
  oldParkName?: string | null
  date: Date
}

export type GetCodeQrRequestResult = {
  total: number // total distinct matricule (sans pagination)
  page: number
  pageSize: number
  items: QrRequestItem[]
}

export type GetCreationRequestParams = {
  startDate?: Date // inclusive
  endDate?: Date // inclusive
  parkId?: string // filtre sur ge.park_id
  markAsRead?: any
  all?: boolean
  page?: number // 1-based
  pageSize?: number
}

export type CreationRequestItem = {
  id: string
  matricule: string
  old_matricule?:string
  parkName: string | null
  date: Date
}

export type GetCreationRequestResult = {
  total: number // total distinct matricule (sans pagination)
  page: number
  pageSize: number
  items: CreationRequestItem[]
}

export type GetEditRequestParams = {
  startDate?: Date
  endDate?: Date
  parkId?: string
  markAsRead?: any
  all?: boolean
  page?: number
  pageSize?: number
}

export type EditRequestItem = {
  id: string
  matricule: string
  brand?: string | null
  model?: string | null
  year?: number | null
  old_matricule?: string | null
  old_brand?: string | null
  old_model?: string | null
  old_year?: number | null
  parkName: string | null
  markAsRead?: any
  date: Date
}

export type GetEditRequestResult = {
  total: number
  page: number
  pageSize: number
  items: EditRequestItem[]
}

export async function confirmVehicles(
  params: ConfirmVehicleParams
): Promise<ConfirmVehicleResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(2000, Math.max(1, params.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const start = params.startDate ?? new Date('1970-01-01T00:00:00.000Z')
  const end = params.endDate ?? new Date('2999-12-31T23:59:59.999Z')

  // 1) Items avec pagination - version MariaDB
  const items = await prisma.$queryRaw<ConfirmVehicleItem[]>(
    Prisma.sql`
      SELECT 
        id,
        matricule,
        park_name as "parkName",
        created_at as "date",
        view_at as "markAsRead"
      FROM (
        SELECT 
          ge.id,
          ge.matricule,
          ge.park_name,
          ge.created_at,
          ge.view_at
          ${params.all ? Prisma.empty : Prisma.sql`,ROW_NUMBER() OVER (PARTITION BY ge.matricule ORDER BY ge.created_at DESC) as rn`}
        FROM global_etat ge
        WHERE ge.vehicle_id IS NOT NULL
          AND ge.matricule IS NOT NULL
          AND ge.park_id IS NOT NULL
          AND ge.vehicle_park_id IS NOT NULL
          AND ge.park_id = ge.vehicle_park_id
          AND ge.created_at >= ${start}
          AND ge.created_at <= ${end}
          ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
           ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
      ) t
      ${params.all ? Prisma.empty : Prisma.sql`WHERE t.rn = 1`}
      ${params.all ? Prisma.sql`ORDER BY t.created_at DESC`: Prisma.sql`ORDER BY t.matricule, t.created_at DESC`}
      LIMIT ${pageSize}
      OFFSET ${skip}
    `
  )

  // 2) TOTAL distinct matricule (sans pagination)
  const totalRow = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(${params.all ? Prisma.empty : Prisma.sql`DISTINCT`} ge.matricule) as total
      FROM global_etat ge
      WHERE ge.vehicle_id IS NOT NULL
        AND ge.matricule IS NOT NULL
        AND ge.park_id IS NOT NULL
        AND ge.vehicle_park_id IS NOT NULL
        AND ge.park_id = ge.vehicle_park_id
        AND ge.created_at >= ${start}
        AND ge.created_at <= ${end}
        ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
        ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
    `
  )

  const total = Number(totalRow?.[0]?.total ?? 0)

  return {
    total,
    page,
    pageSize,
    items
  }
}

/**
 * Véhicules confirmés où park_id = vehicle_park_id
 */
export async function confirmVehiclesNotPark(
  params: ConfirmVehicleNotParkParams
): Promise<ConfirmVehicleNotParkResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(2000, Math.max(1, params.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const start = params.startDate ?? new Date('1970-01-01T00:00:00.000Z')
  const end = params.endDate ?? new Date('2999-12-31T23:59:59.999Z')
  // 1) ITEMS (distinct matricule) : la plus récente par matricule
  const items = await prisma.$queryRaw<ConfirmVehicleNotParkItem[]>(
    Prisma.sql`
      SELECT 
        id,
        matricule,
        park_name as "parkName",
        vehicle_park_name as "oldParkName",
        created_at as "date",
        view_at as "markAsRead"
      FROM (
        SELECT 
          ge.id,
          ge.matricule,
          ge.park_name,
          ge.vehicle_park_name,
          ge.created_at,
          ge.view_at
          ${params.all ? Prisma.empty : Prisma.sql`,ROW_NUMBER() OVER (PARTITION BY ge.matricule ORDER BY ge.created_at DESC) as rn`}
        FROM global_etat ge
        WHERE ge.vehicle_id IS NOT NULL
          AND ge.matricule IS NOT NULL
          AND ge.park_id IS NOT NULL
          AND ge.vehicle_park_id IS NOT NULL
          AND ge.park_id <> ge.vehicle_park_id
          AND ge.created_at >= ${start}
          AND ge.created_at <= ${end}
          ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
          ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
      ) t
      ${params.all ? Prisma.empty : Prisma.sql`WHERE t.rn = 1`}
      ${params.all ? Prisma.sql`ORDER BY t.created_at DESC`: Prisma.sql`ORDER BY t.matricule, t.created_at DESC`}
      LIMIT ${pageSize}
      OFFSET ${skip}
    `
  )

  // 2) TOTAL distinct matricule (sans pagination)
  const totalRow = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(${params.all ? Prisma.empty : Prisma.sql`DISTINCT`} ge.matricule) as total
      FROM global_etat ge
      WHERE ge.vehicle_id IS NOT NULL
        AND ge.matricule IS NOT NULL
        AND ge.park_id IS NOT NULL
        AND ge.vehicle_park_id IS NOT NULL
        AND ge.park_id <> ge.vehicle_park_id
        AND ge.created_at >= ${start}
        AND ge.created_at <= ${end}
        ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
        ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
    `
  )

  const total = Number(totalRow?.[0]?.total ?? 0)

  return { total, page, pageSize, items }
}

/**
 * Récupère les lignes avec vehicle_id non null + status = "QR code request"
 * Distinct sur matricule => on retourne la ligne la plus récente par matricule.
 */
export async function getCodeQrRequest(
  params: GetCodeQrRequestParams
): Promise<GetCodeQrRequestResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(2000, Math.max(1, params.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const start = params.startDate ?? new Date('1970-01-01T00:00:00.000Z')
  const end = params.endDate ?? new Date('2999-12-31T23:59:59.999Z')

  // 1) ITEMS: dernière ligne par matricule
  const items = await prisma.$queryRaw<QrRequestItem[]>(
    Prisma.sql`
      SELECT 
        id,
        matricule,
        park_name as "parkName",
        vehicle_park_name as "oldParkName",
        created_at as "date",
        view_at as "markAsRead"
      FROM (
        SELECT 
          ge.id,
          ge.matricule,
          ge.park_name,
          ge.vehicle_park_name,
          ge.created_at,
          ge.view_at
        FROM global_etat ge
        WHERE ge.vehicle_id IS NOT NULL
          AND ge.matricule IS NOT NULL
          AND ge.status = ${'QR code request'}
          AND ge.created_at >= ${start}
          AND ge.created_at <= ${end}
          ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
          ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
      ) t
      ORDER BY t.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${skip}
    `
  )

  // 2) TOTAL sans distinct matricule
  const totalRow = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(ge.matricule) as total
      FROM global_etat ge
      WHERE ge.vehicle_id IS NOT NULL
        AND ge.matricule IS NOT NULL
        AND ge.status = ${'QR code request'}
        AND ge.created_at >= ${start}
        AND ge.created_at <= ${end}
        ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
        ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
    `
  )
  const total = Number(totalRow?.[0]?.total ?? 0)

  return { total, page, pageSize, items }
}

/**
 * vehicle_id IS NULL + status = "Creation request"
 * Distinct sur matricule => on retourne la ligne la plus récente par matricule.
 */
export async function getCodeQrRequestAndCreation(
  params: GetCreationRequestParams
): Promise<GetCreationRequestResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(2000, Math.max(1, params.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const start = params.startDate ?? new Date('1970-01-01T00:00:00.000Z')
  const end = params.endDate ?? new Date('2999-12-31T23:59:59.999Z')

  // 1) ITEMS: dernière ligne par matricule
  const items = await prisma.$queryRaw<CreationRequestItem[]>(
    Prisma.sql`
      SELECT 
        id,
        matricule,
        brand,
        model,
        year,
        old_matricule,
        park_name as "parkName",
        created_at as "date",
        view_at as "markAsRead"
      FROM (
        SELECT 
          ge.id,
          ge.matricule,
          ge.brand,
          ge.old_matricule,
          ge.model,
          ge.year,
          ge.park_name,
          ge.created_at,
          ge.view_at
        FROM global_etat ge
        WHERE ge.vehicle_id IS NULL
          AND ge.matricule IS NOT NULL
          AND ge.created_at >= ${start}
          AND ge.created_at <= ${end}
          ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
          ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
      ) t
      ORDER BY t.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${skip}
    `
  )

  // 2) TOTAL sans distinct matricule
  const totalRow = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(ge.matricule) as total
      FROM global_etat ge
      WHERE ge.vehicle_id IS NULL
        AND ge.matricule IS NOT NULL
        AND ge.created_at >= ${start}
        AND ge.created_at <= ${end}
        ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
        ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
    `
  )

  const total = Number(totalRow?.[0]?.total ?? 0)

  return { total, page, pageSize, items }
}

/**
 * Récupère les lignes où au moins un champ old_* n'est pas null.
 * Distinct sur matricule => ligne la plus récente par matricule.
 */
export async function getEditRequest(
  params: GetEditRequestParams
): Promise<GetEditRequestResult> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(2000, Math.max(1, params.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const start = params.startDate ?? new Date('1970-01-01T00:00:00.000Z')
  const end = params.endDate ?? new Date('2999-12-31T23:59:59.999Z')

  // 1) ITEMS
  const items = await prisma.$queryRaw<EditRequestItem[]>(
    Prisma.sql`
      SELECT 
        id,
        matricule,
        brand,
        model,
        year,
        old_matricule,
        old_brand,
        old_model,
        old_year,
        park_name as "parkName",
        created_at as "date",
        view_at as "markAsRead"
      FROM (
        SELECT 
          ge.id,
          ge.matricule,
          ge.brand,
          ge.model,
          ge.year,
          ge.old_matricule,
          ge.old_brand,
          ge.old_model,
          ge.old_year,
          ge.park_name,
          ge.created_at,
          ge.view_at
        FROM global_etat ge
        WHERE ge.matricule IS NOT NULL
          AND (
            ge.old_matricule IS NOT NULL OR
            ge.old_model IS NOT NULL OR
            ge.old_brand IS NOT NULL OR
            ge.old_year IS NOT NULL
          )
          AND ge.created_at >= ${start}
          AND ge.vehicle_id IS NOT NULL
          AND ge.created_at <= ${end}
          ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
          ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
      ) t
      ORDER BY t.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${skip}
    `
  )

  // 2) TOTAL sans distinct matricule
  const totalRow = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(ge.matricule) as total
      FROM global_etat ge
      WHERE ge.matricule IS NOT NULL
        AND (
          ge.old_matricule IS NOT NULL OR
          ge.old_model IS NOT NULL OR
          ge.old_brand IS NOT NULL OR
          ge.old_year IS NOT NULL
        )
        AND ge.created_at >= ${start}
        AND ge.created_at <= ${end}
        ${params.markAsRead === false ? Prisma.sql`AND ge.view_at IS NULL` : Prisma.empty}
        ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
    `
  )

  const total = Number(totalRow?.[0]?.total ?? 0)

  return {
    total,
    page,
    pageSize,
    items
  }
}


export async function getTotalMatriculeUnique(params: { startDate?: Date; endDate?: Date; parkId?: string }): Promise<number> {
  try{
    const start = params.startDate ?? new Date('1970-01-01T00:00:00.000Z')
  const end = params.endDate ?? new Date('2999-12-31T23:59:59.999Z')

  const totalRow = await prisma.$queryRaw<{ total: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(DISTINCT ge.matricule) as total
      FROM global_etat ge
      WHERE ge.matricule IS NOT NULL
        AND ge.created_at >= ${start}
        AND ge.created_at <= ${end}
        ${params.parkId
        ? Prisma.sql`AND ge.park_id = ${params.parkId}`
        : Prisma.empty
      }
    `
  )
  return Number(totalRow?.[0]?.total ?? 0)
  }catch(error){
    console.error("Error in getTotalMatriculeUnique:", error)
    throw error
  }
}
