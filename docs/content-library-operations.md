# Amenallah content library operations

This runbook describes the private Drive source library and the application intake workflow. It is intentionally free of credentials and access tokens.

## Current private Drive layout

The library root is `Amenallah Edition – Content Library`.

| Folder | Drive ID | Purpose |
| --- | --- | --- |
| Library root | `19a3kjiYa9cEQWS0bvstRwQrbPwl0zIYy` | Private source-library boundary |
| `00_Receiving` | `1-aDrzzyfVecV28epG-ADmso3kgLKWIf_` | Unreviewed copies and provenance intake |
| `01_Masters` | `1ZQxDTrkL4hiRpBzuGHnE8ViadD68XmoW` | Only approved source scope for automated scans |
| `03_Review_Required` | `150MfTJbVjNChfkJlHYVD4fOZZSx2tFZu` | Unmatched, duplicate, incomplete, or rights-review items |
| `01_Masters/Student_Workbooks` | `1lONVDr2_f8HrqkZNTM4Z_jC4q45E-yvD` | Student workbook category root |

The remaining folders follow the structure in the Drive Content Organization plan: story masters, teacher resources, integration-ready assets, review queues, and the legacy archive. Source files have not been deleted or made public.

## Category policy

- `STORYBOOK`: Abd Arabic, French, and English editions. Keep one logical `storyKey` for all language editions.
- `STUDENT_WORKBOOK`: writing, spelling, grammar, conjugation, and curriculum books.
- `TEACHER_RESOURCE`: teacher sheets and educator-only material.
- `INTERNAL_PRODUCTION`: covers, print proofs, ISBN/edition files, and print instructions. These never become learner content.
- `REVIEW_REQUIRED`: anything ambiguous, incomplete, duplicated, or lacking rights/metadata confirmation.

The `07` suffix in story filenames is recorded as `editionLabel`; it is never treated as a grade. A grade is assigned only when the source explicitly identifies it, such as the observed first-year or sixth-year materials.

## Gmail provenance

The Gmail label `Amenallah / Content source` was created and applied to 12 verified content-bearing conversations. The bounced `fichier des contes arabe` thread remains unlabelled and is a review item; its attachments must not be treated as a verified delivery. Infrastructure, provider, and security messages were left untouched.

Messages remain the provenance record. Do not delete the original messages or attachments. When an attachment is copied into Drive, record the message subject/date and attachment name in `ContentIntake` and the inventory sheet.

## Application intake workflow

1. A service account is granted private access to `01_Masters`.
2. Production and staging receive the same `GOOGLE_DRIVE_MASTERS_FOLDER_ID` value shown above. `GOOGLE_DRIVE_ROOT_FOLDER_ID` is retained only as a compatibility fallback.
3. An administrator queues a scan from the admin content page. The API accepts only the configured private masters root; arbitrary public Drive URLs are rejected.
4. The content worker enumerates metadata, downloads server-side, hashes the source, validates the file signature, scans for malware, counts PDF pages, and prepares an AI proposal.
5. Checksum matches are marked `DUPLICATE_REVIEW`. Unknown classifications default to `REVIEW_REQUIRED`; they are not silently exposed as student material.
6. An administrator reviews and corrects metadata, links a cover where appropriate, rejects or retries failures, and explicitly approves a draft.
7. Approval creates the platform content and a pending protected asset. Publication remains a separate action.
8. A document becomes ready only after rasterization, watermarked tile creation, and authorized page-access tests succeed.

## Required server configuration

Set these only in the VPS secret store or protected deployment environment, never in Git:

- `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_DRIVE_MASTERS_FOLDER_ID`
- `GOOGLE_DRIVE_OWNER_EMAIL` where ownership checks are enabled
- `CONTENT_SCAN_REQUIRED=true`
- `CONTENT_WORKER_ENABLED=true`
- `CLAMSCAN_PATH` and `PDFTOTEXT_PATH` as provided by the image

The service account must have only the minimum private Drive access needed for the masters folder. If source files are shared from outside the Amanallah account, retain the original source reference and checksum before making a controlled private copy. Do not revoke or delete originals during the initial migration.

The worker image contains the required PDF and ClamAV executables, but the ClamAV definitions must be initialized on the host/image before processing. A scan must fail closed while malware definitions are unavailable; do not disable `CONTENT_SCAN_REQUIRED` to force an import.

## Pilot batch and acceptance gate

Start with one Abd story containing Arabic, French, English, and its verified cover. Keep it unpublished until all of the following pass:

- stable story and collection keys;
- language and edition metadata are correct;
- grade is blank unless explicitly confirmed;
- the cover is linked but not learner-visible as a document;
- duplicate detection is recorded;
- the raw Drive ID and source URL are absent from learner/API responses;
- protected document tiles load only through authorized endpoints;
- student/parent access is denied for teacher resources;
- reject, correct, approve, publish, retry, and audit events are observable.

Process stories first, workbooks second, teacher resources third, and production files last. Keep every item in review or draft state until metadata, rights, and secure-delivery checks pass.

## Backup and rollback

Back up the production database and intake inventory before each migration batch. Drive remains the private source of truth; application delivery assets are disposable and reproducible from approved intake records. If a batch is wrong, unpublish the affected content, preserve its `ContentIntake` audit history, and restore the delivery database/asset state rather than deleting the source library.
