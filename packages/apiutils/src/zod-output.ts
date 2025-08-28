import { z, ZodSchema, ZodObject, ZodArray, ZodOptional, ZodNullable, ZodDefault, ZodTypeAny } from "zod"
import { blg } from "./logging"
import { isObject, reduce, has, get, map, isArray } from "lodash-es"
import dayjs from "dayjs" // Import dayjs for timing

// Helper to get the underlying schema if wrapped (Optional, Nullable, Default)
const unwrapSchema = (schema: ZodSchema): ZodSchema => {
  if (schema instanceof ZodOptional || schema instanceof ZodNullable) {
    return unwrapSchema(schema.unwrap())
  }
  if (schema instanceof ZodDefault) {
    // Access the inner type definition for ZodDefault
    return unwrapSchema(schema._def.innerType)
  }
  // Can add checks for other wrappers like ZodEffects if necessary
  return schema
}

/**
 * Internal recursive function to filter data based on a schema.
 * Not intended for direct external use.
 *
 * @template S - The Zod schema type.
 * @param output - The data to filter (can be any type).
 * @param schema - The Zod schema defining the structure to keep.
 * @returns Filtered data or null/undefined/primitive.
 */
const recursiveFilter = <S extends ZodSchema>(output: unknown, schema: S): z.infer<S> | null => {
  // Get the core, unwrapped schema type to determine structure (Object, Array, etc.)
  const coreSchema = unwrapSchema(schema)

  // 1. Handle non-object/non-array core schemas (Primitives, Literals, etc.)
  if (!(coreSchema instanceof ZodObject || coreSchema instanceof ZodArray)) {
    // For non-structured types, return the output value directly. Filtering doesn't apply here.
    return output as z.infer<S>
  }

  // 2. Handle Array Schemas
  if (coreSchema instanceof ZodArray && isArray(output)) {
    // Get the schema for the elements within the array (might itself be wrapped)
    const elementSchema = coreSchema.element
    // Recursively filter each item in the output array using the element's schema
    return map(output, (item) => recursiveFilter(item, elementSchema)) as z.infer<S>
  }

  // 3. Handle Object Schemas
  if (coreSchema instanceof ZodObject && isObject(output)) {
    const shape = coreSchema.shape as Record<string, ZodSchema> // Shape of the core object
    const filteredOutput = reduce(
      shape,
      (result, valueSchema: ZodSchema, key: string) => {
        // Check if the key from the schema's shape exists in the actual output object
        if (has(output, key)) {
          const originalValue = get(output, key)
          // IMPORTANT: Recurse using the *original* valueSchema from the shape,
          // as it might be Optional, Nullable etc., which needs to be handled
          // by the recursive call's initial null/undefined check.
          // Handle null/undefined values within the recursion
          if (originalValue === null || originalValue === undefined) {
            if (valueSchema instanceof ZodOptional || valueSchema instanceof ZodNullable) {
              result[key] = originalValue // Keep null/undefined if allowed by schema slice
            } else {
              // Skip the key if value is null/undefined but schema slice doesn't allow it
            }
          } else {
            result[key] = recursiveFilter(originalValue, valueSchema)
          }
        }
        // If the key from the schema doesn't exist in the output, it's simply skipped (filtered out).
        return result
      },
      {} as Record<string, any>,
    )
    // The result should conform to the original schema T (which might be Optional<Object>, etc.)
    return filteredOutput as z.infer<S>
  }

  // 4. Handle Mismatches (e.g., schema is Object, output is Array or primitive)
  // This case indicates the input 'output' doesn't structurally match the 'schema'.
  // Since we are only filtering, we return null and log a warning.
  //   blg.warn("[recursiveFilter] Output structure mismatch with schema or unhandled case.", {
  //     outputType: typeof output,
  //     schemaType: coreSchema?._def?.typeName, // Log core schema type
  //     isOutputObject: isObject(output),
  //     isOutputArray: isArray(output),
  //     isSchemaObject: coreSchema instanceof ZodObject,
  //     isSchemaArray: coreSchema instanceof ZodArray,
  //     schemaName: schema.description || "UnnamedSchema",
  //   })
  return null
}

/**
 * Entry point: Recursively filters output data based on a Zod schema,
 * returning only the fields defined in the schema at all levels.
 * Also measures and logs performance if filtering takes longer than 1 second.
 * It does not perform validation.
 *
 * @template T - The Zod schema type.
 * @param output - The raw output data from the function/service.
 * @param schema - The Zod schema to define the keys and structure to keep.
 * @returns A new object/array containing only the keys/elements defined in the schema and present in the output. Returns null/undefined/primitive directly if the schema or output dictates.
 */
export const validateAndFilterOutput = <T extends ZodSchema>(output: unknown, schema: T): any => {
  const startTime = dayjs()

  // Handle null or undefined output at the entry point
  if (output === null || output === undefined) {
    if (schema instanceof ZodOptional || schema instanceof ZodNullable) {
      return output as z.infer<T> // Return null or undefined if schema allows
    }
    // If schema doesn't allow null/undefined, recursiveFilter would eventually return null anyway,
    // but we can return early here.
    return null
  }

  // Perform the recursive filtering
  const result = recursiveFilter(output, schema)

  // Check performance
  const endTime = dayjs()
  const duration = endTime.diff(startTime, "millisecond")

  if (duration > 1000) {
    blg.warn(`[validateAndFilterOutput] Filtering took longer than 1 second (${duration}ms)`, {
      durationMs: duration,
      schemaName: schema.description || "UnnamedSchema",
      // Consider adding basic output structure info if helpful, e.g., array length or object keys count
      // outputInfo: isArray(output) ? `Array(${output.length})` : isObject(output) ? `Object(${Object.keys(output).length})` : typeof output
    })
  }

  return result
}
