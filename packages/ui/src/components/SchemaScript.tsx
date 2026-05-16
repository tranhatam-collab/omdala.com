type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

interface SchemaScriptProps {
  schema: JsonObject | JsonArray
  id?: string
}

function serializeJsonLd(schema: JsonObject | JsonArray): string {
  // Escape script-breaking characters to keep JSON-LD safe in inline scripts.
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function SchemaScript({ schema, id }: SchemaScriptProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(schema),
      }}
    />
  )
}
