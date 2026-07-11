import { getRoleDefinition } from "@shared/automation/roles";
import type { AutomationRole } from "@shared/automation/roles";
import { matchesKeywords } from "@shared/automation/textMatch";
import { KIND_CHECK, KIND_SELECTOR, isDecorative } from "@shared/automation/elementClassification";
import type { AttributeBag } from "@shared/automation/elementClassification";

export interface DiscoveryMatch {
  element: Element;
  tier: number;
  strategyName: string;
}

/** Candidate pools that resolve to more than this are too ambiguous for the tier-7 fallback to guess among safely. */
const MAX_FALLBACK_CANDIDATES = 3;

function toAttributeBag(el: Element): AttributeBag {
  const attributes: Record<string, string> = {};
  for (const attribute of Array.from(el.attributes)) {
    attributes[attribute.name] = attribute.value;
  }
  return { tagName: el.tagName, attributes };
}

function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) {
    return true;
  }
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function isDisabled(el: Element): boolean {
  if (el.getAttribute("aria-disabled") === "true") {
    return true;
  }
  if (
    el instanceof HTMLButtonElement ||
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    return el.disabled;
  }
  return false;
}

function accessibleName(el: Element): string {
  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const text = ariaLabelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
    if (text) {
      return text;
    }
  }
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label?.textContent) {
        return label.textContent;
      }
    }
    const closestLabel = el.closest("label");
    if (closestLabel?.textContent) {
      return closestLabel.textContent;
    }
    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.placeholder) {
      return el.placeholder;
    }
  }
  const title = el.getAttribute("title");
  if (title) {
    return title;
  }
  return "";
}

function visibleText(el: Element): string {
  if (el instanceof HTMLElement) {
    return el.innerText || el.textContent || "";
  }
  return el.textContent;
}

function nearbyText(el: Element): string {
  const parts: string[] = [];
  const prev = el.previousElementSibling;
  if (prev?.textContent) {
    parts.push(prev.textContent);
  }
  const parent = el.parentElement;
  if (parent) {
    const parentPrev = parent.previousElementSibling;
    if (parentPrev?.textContent) {
      parts.push(parentPrev.textContent);
    }
    const parentLabel = parent.getAttribute("aria-label");
    if (parentLabel) {
      parts.push(parentLabel);
    }
  }
  return parts.join(" ");
}

function scoreCandidate(el: Element, keywords: readonly string[]): DiscoveryMatch | null {
  const bag = toAttributeBag(el);

  const stableAttrValues = [bag.attributes["data-testid"], bag.attributes.id, bag.attributes.name].filter(
    (value): value is string => Boolean(value),
  );
  for (const value of stableAttrValues) {
    if (matchesKeywords(value, keywords)) {
      return { element: el, tier: 1, strategyName: "stable-attribute" };
    }
  }

  const ariaLabel = bag.attributes["aria-label"];
  if (ariaLabel && matchesKeywords(ariaLabel, keywords)) {
    return { element: el, tier: 2, strategyName: "aria-label" };
  }

  const name = accessibleName(el);
  if (name && matchesKeywords(name, keywords)) {
    return { element: el, tier: 3, strategyName: "accessible-name" };
  }

  const text = visibleText(el);
  if (text && matchesKeywords(text, keywords)) {
    return { element: el, tier: 4, strategyName: "visible-text" };
  }

  const nearby = nearbyText(el);
  if (nearby && matchesKeywords(nearby, keywords)) {
    return { element: el, tier: 6, strategyName: "dom-proximity" };
  }

  return null;
}

/**
 * Runs the full 7-tier discovery pipeline for one role against the current
 * document: gather a kind-appropriate candidate pool, score each candidate
 * by tier (lower is better), and pick the lowest-tier match. Falls back to
 * "the only candidate of this kind" (tier 5) or, for a small handful of
 * otherwise indistinguishable candidates, the first in DOM order (tier 7)
 * — never guessing among a large, ambiguous pool.
 *
 * Tier 7 only applies to optional roles. For a required role (prompt
 * editor, generate, download) guessing wrong is worse than reporting it
 * missing — automation could click an unrelated button instead of the
 * real one. Required roles that get no keyword/ARIA/text/proximity match
 * and aren't the sole element of their kind are reported not found rather
 * than guessed at.
 *
 * Scoring runs against every element of the right kind, including ones
 * that are currently disabled or hidden — an element's identity (which
 * role it plays) shouldn't change just because it's momentarily disabled
 * (e.g. a download button disabled mid-generation). Only once a candidate
 * is chosen do we check whether it's *currently* clickable; if not, the
 * role reports as not found right now rather than silently falling back
 * to a different, unrelated element that happens to still be enabled.
 *
 * The tier 5/7 *ambiguity* count, however, is computed over the visible
 * pool only — a permanently hidden decoy of the same kind (e.g. Google's
 * invisible reCAPTCHA `<textarea>`) would otherwise make a genuinely
 * singular real element look ambiguous and block the safe tier-5 guess.
 */
export function discoverRole(role: AutomationRole): DiscoveryMatch | null {
  const definition = getRoleDefinition(role);
  const selector = KIND_SELECTOR[definition.expectedKind];
  const kindCheck = KIND_CHECK[definition.expectedKind];

  const pool = Array.from(document.querySelectorAll(selector)).filter((el) => {
    const bag = toAttributeBag(el);
    return !isDecorative(bag) && kindCheck(bag);
  });

  if (pool.length === 0) {
    return null;
  }

  let match: DiscoveryMatch | null = null;
  for (const el of pool) {
    const candidateMatch = scoreCandidate(el, definition.keywords);
    if (candidateMatch && (!match || candidateMatch.tier < match.tier)) {
      match = candidateMatch;
    }
  }

  const visiblePool = pool.filter(isVisible);

  if (!match && visiblePool.length === 1) {
    const [only] = visiblePool;
    if (only) {
      match = { element: only, tier: 5, strategyName: "semantic-html-only" };
    }
  }

  if (!match && !definition.required && visiblePool.length <= MAX_FALLBACK_CANDIDATES) {
    const [first] = visiblePool;
    if (first) {
      match = { element: first, tier: 7, strategyName: "fallback-first-of-few" };
    }
  }

  if (!match || isDisabled(match.element) || !isVisible(match.element)) {
    return null;
  }

  return match;
}
