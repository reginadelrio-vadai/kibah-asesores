import {
  createPropertySchema,
  updatePropertySchema,
  mapSnakeToDB,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from '@/lib/validations/property'
import * as dal from '@/lib/dal/properties'

export async function createProperty(data: CreatePropertyInput) {
  const validated = createPropertySchema.parse(data)
  const dbData = mapSnakeToDB(validated as Record<string, unknown>)
  return dal.insertProperty(dbData)
}

export async function updateProperty(id: number, data: UpdatePropertyInput) {
  const validated = updatePropertySchema.parse(data)
  const dbData = mapSnakeToDB(validated as Record<string, unknown>)
  return dal.updateProperty(id, dbData)
}

export async function deleteProperty(id: number) {
  return dal.deleteProperty(id)
}
