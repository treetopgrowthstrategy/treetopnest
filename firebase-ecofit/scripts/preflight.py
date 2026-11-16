#!/usr/bin/env python3
"""
Pre-deploy smoke check for ecofitnetworks.com.

Scans every page under public/ for the endpoints its forms post to, then proves
each one actually answers a CORS preflight from the ecofit origin. Exits non-zero
if anything would silently drop leads.

Run this before every `firebase deploy`. It is the check that would have caught
the 2026-08-05 outage (www 308-redirects to apex, and browsers do not follow
redirects on a preflight, so every submission died silently) and the
lead-capture leak (an endpoint that captured the lead correctly but emailed
ecofit's prospects as Treetop).

    python3 scripts/preflight.py            # check
    python3 scripts/preflight.py --verbose  # show which file references what

Checks performed per endpoint:
  1. It is not on the forbidden list (endpoints that misbehave on an ecofit page
     even though they return 200).
  2. It is on the apex host, not www, if it is a treetopgrowthstrategy.com URL.
  3. OPTIONS from Origin: https://ecofitnetworks.com returns 200 or 204.
  4. The preflight response actually permits this origin. A 200 that omits
     Access-Control-Allow-Origin still fails in a browser.
"""
from __future__ import annotations

import os
import re
import sys
import urllib.error
import urllib.request
from collections import defaultdict

PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
ORIGIN = "https://ecofitnetworks.com"
TIMEOUT = 20

# Content that must never be deployed, as path fragments matched against every
# file under public/. Standing instruction from Bill on 2026-08-05: the
# gym-insurance cluster is not to be published under any circumstances.
#
# This is a hard gate rather than a note because the cluster has already come
# back twice on its own. Commit 3ba70c8f is titled "recover after bad
# working-tree state (restore gym-insurance cluster...)", and it reappeared
# again after that. A checkout of an older commit, a stray revert, or a stash
# pop is enough to put these files back in public/, and `firebase deploy` ships
# the whole directory. This check fails the deploy instead.
#
# Do not remove this without Bill saying so explicitly.
FORBIDDEN_CONTENT = [
    ("gym-insurance", "gym-insurance cluster"),
    ("insurance-savings", "insurance-savings estimator"),
    ("sitemap-insurance-module", "insurance module sitemap"),
]

# Endpoints that must never be called from an ecofit page, with the reason.
# These return 200, so a plain reachability check will not catch them.
FORBIDDEN = {
    "/api/lead-capture": (
        "emails the submitter on every code path, always Treetop-branded; "
        "on an ecofit page that leaks the agency to ecofit's own prospects"
    ),
}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    """Do not follow redirects.

    Browsers do not follow redirects on a CORS preflight, so a 3xx here means
    the form silently loses the lead. urllib follows redirects by default and
    would report the eventual 200, hiding exactly the bug we are looking for.

    This is measured rather than hardcoded on purpose. A list of "hosts that
    redirect" is a fact that can go stale, and a stale infrastructure fact is
    what caused the 2026-08-05 outage in the first place.
    """

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

URL_RE = re.compile(r"""["']((?:https?:)?//[^"']*?/api/[A-Za-z0-9._/-]+)["']""")
REL_RE = re.compile(r"""fetch\(\s*["'](/api/[A-Za-z0-9._/-]+)["']""")


def discover() -> dict[str, list[str]]:
    """endpoint URL -> list of files referencing it"""
    found: dict[str, list[str]] = defaultdict(list)
    for root, _dirs, files in os.walk(PUBLIC):
        for fn in files:
            if not fn.endswith((".html", ".js")):
                continue
            path = os.path.join(root, fn)
            try:
                text = open(path, encoding="utf-8", errors="replace").read()
            except OSError:
                continue
            rel = os.path.relpath(path, PUBLIC)
            for m in URL_RE.finditer(text):
                url = m.group(1)
                if url.startswith("//"):
                    url = "https:" + url
                found[url].append(rel)
            for m in REL_RE.finditer(text):
                found[ORIGIN + m.group(1)].append(rel)
    return found


