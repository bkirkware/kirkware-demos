export interface ArrayEditResult {
  ok: boolean
  error?: string
  filePath?: string
}

/** Appends `item` to the array field `field` on the given step, saving back to the demo's source file. */
export async function addArrayItem(stepId: string, field: string, item: string | object): Promise<ArrayEditResult> {
  try {
    const res = await fetch('/api/edit-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'array-add', stepId, field, item }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? `Add failed (${res.status})` }
    return data
  } catch {
    return { ok: false, error: 'Could not reach the local edit-script endpoint — is `npm run dev` running?' }
  }
}

/**
 * Removes the element at `index` from the array field `field` on the given step. `oldValue` is compared against the
 * item's own text (plain string arrays) or against `compareField` on the item (object arrays) as an optimistic-
 * concurrency check before removing.
 */
export async function removeArrayItem(
  stepId: string,
  field: string,
  index: number,
  oldValue: string,
  compareField?: string,
): Promise<ArrayEditResult> {
  try {
    const res = await fetch('/api/edit-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'array-remove', stepId, field, index, oldValue, compareField: compareField ?? null }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? `Remove failed (${res.status})` }
    return data
  } catch {
    return { ok: false, error: 'Could not reach the local edit-script endpoint — is `npm run dev` running?' }
  }
}
