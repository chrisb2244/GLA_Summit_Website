#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# create-epic-issues.sh
#
# Creates GitHub issues for the "Presentation Submission System Improvements"
# epic and then creates an epic tracking issue that links them all.
#
# PREREQUISITES
#   gh auth login        (authenticate the GitHub CLI with a token that has
#                         repo:issues write permission)
#   gh --version ≥ 2.x
#
# USAGE
#   cd <repo-root>
#   bash scripts/create-epic-issues.sh
#
# The script is idempotent-ish: it checks for a matching title before
# creating each issue.  Running it twice will not create duplicates as
# long as the titles remain unchanged.
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="chrisb2244/GLA_Summit_Website"
EPIC_LABEL="epic"

# ---------------------------------------------------------------------------
# Helper: create a label if it doesn't already exist
# ---------------------------------------------------------------------------
ensure_label() {
  local name="$1" colour="$2" description="$3"
  if ! gh label list --repo "$REPO" --json name --jq ".[].name" | grep -qx "$name"; then
    gh label create "$name" --repo "$REPO" --color "$colour" --description "$description"
    echo "Created label: $name"
  else
    echo "Label already exists: $name"
  fi
}

# ---------------------------------------------------------------------------
# Helper: create an issue only if no open issue with that title exists.
# Echoes the issue number of the existing or newly created issue.
# ---------------------------------------------------------------------------
create_issue_once() {
  local title="$1" body="$2" labels="$3"

  existing=$(gh issue list --repo "$REPO" --state open \
    --json number,title \
    --jq ".[] | select(.title == \"$title\") | .number" 2>/dev/null | head -1)

  if [[ -n "$existing" ]]; then
    echo "Issue already exists (#$existing): $title" >&2
    echo "$existing"
    return
  fi

  local label_args=()
  IFS=',' read -ra label_list <<< "$labels"
  for lbl in "${label_list[@]}"; do
    lbl=$(echo "$lbl" | xargs)   # trim whitespace
    [[ -n "$lbl" ]] && label_args+=(--label "$lbl")
  done

  number=$(gh issue create --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    "${label_args[@]}" \
    --json number --jq '.number')

  echo "Created issue #$number: $title" >&2
  echo "$number"
}

# ---------------------------------------------------------------------------
# Ensure required labels exist
# ---------------------------------------------------------------------------
ensure_label "epic"        "8B00FF" "Epic tracking issue"
ensure_label "enhancement" "84b6eb" "New feature or request"
ensure_label "bug"         "d73a4a" "Something isn't working"

