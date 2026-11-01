# Data privacy and GDPR compliance in software

> Helps a delivery team build and change software that processes personal data so that it meets the
> GDPR and can prove it.

## When it applies
- A change adds, copies, shares, logs, exports or deletes data about an identifiable person.
- A new store, integration, analytics event, third-party component or recipient touches personal
  data.
- Retention, erasure or pseudonymisation is being designed, or a breach is handled or rehearsed.
- A processing may be high risk: profiling with significant effects, sensitive data at scale,
  large-scale systematic monitoring of a publicly accessible area.

## Method
1. Inventory each personal-data field next to the code: store, category, purpose, legal basis,
   recipients, retention. Derive the record of processing from it.
2. Draw the data flows of the change, including logs, caches, analytics, exports, backups and
   processors.
3. Review privacy threats on that diagram: linking, identifying, non-repudiation, detecting, data
   disclosure, unawareness, non-compliance. Screen the high-risk triggers. If high risk is likely,
   complete the impact assessment before processing starts.
4. Default to the minimum: only the data each purpose needs, the narrowest processing, the shortest
   retention, the fewest people with access.
5. Pseudonymise with a secret kept apart under restricted access. Inside your perimeter, the result
   is still personal data.
6. Before treating shared data as non-personal for a recipient, write down whether that recipient
   has means reasonably likely to re-identify. Name recipients to people at collection.
7. Build retention and erasure as tested features that reach derived stores and backups. Never
   present pseudonymisation or weak anonymisation as deletion.
8. Document every breach, and be able to notify the authority within 72 hours of becoming aware of
   it, unless it is unlikely to result in a risk.
9. Keep current law apart from pending proposals. Change behaviour only once a text is adopted.
10. Record where every store, processor and sub-processor sits and from which countries it can be
    reached. Making data available to another entity outside the EEA, by sending it, hosting it
    there or letting it be reached remotely, is a transfer, and so is each onward transfer. Each
    needs an adequacy decision, or a safeguard such as standard contractual clauses backed by a
    transfer impact assessment made before the data moves, or, failing both, a derogation for a
    specific situation.
11. Write or read nothing on a person's device, whether cookies, pixels, local storage, device
    identifiers or fingerprinting, before they consent, unless it is strictly necessary for the
    service they asked for. This holds even when the information is not personal data. Make refusing
    as simple as accepting, keep proof of each consent, and make withdrawing as easy as giving.
12. Build access as a documented, tested feature: from one identifier, gather what every declared
    store holds about a person, pseudonymised data included, and hand over a copy in a commonly used
    electronic form within one month.

## Reflexes
- Could this value be tied back to a person, by us or by a recipient, with means reasonably likely
  to be used?
- Does the stated purpose need this field, or is it merely convenient?
- Where else does this value land: logs, caches, analytics, exports, backups, training sets?
- When is it deleted, by what, and has that path been tested?
- Does this change hit a high-risk trigger that calls for an impact assessment?
- Is this guidance binding, older than the latest case law, or a pending proposal?
- Which country does this data sit in, and can anyone outside the EEA reach it, sub-processors
  included?
- Does this write or read anything on the person's device before they have chosen?

## What is measured
- Inventory completeness: schema fields marked personal that lack a declared purpose, legal basis or
  retention. A `verify` step fails on any.
- Retention: records older than their declared retention, per store. A scheduled `verify` step fails
  above zero.
- Erasure: an end-to-end test erases a synthetic person, then searches every declared store.
  `verify` fails on any trace outside written exceptions. Backups are checked by procedure, not by
  this test.
- Direct identifiers in event and log schemas: a count. A `verify` step fails above zero.
- Breach register: entries missing facts, effects or remedies. A `verify` step fails on any.
- Breach drill: time from detection to a notification-ready file, at most 72 hours. Measured per
  drill, outside the pipeline.
- Transfers: stores, processors and sub-processors with no recorded location, or with a location
  outside the EEA and no recorded transfer tool. A `verify` step fails on any. The transfer impact
  assessment stays judgment.
- Device access before consent: items written or read in a fresh session or install before any
  choice, outside a declared strictly-necessary list. A `verify` step fails above zero.
