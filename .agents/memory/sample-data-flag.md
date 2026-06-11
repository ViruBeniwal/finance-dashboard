---
name: sample-data flag lifecycle
description: How the seeded/isSampleData meta flag must behave across mutations
---

The `meta.seeded` flag (surfaced as `Summary.isSampleData`) means "the current data set is unmodified seeded sample data."

**Rule:** any user mutation that changes the data set must flip the flag to false, not just delete-all. That includes create/update/delete/bulk-delete transaction AND budget upsert. Seeding sets it true; delete-all clears the row so a subsequent reseed restores true.

**Why:** a prior code review rejected the build because the banner kept claiming sample data after the user edited rows — the flag was only cleared on delete-all.

**How to apply:** call the shared `clearSeededFlag()` helper at the end of every data-changing route handler. If you add a new mutation route, wire it in too.
