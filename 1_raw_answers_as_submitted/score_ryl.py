#!/usr/bin/env python3
"""
REWRITE YOUR LIFE — SCORING SCRIPT
Growth Impact Group

HOW TO USE:
    1. Put your raw CSV in the same folder as this script.
    2. Open Terminal in that folder.
    3. Run:   python3 score_ryl.py yourfile.csv
    4. A scored file appears, ready for 2_scored_results.

Do not edit the raw file. Do not edit this script without
updating the copy in A_GIG_INSTRUMENTS_frozen_[KEEP].
"""

import csv
import sys
import os

# ---------------------------------------------------------------
# THE FROZEN SCORING RULES — must match the instrument exactly
# ---------------------------------------------------------------

REVERSE_ITEMS = [8, 14]          # score = 10 - answer

DOMAINS = {
    "clear_thinking": [1, 2],
    "emotional":      [3, 4],
    "adversity":      [5, 6],
    "frame":          [7, 8],
    "learning":       [9, 10],
    "situational":    [11, 12],
    "presence":       [13, 14],
    "purpose":        [15, 16],
    "execution":      [17, 18],
}

LIFE_ANCHORS = [19, 20, 21]      # reported individually, 0-10
AI_INDEX     = [22, 23, 24, 25, 26, 27]   # summed, out of 60

STRAIGHT_LINE_RUN = 10           # flag if this many identical in a row


def score_row(row):
    """Score one submission. Returns a dict of results."""

    # Read the 27 answers
    answers = {}
    for i in range(1, 28):
        raw = row.get(f"item_{i}", "")
        try:
            answers[i] = int(raw)
        except (ValueError, TypeError):
            answers[i] = None

    # Apply reverse scoring
    scored = {}
    for i, val in answers.items():
        if val is None:
            scored[i] = None
        elif i in REVERSE_ITEMS:
            scored[i] = 10 - val
        else:
            scored[i] = val

    out = {
        "id": row.get("id", ""),
        "created_at": row.get("created_at", ""),
        "course": row.get("course", ""),
        "phase": row.get("phase", ""),
        "email": row.get("email", ""),
    }

    # Domain scores: sum of 2 items out of 20, shown as a percentage
    for name, items in DOMAINS.items():
        vals = [scored[i] for i in items if scored[i] is not None]
        if len(vals) == len(items):
            out[f"{name}_pct"] = round(sum(vals) / (10 * len(items)) * 100, 1)
        else:
            out[f"{name}_pct"] = ""

    # Life anchors, reported as raw 0-10
    for i in LIFE_ANCHORS:
        out[f"anchor_{i}"] = scored[i] if scored[i] is not None else ""

    # AI orchestration index: sum out of 60, shown as a percentage
    ai_vals = [scored[i] for i in AI_INDEX if scored[i] is not None]
    if len(ai_vals) == len(AI_INDEX):
        out["ai_index_pct"] = round(sum(ai_vals) / 60 * 100, 1)
    else:
        out["ai_index_pct"] = ""

    # Overall: average of the 18 domain items, as a percentage
    domain_items = [i for items in DOMAINS.values() for i in items]
    dvals = [scored[i] for i in domain_items if scored[i] is not None]
    out["overall_pct"] = (round(sum(dvals) / (10 * len(dvals)) * 100, 1)
                          if len(dvals) == len(domain_items) else "")

    # Straight-line check: same value 10+ in a row including a reverse item
    flagged = False
    run_start, run_len = 1, 1
    for i in range(2, 28):
        if answers[i] is not None and answers[i] == answers[i - 1]:
            run_len += 1
        else:
            if run_len >= STRAIGHT_LINE_RUN:
                span = range(run_start, run_start + run_len)
                if any(r in span for r in REVERSE_ITEMS):
                    flagged = True
            run_start, run_len = i, 1
    if run_len >= STRAIGHT_LINE_RUN:
        span = range(run_start, run_start + run_len)
        if any(r in span for r in REVERSE_ITEMS):
            flagged = True

    out["straight_line_flag"] = "YES" if flagged else "NO"
    out["include_in_aggregates"] = "NO" if flagged else "YES"
    out["consent"] = row.get("consent", "")

    return out


def main():
    if len(sys.argv) < 2:
        print("\nUSAGE:  python3 score_ryl.py yourfile.csv\n")
        sys.exit(1)

    infile = sys.argv[1]
    if not os.path.exists(infile):
        print(f"\nCan't find that file: {infile}\n")
        sys.exit(1)

    base = os.path.splitext(os.path.basename(infile))[0]
    outfile = base.replace("_raw_", "_scored_") + ".csv"
    if outfile == base + ".csv":
        outfile = base + "_scored.csv"

    with open(infile, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        print("\nThat file has no rows in it.\n")
        sys.exit(1)

    scored = [score_row(r) for r in rows]

    with open(outfile, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(scored[0].keys()))
        writer.writeheader()
        writer.writerows(scored)

    flagged = sum(1 for r in scored if r["straight_line_flag"] == "YES")

    print(f"\n  Scored {len(scored)} submission(s).")
    print(f"  Straight-line flags: {flagged}")
    print(f"  Saved as: {outfile}")
    print(f"\n  Put this file in 2_scored_results.\n")


if __name__ == "__main__":
    main()
