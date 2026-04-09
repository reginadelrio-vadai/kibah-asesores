import {
  createPropertySchema,
  updatePropertySchema,
  mapSnakeToDB,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from '@/lib/validations/property'
import * as dal from '@/lib/dal/properties'
import * as webhookService from '@/lib/services/webhook-service'

export async function createProperty(data: CreatePropertyInput) {
  const validated = createPropertySchema.parse(data)
  const dbData = mapSnakeToDB(validated as Record<string, unknown>)
  const property = await dal.insertProperty(dbData)
  webhookService.triggerEvent('property.created', property).catch(console.error)
  return property
}

export async function updateProperty(id: number, data: UpdatePropertyInput) {
  const validated = updatePropertySchema.parse(data)
  const dbData = mapSnakeToDB(validated as Record<string, unknown>)
  const property = await dal.updateProperty(id, dbData)
  webhookService.triggerEvent('property.updated', property).catch(console.error)
  return property
}

export async function deleteProperty(id: number) {
  await dal.deleteProperty(id)
  webhookService.triggerEvent('property.deleted', { id }).catch(console.error)
}