# ---------------------------------------------------------------------------
# ISSUE 1 – Restore draft saving
# ---------------------------------------------------------------------------
N1=$(create_issue_once \
  "Restore draft saving: isFinal is hardcoded to 'on'" \
  "$(cat <<'EOF'
## Problem

The draft-saving feature was present in the `old_pages` code but has been removed in the current Next.js App Router rewrite.
In `PresentationSubmissionForm.tsx` the `isFinal` value is hardcoded via a hidden input (`<input type="hidden" name="isFinal" value="on" />`), so every submission is treated as a final submission.
The `Checkbox` component that allowed toggling draft vs. final was commented out.

## Tasks

- [ ] Restore the `isFinal` checkbox in `PresentationSubmissionForm`
- [ ] Update `submitNewPresentation` action to differentiate draft from final state
- [ ] Use a separate email template (or skip email) when saving a draft rather than a final submission
- [ ] Add `CAN_SUBMIT_DRAFT` config constant analogous to `CAN_SUBMIT_PRESENTATION`

## Related

- Blocked by / related to #3 (draft list UI) and #4 (delete draft)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 2 – Allow editing of submitted presentations
# ---------------------------------------------------------------------------
N2=$(create_issue_once \
  "Allow submitters to edit their submitted presentations" \
  "$(cat <<'EOF'
## Problem

Once a presentation is submitted (`is_submitted = true`), there is no way to edit it.
The old `PresentationEditor` component in `old_pages/` showed a locked view for submitted presentations but had no edit path.

Submitters should be able to edit the title, abstract, learning points, and presentation type until a configurable deadline.

## Tasks

- [ ] Add a server action `updatePresentationSubmission(presentationId, data)` — callable only by the `submitter_id` owner
- [ ] Render an editable form for submitted presentations in the My Presentations page
- [ ] Consider a configurable edit deadline (see #60 for deadline discussion)
- [ ] Send email notification to all co-presenters when content is meaningfully updated

## Notes

The `presentation_submissions` table already has the necessary columns; only the server action and UI are missing.
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 3 – Show draft list on My Presentations page
# ---------------------------------------------------------------------------
N3=$(create_issue_once \
  "Restore draft presentation list on My Presentations page" \
  "$(cat <<'EOF'
## Problem

The draft section in `src/app/my-presentations/page.tsx` is entirely commented out.
When draft saving is restored (see #1), users will have no way to view or manage their drafts.

## Tasks

- [ ] Uncomment and restore the draft list section in `page.tsx`
- [ ] Display each draft with: title, presentation type, last-updated timestamp
- [ ] Link each draft entry to an editable view

## Depends On

- #1 (Restore draft saving)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 4 – Delete Draft functionality
# ---------------------------------------------------------------------------
N4=$(create_issue_once \
  "Add 'Delete Draft' capability for presentation drafts" \
  "$(cat <<'EOF'
## Problem

The old `PresentationEditor` component included a "Delete Draft" button, but no equivalent exists in the current codebase.
The `deletePresentation` function exists in `lib/databaseFunctions.ts` but there is no UI or server action that exposes it to users.

## Tasks

- [ ] Add a `deleteDraftPresentation` server action callable only by the `submitter_id` owner
- [ ] Add a "Delete Draft" button to the draft editor UI
- [ ] Show a confirmation dialog before deletion
- [ ] On deletion, notify co-presenters via email that the draft has been removed

## Depends On

- #1 (Restore draft saving), #3 (Draft list UI)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 5 – Co-presenter opt-out link in invitation email
# ---------------------------------------------------------------------------
N5=$(create_issue_once \
  "Add opt-out / decline link for co-presenters in invitation email" \
  "$(cat <<'EOF'
## Problem

When a user is added as a co-presenter they receive an invitation email, but there is no mechanism to decline or opt out without contacting the organizers manually.
The old `EmailToNewOtherPresenter` template mentioned "contact web@glasummit.org" as a workaround — this should be an automated action.

## Tasks

- [ ] Add a signed/tokenized opt-out URL (e.g. `/api/copresenter-optout/[token]`) to both existing-user and new-user invitation emails
- [ ] Implement the `/api/copresenter-optout/[token]` route:
  - Validate the token (HMAC or JWT with expiry)
  - Remove the user from `presentation_presenters`
  - Notify the primary submitter (see #9)
  - Show a confirmation page
- [ ] Store opt-out tokens in a new `copresenter_invite_tokens` table or embed all data in a self-validating JWT

## Related

- #9 (Notify submitter when co-presenter opts out)
- #7 (Accept/decline flow)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 7 – Accept/decline flow for co-presenter invitations
# ---------------------------------------------------------------------------
N7=$(create_issue_once \
  "Add explicit accept/decline flow for co-presenter invitations" \
  "$(cat <<'EOF'
## Problem

Being added as a co-presenter is currently implicit: an email is sent and the user appears as a co-presenter immediately, without any confirmation step.
This differs from most conference submission systems (HotCRP, EasyChair, Google Scholar co-authorship) where the invitee must explicitly accept.

## Tasks

- [ ] Add a `status` column to `presentation_presenters` (e.g. `pending` | `accepted` | `declined`)
- [ ] Default new co-presenter entries to `pending`
- [ ] Invitation email links to an accept/decline page at `/copresenter-invite/[token]`
- [ ] On accept: set status to `accepted`, notify primary submitter
- [ ] On decline: set status to `declined` (or delete row), notify primary submitter (overlaps with #5)
- [ ] My Presentations view shows pending/confirmed/declined status for each co-presenter
- [ ] Accepted-only presenters appear on the public presenters page

## Related

- #5 (Opt-out link), #9 (Submitter notification)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 8 – Show co-presenter names at submission time
# ---------------------------------------------------------------------------
N8=$(create_issue_once \
  "Display resolved co-presenter names (not just emails) in submission form" \
  "$(cat <<'EOF'
## Problem

The submission form only collects email addresses for co-presenters.
After submission, emails are resolved to names via the `profiles` table for the confirmation email, but the submitter never sees the resolved names in the UI.
A submitter adding someone they don't know personally cannot verify they've added the right person.

## Tasks

- [ ] After a co-presenter email field is blurred, query `/api/resolve-presenter?email=...` to check if the email matches an existing account
- [ ] If found: display the account's `firstname lastname` alongside the email field
- [ ] If not found: display "New account will be created"
- [ ] In the submitted presentations list, show full names next to each co-presenter email

## Notes

Use the existing `email_lookup` view for the lookup.
The query should be rate-limited / debounced to avoid excessive DB calls.
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 9 – Notify submitter when co-presenter opts out
# ---------------------------------------------------------------------------
N9=$(create_issue_once \
  "Notify primary submitter via email when a co-presenter removes themselves" \
  "$(cat <<'EOF'
## Problem

When a co-presenter opts out or is removed (via the opt-out link in #5 or by an organizer), the primary submitter has no way of knowing unless they manually check the My Presentations page.

## Tasks

- [ ] Add email sending to the copresenter opt-out handler (see #5)
- [ ] Email content: name/email of the co-presenter who opted out, presentation title, link to edit the presentation
- [ ] Also trigger this notification when an organizer removes a co-presenter

## Related

- #5 (Opt-out link), #7 (Accept/decline flow)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 10 – Speaker agreement checkbox
# ---------------------------------------------------------------------------
N10=$(create_issue_once \
  "Add speaker agreement / recording consent checkbox to submission form" \
  "$(cat <<'EOF'
## Problem

The presentation submission form has no terms or consent acknowledgement.
Most conference submission systems require presenters to acknowledge:
- Consent to record and share the session
- Agreement to the code of conduct
- Consent to have their name, bio, and photo published on the website

## Tasks

- [ ] Add a mandatory boolean checkbox to the submission form:
  *"I agree to the GLA Summit speaker agreement, consent to my session being recorded, and consent to my name/bio/photo being published on the conference website."*
- [ ] Link the label to a `/speaker-agreement` page (new page, or link to existing CoC)
- [ ] Block form submission if the checkbox is unchecked
- [ ] Store a `consent_given_at` timestamp on the submission row

## Notes

The speaker agreement page itself is out of scope for this issue.
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 12 – Automated status-change notification emails
# ---------------------------------------------------------------------------
N12=$(create_issue_once \
  "Send automated notification emails when presentation status changes (accepted/declined)" \
  "$(cat <<'EOF'
## Problem

When a presentation moves to "Accepted" (row inserted in `accepted_presentations`) or "Withdrawn/Declined" (row inserted in `rejected_presentations`), no automated email is sent to the submitter or co-presenters.
Currently organizers must email presenters manually.

Additionally, the route `/api/confirm-presentation/[id]` exists to let submitters confirm a timeslot, but no email containing this link is ever generated.

## Tasks

- [ ] Add a Supabase database webhook (or a Next.js server action triggered from the review UI) on `accepted_presentations` INSERT
- [ ] Send acceptance email to submitter + all co-presenters:
  - Congratulations message, presentation details
  - Link to `/api/confirm-presentation/[id]` for timeslot confirmation
  - Reminder to update bio/profile photo (see #19)
- [ ] Add equivalent trigger for `rejected_presentations` INSERT
- [ ] Send decline/withdrawal notification email
- [ ] Guard against sending duplicate emails (idempotency check)

## Related

- Issue #7 (Request information from submitters when confirmed as presenters) — closely related
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 14 – Prevent duplicate submissions
# ---------------------------------------------------------------------------
N14=$(create_issue_once \
  "Add duplicate submission detection and prevention" \
  "$(cat <<'EOF'
## Problem

There is no check to prevent a user from submitting the same presentation multiple times in the same summit year (e.g., accidentally re-submitting the same title).

## Tasks

- [ ] Before inserting a new `presentation_submissions` row, check whether the same `submitter_id` already has an entry with the same `title` for the same `year`
- [ ] If a potential duplicate is found, show a non-blocking warning with a link to the existing submission
- [ ] Consider adding a unique partial index at the DB level: `UNIQUE (submitter_id, LOWER(title), year) WHERE is_submitted = TRUE`
- [ ] Add test coverage for this validation (unit + E2E)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 17 – A/V and special requirements field
# ---------------------------------------------------------------------------
N17=$(create_issue_once \
  "Add A/V and special requirements field to presentation submission form" \
  "$(cat <<'EOF'
## Problem

There is no field for presenters to indicate special technical or accessibility requirements.
This information is needed by conference organisers for scheduling and logistics.

## Tasks

- [ ] Add an optional "Special Requirements" textarea to the submission form
  - Example placeholder: *"I will be doing a live demo that requires a stable connection. I prefer not to present in the first session."*
- [ ] Add a `special_requirements TEXT` column to `presentation_submissions`
- [ ] Include `special_requirements` in the organizer review export (ZIP download in `review-submissions/actions.ts`)
- [ ] Include in the submission confirmation email

## Notes

This field is optional — it should not block submission if left empty.
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 18 – Allow withdrawal of submitted presentations
# ---------------------------------------------------------------------------
N18=$(create_issue_once \
  "Allow submitters to withdraw a submitted presentation" \
  "$(cat <<'EOF'
## Problem

Once a presentation is submitted (`is_submitted = true`), the submitter has no way to withdraw it without contacting the organizers.

## Tasks

- [ ] Add a server action `withdrawPresentation(presentationId)` — callable only by the `submitter_id` owner
- [ ] Add a "Withdraw Presentation" button to the submitted presentations list in My Presentations
- [ ] Show a confirmation dialog that explains the action and whether it is reversible
- [ ] On withdrawal:
  - Set `is_submitted = false` (or insert into `rejected_presentations` with a `withdrawn` reason)
  - Notify organizers via email
  - Notify all co-presenters via email
- [ ] Consider a deadline after which withdrawal is blocked (aligned with #60)

## Related

- #2 (Edit submitted presentations), #60 (Deadlines)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 19 – Prompt for profile completion after submission
# ---------------------------------------------------------------------------
N19=$(create_issue_once \
  "Prompt submitters to complete their profile (bio + photo) after submission" \
  "$(cat <<'EOF'
## Problem

The submission form does not prompt users to ensure their profile (bio + photo) is complete.
These are required for the conference programme and the public presenters page.
New submitters may not know they need to update their profile separately at `/my-profile`.

## Tasks

- [ ] After a successful form submission, display a call-to-action banner:
  *"Don't forget to update your bio and profile photo at My Profile — these will be shown in the conference programme."*
- [ ] On the My Presentations page, if the logged-in user's profile has an empty bio or no avatar, show a persistent banner
- [ ] Consider: send a follow-up email reminder if the profile is still incomplete N days after submission

## Related

- #12 (Status notification emails — acceptance email should also include this prompt)
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# ISSUE 20 – Downloadable submission receipt
# ---------------------------------------------------------------------------
N20=$(create_issue_once \
  "Provide a downloadable / printable submission receipt" \
  "$(cat <<'EOF'
## Problem

After submission, presenters receive an HTML confirmation email but have no way to download a copy of their submission details from the website.

## Tasks

- [ ] Add a "Download submission details" button on each submitted presentation entry in My Presentations
- [ ] The download should generate a plain-text (or simple PDF) file containing:
  - Title, abstract, learning points, presentation type
  - Co-presenter emails
  - Submission timestamp
  - Submission ID (for reference when contacting organizers)
- [ ] The file should be generated client-side (or via a lightweight API route) to avoid storing files on the server

## Notes

This is a nice-to-have; prioritise the other issues first.
EOF
)" \
  "enhancement")

# ---------------------------------------------------------------------------
# EPIC tracking issue
# ---------------------------------------------------------------------------
EPIC_BODY=$(cat <<EOF
## Overview

This epic tracks all planned improvements to the GLA Summit presentation submission workflow, co-presenter management, and related email notifications.

Items were identified by comparing the current Next.js App Router implementation against the \`old_pages/\` code and common patterns from major online conference submission systems (PyCon, HotCRP, EasyChair, Strange Loop).

---

## 🔧 Regressed Features *(present in old_pages, missing in current codebase)*

- [ ] #${N1} — Restore draft saving: isFinal is hardcoded to 'on'
- [ ] #${N2} — Allow submitters to edit their submitted presentations
- [ ] #${N3} — Restore draft presentation list on My Presentations page
- [ ] #${N4} — Add 'Delete Draft' capability for presentation drafts

---

## 👥 Co-Presenter Behaviours

- [ ] #${N5} — Add opt-out / decline link for co-presenters in invitation email
- [ ] #47 — Removing co-presenters doesn't work correctly *(existing issue)*
- [ ] #${N7} — Add explicit accept/decline flow for co-presenter invitations
- [ ] #${N8} — Display resolved co-presenter names in submission form
- [ ] #${N9} — Notify primary submitter when a co-presenter opts out

---

## 🗓️ Missing Conference Submission System Features

- [ ] #${N10} — Add speaker agreement / recording consent checkbox
- [ ] #60 — Clearer information to presenters (submission deadline, decision date) *(existing issue)*
- [ ] #${N12} — Send automated notification emails when presentation status changes
- [ ] #31 — Indicate timezones / availability windows for presenters *(existing issue)*
- [ ] #${N14} — Add duplicate submission detection and prevention
- [ ] #${N17} — Add A/V and special requirements field to submission form
- [ ] #${N18} — Allow submitters to withdraw a submitted presentation
- [ ] #${N19} — Prompt submitters to complete their profile after submission
- [ ] #${N20} — Provide a downloadable / printable submission receipt

---

## Suggested Implementation Order

1. #${N1} (draft saving) → #${N3} (draft list) → #${N4} (delete draft)
2. #47 (remove co-presenter fix) → #${N5} (opt-out link) → #${N9} (submitter notification)
3. #${N12} (status-change emails, including the confirm-presentation link)
4. #${N10} (speaker agreement)
5. #${N2} (edit submitted), #${N18} (withdrawal)
6. #${N7} (accept/decline flow), #${N8} (name resolution)
7. #31 (timezone preferences), #${N14} (duplicate prevention)
8. #${N19} (profile prompt), #${N17} (A/V requirements), #${N20} (receipt download)
EOF
)

EPIC_NUM=$(create_issue_once \
  "[Epic] Presentation Submission System Improvements" \
  "$EPIC_BODY" \
  "epic,enhancement")

echo ""
echo "========================================================"
echo "Epic created: #${EPIC_NUM}"
echo "  https://github.com/${REPO}/issues/${EPIC_NUM}"
echo "========================================================"
