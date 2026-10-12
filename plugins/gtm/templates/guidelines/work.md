# Work guideline: priority, epics and stories, definition of done

> When to read: analyst (track and priority), architect (stories into specs and tasks), final
> reviewer and ship (done).

## Priority
| Level | Meaning | Response |
| --- | --- | --- |
| P0 | broken for users, data at risk or a security hole | now, as a Fix if it fits |
| P1 | blocks the next release or a core path | this cycle |
| P2 | valuable, planned | when its epic comes |
| P3 | nice to have | when idle, or dropped |

## Epics and stories
- An **epic** is a Milestone or a group of Features. A **story** is one user-visible outcome with
  acceptance lines; a bug is a story of type bug.
- A story is delivered by one track: a Fix or a Feature. Its acceptance lines become the spec's EARS
  lines; the plan's tasks are how it is built, not stories.
- `<root>/backlog.md` lists epics, their stories, each with priority and status (todo, doing,
  done, dropped). `/gtm:gtm` adds or updates the story; `/gtm:ship` marks it done.

## Definition of done
| Track | Done when |
| --- | --- |
| Fix | a test proves it; gate green; reviewer clean; lesson in the ledger if any; the human's go |
| Feature | every EARS line tested; tasks clean; final review ready; docs updated; ledger `run` line; backlog updated; the human's go |
| Milestone | every sub-feature done; final review per branch; release notes; retro run |
