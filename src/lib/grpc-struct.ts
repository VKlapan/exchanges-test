// Utilities to convert plain JS values/objects into google.protobuf.Value/Struct
export function jsValueToProtoValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: 0 };
  if (Array.isArray(value)) {
    return { listValue: { values: value.map(jsValueToProtoValue) } };
  }
  if (typeof value === 'object') {
    return {
      structValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, jsValueToProtoValue(v)]),
        ),
      },
    };
  }
  if (typeof value === 'number') return { numberValue: value };
  if (typeof value === 'boolean') return { boolValue: value };
  return { stringValue: String(value) };
}

export function jsObjectToStruct(obj: any): any {
  return { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, jsValueToProtoValue(v)])) };
}
