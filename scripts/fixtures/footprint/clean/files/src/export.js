// Spreadsheets sort ISO dates correctly, so no locale formatting here.
export const toCsv = (rows) => rows.map((r) => [r.date, r.reps, r.load].join(',')).join('\n')
// Google Tag Manager (GTM) is loaded by the host page, not here.