- Access: an end-to-end test requests a copy for a synthetic person seeded in every declared store.
  `verify` fails on any store missing from the copy.
- Judgment, no gate: threat reviews, impact assessments, choice of legal basis, identifiability of
  shared data, adequacy of retention periods.

## Sources
- [GDPR Chapter IV, CNIL
  edition](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4), 2026-11-01:
  Articles 25, 30, 32, 33 and 35.
- [CNIL developer GDPR guide](https://www.cnil.fr/fr/guide-rgpd-du-developpeur), 2026-11-01: flow
  diagrams, minimisation, retention phases.
- [LINDDUN](https://linddun.org/), 2026-11-01: privacy threat categories.
- [Meta Engineering on data
  lineage](https://engineering.fb.com/2025/01/22/security/how-meta-discovers-data-flows-via-lineage-at-scale/),
  2026-11-01: inventory before lineage, measuring coverage.
- [EDPB on the right to
  erasure](https://www.edpb.europa.eu/news/edpb-identifies-challenges-hindering-the-full-implementation-of-the-right-to-erasure_en),
  2026-11-01: recurring erasure challenges.
- [EDPB adopts pseudonymisation
  guidelines](https://edpb.europa.eu/news/news/2025/edpb-adopts-pseudonymisation-guidelines-and-paves-way-improve-cooperation_en),
  2026-11-01: additional information kept apart.
- [Clifford Chance on EDPS v
  SRB](https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2025/09/pseudonymized-data-after-edps-v-srb.html),
  2026-11-01: identifiability judged per holder.
- [EDPB and EDPS on the Digital
  Omnibus](https://www.edpb.europa.eu/news/digital-omnibus-edpb-and-edps-support-simplification-and-competitiveness-while-raising-key_en),
  2026-11-01: positions on the proposed changes.
- [European Parliament procedure
  2025/0360](https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0360%28COD%29),
  2026-11-01: not adopted, still at committee stage.
- [NicFab on the Council mandate](https://www.nicfab.eu/en/posts/digital-omnibus-council/),
  2026-11-01: Council position, 96 hours.
- [GDPR Chapter V, CNIL
  edition](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre5), 2026-11-01:
  Articles 44 to 46, onward transfers, adequacy decisions and appropriate safeguards.
- [CNIL on transfer impact assessments](https://www.cnil.fr/en/node/166593), 2026-11-01: assessment
  by the exporter before an Article 46 transfer, none under adequacy.
- [DLA Piper on EDPB Guidelines
  05/2021](https://privacymatters.dlapiper.com/2023/03/eu-final-version-of-the-edpb-guidelines-05-2021-on-the-interplay-between-the-application-of-art-3-and-the-provisions-on-international-transfers-as-per-chapter-v-of-the-gdpr/),
  2026-11-01: transfer criteria, remote access and cloud storage outside the EEA.
- [CNIL on cookies and other
  trackers](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite),
  2026-11-01: consent before writing or reading trackers, strictly necessary exemption, refusing as
  simple as accepting, withdrawal at any time.
- [Hunton on EDPB Guidelines
  2/2023](https://hunton.com/privacy-and-information-security-law/edpb-adopts-guidelines-on-scope-of-eprivacy-directive),
  2026-11-01: device rule not limited to personal data, pixel tracking and unique identifiers among
  the use cases addressed.
- [GDPR Chapter II, CNIL
  edition](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2), 2026-11-01:
  Article 7, proof and withdrawal of consent.
- [GDPR Chapter III, CNIL
  edition](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3), 2026-11-01:
  Articles 12 and 15, answer within one month, copy in a commonly used electronic form.
- [EDPB on the 2024 right of access
  action](https://www.edpb.europa.eu/news/news/2025/cef-2024-edpb-identifies-challenges-full-implementation-right-access_en),
  2026-11-01: undocumented access procedures among the challenges identified.
- [Sidley on the EDPB access
  report](https://datamatters.sidley.com/2025/02/18/edpb-adopts-report-on-gdpr-right-of-access-following-2024-coordinated-enforcement-action/),
  2026-11-01: searches too narrow, pseudonymised data left out.