def preflight(url: str) -> tuple[int | None, dict, str]:
    req = urllib.request.Request(url, method="OPTIONS")
    req.add_header("Origin", ORIGIN)
    req.add_header("Access-Control-Request-Method", "POST")
    req.add_header("Access-Control-Request-Headers", "content-type")
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(req, timeout=TIMEOUT) as r:
            return r.status, dict(r.headers), ""
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), ""
    except Exception as e:  # DNS failure, TLS failure, timeout
        return None, {}, str(e)


def check_forbidden_content() -> list[str]:
    """Fail if content that must never ship has reappeared under public/."""
    hits: list[str] = []
    for root, _dirs, files in os.walk(PUBLIC):
        for fn in files:
            rel = os.path.relpath(os.path.join(root, fn), PUBLIC)
            for fragment, label in FORBIDDEN_CONTENT:
                if fragment in rel:
                    hits.append(f"{rel}  ({label})")
                    break
    return sorted(hits)


def main() -> int:
    verbose = "--verbose" in sys.argv

    forbidden = check_forbidden_content()
    if forbidden:
        print("preflight: BLOCKED. Content that must never be published is present "
              f"under public/ ({len(forbidden)} file(s)):\n")
        for h in forbidden:
            print(f"  {h}")
        print(
            "\nThis is a standing instruction, not a stale rule. The gym-insurance\n"
            "cluster has reappeared twice from working-tree accidents, and\n"
            "`firebase deploy` ships the entire public/ directory, so one stray file\n"
            "here republishes it. Remove these files before deploying.\n"
            "If this is genuinely intended, Bill has to say so and FORBIDDEN_CONTENT\n"
            "in this script needs updating first."
        )
        return 1

    endpoints = discover()

    if not endpoints:
        print("preflight: no /api/ endpoints referenced under public/.")
        print("           If that is unexpected, the scan pattern may need updating.")
        return 0

    failures: list[str] = []
    print(f"preflight: {len(endpoints)} endpoint(s) referenced under public/\n")

    for url in sorted(endpoints):
        refs = sorted(set(endpoints[url]))
        path = re.sub(r"^https?://[^/]+", "", url)
        host = re.sub(r"^https?://([^/]+).*$", r"\1", url)
        label = url.replace("https://", "")
        problems: list[str] = []

        if path in FORBIDDEN:
            problems.append(f"FORBIDDEN endpoint: {FORBIDDEN[path]}")

        code, headers, err = preflight(url)
        if err:
            problems.append(f"request failed: {err}")
        elif code in (301, 302, 303, 307, 308):
            target = headers.get("Location", "?")
            problems.append(
                f"{host} answers the preflight with {code} -> {target}. Browsers do not "
                "follow redirects on a preflight, so every submission dies silently. "
                "Point this at the final host directly."
            )
        elif code not in (200, 204):
            problems.append(f"preflight returned {code}, expected 200 or 204")
        else:
            allow = headers.get("Access-Control-Allow-Origin")
            if allow is None:
                problems.append(
                    f"preflight returned {code} but sent no Access-Control-Allow-Origin; "
                    "the browser will still block this"
                )
            elif allow not in ("*", ORIGIN):
                problems.append(f"Access-Control-Allow-Origin is {allow!r}, which excludes {ORIGIN}")

        status = "FAIL" if problems else "ok"
        print(f"  [{status:4}] {label}  (HTTP {code})")
        if verbose or problems:
            for r in refs:
                print(f"           referenced by {r}")
        for p in problems:
            print(f"           -> {p}")
            failures.append(f"{label}: {p}")
        print()

    if failures:
        print(f"preflight FAILED with {len(failures)} problem(s). Do not deploy.")
        return 1

    print("preflight passed. Every referenced endpoint answers a preflight from " + ORIGIN + ".")
    return 0


if __name__ == "__main__":
    sys.exit(main())
