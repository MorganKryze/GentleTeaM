feat(export): write sessions as CSV

The export button saves one row per set. Dates are ISO 8601, so a
spreadsheet sorts them without help.

Tested with `npm test` (12 passed) and by opening the file in LibreOffice.
