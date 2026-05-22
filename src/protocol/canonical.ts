export type CanonicalValue = unknown

export function canonicalize(value: CanonicalValue): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: CanonicalValue): CanonicalValue {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, CanonicalValue>
    return Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .reduce<Record<string, CanonicalValue>>((sorted, key) => {
        sorted[key] = sortValue(record[key])
        return sorted
      }, {})
  }

  return value
}
