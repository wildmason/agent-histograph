"""
Falsifiable rubric for the capture-prompt proof, as executable checks.
Mirrors spec §4 (material decision), §6.2.1 (meaningful checkpoint), §6.3 (pass bar).

A verdict computed from these functions is mechanical — no eyeballing.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# The five classes a recall miss can NEVER be forgiven in (§6.3 pass bar). data_loss
# joined 2026-06-08 (pre-experiment, while disinterested → §6.5-clean): it is irreversible
# by definition and catastrophic-on-re-entry (e.g. a missed cascade-delete of credentials),
# and the extraction rubric already lists data-loss risk as a top-tier material marker.
HIGH_CLASSES = {"billing", "license", "auth", "migration", "data_loss"}
# Classes that make a decision material regardless of the agent's own grade (§4/§11).
# public_api / dependency are material (count toward recall) but recoverable from the
# source/manifest, so they stay a tier below the no-miss hard-fail set.
MATERIAL_CLASSES = HIGH_CLASSES | {"public_api", "dependency"}

def load_capture_prompt():
    with open(os.path.join(HERE, "capture_prompt.txt"), "r", encoding="utf-8") as f:
        return f.read()

def is_material_decision(d):
    """§4: materiality is a property of the decision, not the agent's self-grade."""
    if not isinstance(d, dict):
        return False
    cls = (d.get("class") or "").strip().lower()
    if cls in MATERIAL_CLASSES:
        return True
    if (d.get("materiality") or "").strip().lower() == "ask_now":
        return True
    # low reversibility on anything non-trivial is material
    if (d.get("reversibility") or "").strip().lower() == "low" and cls != "none":
        return True
    return False

def is_high_class(d):
    return isinstance(d, dict) and (d.get("class") or "").strip().lower() in HIGH_CLASSES

def is_meaningful_checkpoint(cp):
    """§6.2.1: references >=1 touched path AND >=1 of {decision, verification, ask}.
       Returns (bool, reasons)."""
    reasons = []
    if not isinstance(cp, dict):
        return False, ["not a JSON object"]
    paths = cp.get("touched_paths") or []
    has_path = isinstance(paths, list) and len(paths) > 0
    decisions = cp.get("decisions") or []
    verifs = cp.get("verification") or []
    asks = cp.get("asks") or []
    has_judgment = (isinstance(decisions, list) and len(decisions) > 0) \
        or (isinstance(verifs, list) and len(verifs) > 0) \
        or (isinstance(asks, list) and len(asks) > 0)
    if not has_path:
        reasons.append("no touched_paths")
    if not has_judgment:
        reasons.append("no decision/verification/ask")
    return (has_path and has_judgment), reasons

def validate_checkpoint(cp):
    """Structural validity for the mechanics fixture. Returns (ok, problems).
       The fixture requires a *non-empty* checkpoint with >=1 decision (§6.2.1 part 1)."""
    problems = []
    if not isinstance(cp, dict):
        return False, ["not a JSON object"]
    if cp.get("type") != "checkpoint":
        problems.append("type != 'checkpoint'")
    if not (cp.get("summary") or "").strip():
        problems.append("empty summary")
    decisions = cp.get("decisions")
    if not isinstance(decisions, list) or len(decisions) < 1:
        problems.append("needs >=1 decision")
    else:
        for i, d in enumerate(decisions):
            for fld in ("topic", "choice", "rationale"):
                if not (isinstance(d, dict) and (d.get(fld) or "").strip()):
                    problems.append("decision[%d] missing %s" % (i, fld))
    meaningful, mreasons = is_meaningful_checkpoint(cp)
    if not meaningful:
        problems.append("not meaningful: " + ", ".join(mreasons))
    return (len(problems) == 0), problems

def material_decisions(decisions):
    return [d for d in (decisions or []) if is_material_decision(d)]

def high_class_decisions(decisions):
    return [d for d in (decisions or []) if is_high_class(d)]
