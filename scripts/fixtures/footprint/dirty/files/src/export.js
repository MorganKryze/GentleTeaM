// See .gtm/plans/csv.md for the plan; we leverage the shared writer.
export const toCsv = (rows) => rows.map((r) => [r.date, r.reps, r.load].join(',')).join('\n') // — not a comment line
const note = 'no tell in code: robust'
