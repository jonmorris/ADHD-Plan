import { useEffect, useState } from 'preact/hooks'
import { get, set } from 'idb-keyval'

// State saved to IndexedDB under `key`. Undefined until loaded.
export function usePersisted<T>(key: string, initial: T): [T | undefined, (next: T) => void] {
  const [value, setValue] = useState<T>()

  useEffect(() => {
    get<T>(key).then((saved) => setValue(saved ?? initial))
  }, [key])

  function save(next: T) {
    setValue(next)
    set(key, next)
  }

  return [value, save]
}
