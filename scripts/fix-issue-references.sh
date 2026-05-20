#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# fix-issue-references.sh
#
# After create-epic-issues.sh has run, the individual issue bodies contain
# cross-references like "#1", "#3", "#7" etc. that match the *sequential*
# order in which the issues were written in that script — not the actual
# GitHub issue numbers assigned at creation time.
#
# This script:
#   1. Looks up each created issue by its exact title to find its real number.
#   2. Builds a map:  sequential-number → actual-GitHub-number
#   3. Rewrites every affected issue body, replacing #SEQ with #ACTUAL.
#
# Existing-issue references that were already correct (#31, #47, #60 …) are
# not in the sequential map and are left untouched.
#
# PREREQUISITES
#   gh auth login   (token needs repo:issues write permission)
#   perl            (standard on macOS/Linux)
#
# USAGE
#   cd <repo-root>
#   bash scripts/fix-issue-references.sh
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="chrisb2244/GLA_Summit_Website"

TMPFILE=$(mktemp /tmp/issue-body-XXXXXX)
trap 'rm -f "$TMPFILE"' EXIT

# ---------------------------------------------------------------------------
# Look up a GitHub issue by its exact title.
# Searches open issues first; falls back to all states.
# Echoes the issue number, or an empty string if not found.
# ---------------------------------------------------------------------------
lookup_issue() {
  local title="$1"
  local num

  num=$(gh issue list --repo "$REPO" --state open --limit 500 \
    --json number,title \
    --jq ".[] | select(.title == \"$title\") | .number" 2>/dev/null | head -1)

  if [[ -z "$num" ]]; then
    num=$(gh issue list --repo "$REPO" --state all --limit 500 \
      --json number,title \
      --jq ".[] | select(.title == \"$title\") | .number" 2>/dev/null | head -1)
  fi

  echo "$num"
}

# ---------------------------------------------------------------------------
# Map: sequential key (as used in cross-references inside issue bodies)
#       → exact title used in create-epic-issues.sh
# ---------------------------------------------------------------------------
declare -A TITLES

TITLES[1]="Restore draft saving: isFinal is hardcoded to 'on'"
TITLES[2]="Allow submitters to edit their submitted presentations"
TITLES[3]="Restore draft presentation list on My Presentations page"
TITLES[4]="Add 'Delete Draft' capability for presentation drafts"
TITLES[5]="Add opt-out / decline link for co-presenters in invitation email"
TITLES[7]="Add explicit accept/decline flow for co-presenter invitations"
TITLES[8]="Display resolved co-presenter names (not just emails) after invitation is accepted"
TITLES[9]="Notify primary submitter via email when a co-presenter removes themselves"
TITLES[10]="Add speaker agreement / recording consent checkbox to submission form"
TITLES[12]="Send automated notification emails when presentation status changes (accepted/declined)"
TITLES[14]="Add character count indicators to submission form text fields"
TITLES[17]="Add duplicate submission detection and prevention"
TITLES[18]="Allow submitters to withdraw a submitted presentation"
TITLES[19]="Prompt submitters to complete their profile (bio + photo) after submission"
TITLES[20]="Provide a downloadable / printable submission receipt"

EPIC_TITLE="[Epic] Presentation Submission System Improvements"

# ---------------------------------------------------------------------------
# Resolve all titles → actual GitHub issue numbers
# ---------------------------------------------------------------------------
echo "Resolving issue numbers by title…"

declare -A MAP  # MAP[seq]=actual

for seq in $(echo "${!TITLES[@]}" | tr ' ' '\n' | sort -n); do
  actual=$(lookup_issue "${TITLES[$seq]}")
  if [[ -z "$actual" ]]; then
    echo "  WARNING: could not find issue for sequential #${seq}: ${TITLES[$seq]}" >&2
  else
    MAP[$seq]=$actual
    printf "  #%-3s → #%-6s  %s\n" "$seq" "$actual" "${TITLES[$seq]}"
  fi
done

EPIC_NUM=$(lookup_issue "$EPIC_TITLE")
echo "  Epic  → #${EPIC_NUM}"
echo ""

# ---------------------------------------------------------------------------
# Build a perl snippet that holds the mapping as a hash.
# The replacement:
#   #N  →  #ACTUAL   when N is a key in the map
#   #N  →  #N        otherwise  (preserves #31, #47, #60 …)
# Uses a negative lookahead (?!\d) so that "#1" never matches inside "#12".
# ---------------------------------------------------------------------------
PERL_HASH="my %map = ("
first=1
for seq in "${!MAP[@]}"; do
  [[ $first -eq 0 ]] && PERL_HASH+=", "
  PERL_HASH+="${seq} => ${MAP[$seq]}"
  first=0
done
PERL_HASH+=");"

PERL_PROG="${PERL_HASH} s/#(\d+)(?!\d)/exists \$map{\$1} ? '#' . \$map{\$1} : '#' . \$1/ge;"

# ---------------------------------------------------------------------------
# Patch the body of a single issue
# ---------------------------------------------------------------------------
patch_issue() {
  local issue_num="$1"

  local body
  body=$(gh issue view "$issue_num" --repo "$REPO" --json body --jq '.body')

  local new_body
  new_body=$(printf '%s' "$body" | perl -pe "$PERL_PROG")

  if [[ "$new_body" == "$body" ]]; then
    echo "  #${issue_num}: no changes needed"
    return
  fi

  printf '%s' "$new_body" > "$TMPFILE"
  gh issue edit "$issue_num" --repo "$REPO" --body-file "$TMPFILE"
  echo "  #${issue_num}: updated"
}

# ---------------------------------------------------------------------------
# Patch every issue we created, plus the epic
# ---------------------------------------------------------------------------
echo "Patching issue bodies…"

for seq in $(echo "${!MAP[@]}" | tr ' ' '\n' | sort -n); do
  patch_issue "${MAP[$seq]}"
done

if [[ -n "$EPIC_NUM" ]]; then
  patch_issue "$EPIC_NUM"
fi

echo ""
echo "Done."
