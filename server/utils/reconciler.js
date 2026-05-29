/**
 * Reconciliation Engine for Receipt Scanning
 * 
 * Validates that scanned items match the bill total,
 * detects duplicates, distributes unaccounted charges,
 * and produces a confidence + warnings report.
 */

/**
 * Safe round to 2 decimal places (avoids floating-point drift)
 */
export function safeRound(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Penny-exact equal split using the largest-remainder method.
 * Guarantees: sum of all shares === totalAmount (exactly)
 * 
 * @param {number} totalAmount - The amount to split
 * @param {number} count - Number of participants
 * @param {string|null} payerIndex - Index of the payer (gets the extra penny)
 * @returns {number[]} Array of share amounts
 */
export function pennyExactSplit(totalAmount, count, payerIndex = 0) {
  if (count <= 0) return [];
  if (count === 1) return [safeRound(totalAmount)];

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - baseCents * count;

  const shares = new Array(count).fill(baseCents);

  // Distribute remainder pennies — payer gets priority, then first participants
  const pIdx = typeof payerIndex === "number" && payerIndex >= 0 && payerIndex < count ? payerIndex : 0;

  let distributed = 0;
  // Give payer the first extra penny if there is any remainder
  if (remainderCents > 0) {
    shares[pIdx] += 1;
    distributed++;
  }
  // Distribute remaining pennies to other participants
  for (let i = 0; i < count && distributed < remainderCents; i++) {
    if (i !== pIdx) {
      shares[i] += 1;
      distributed++;
    }
  }

  return shares.map((cents) => safeRound(cents / 100));
}

/**
 * Detect potential duplicate items from OCR
 * Items with the same name (case-insensitive) and same price are suspicious
 */
function detectDuplicates(items) {
  const seen = new Map();
  const duplicates = [];

  items.forEach((item, idx) => {
    const key = `${(item.item || "").toLowerCase().trim()}|${item.price}`;
    if (seen.has(key)) {
      duplicates.push({
        index1: seen.get(key),
        index2: idx,
        item: item.item,
        price: item.price,
        message: `"${item.item}" (₹${item.price}) appears multiple times — verify it's not an OCR duplicate`
      });
    } else {
      seen.set(key, idx);
    }
  });

  return duplicates;
}

/**
 * Calculate confidence score based on how well the scan went
 * 
 * @param {object} params
 * @param {number} params.itemsTotal - Sum of extracted item prices
 * @param {number} params.grandTotal - Extracted grand total from receipt
 * @param {number} params.itemCount - Number of items found
 * @param {number} params.duplicateCount - Number of potential duplicates
 * @param {boolean} params.hasGrandTotal - Whether a grand total was found in the text
 * @returns {object} { score: 0-100, level: "high"|"medium"|"low" }
 */
function calculateConfidence({ itemsTotal, grandTotal, itemCount, duplicateCount, hasGrandTotal }) {
  let score = 100;

  // No items found: very low confidence
  if (itemCount === 0) {
    return { score: 10, level: "low" };
  }

  // Deduct for total mismatch
  if (hasGrandTotal && grandTotal > 0) {
    const diff = Math.abs(itemsTotal - grandTotal);
    const pctDiff = (diff / grandTotal) * 100;

    if (pctDiff > 30) score -= 40;
    else if (pctDiff > 15) score -= 25;
    else if (pctDiff > 5) score -= 15;
    else if (pctDiff > 1) score -= 5;
    // Within 1%: perfect match
  } else {
    // No grand total found — can't verify
    score -= 20;
  }

  // Deduct for too few items (likely missed some)
  if (itemCount < 2) score -= 10;

  // Deduct for duplicates
  score -= duplicateCount * 10;

  // Clamp
  score = Math.max(5, Math.min(100, score));

  let level = "high";
  if (score < 50) level = "low";
  else if (score < 75) level = "medium";

  return { score, level };
}

/**
 * Main reconciliation function
 * 
 * Takes the raw OCR output and produces a validated, reconciled result
 * 
 * @param {object} params
 * @param {Array<{item: string, price: number}>} params.items - Extracted items
 * @param {number} params.grandTotal - Extracted grand total
 * @param {number} params.itemsTotal - Sum of item prices
 * @param {number} params.estimatedTax - Estimated tax from OCR
 * @param {object} params.charges - Extracted charges breakdown
 * @returns {object} Reconciliation result
 */
export function reconcile({ items, grandTotal, itemsTotal, estimatedTax = 0, charges = {} }) {
  const warnings = [];
  const suggestions = [];

  // --- 1. Detect duplicates ---
  const duplicates = detectDuplicates(items);
  duplicates.forEach((d) => warnings.push(d.message));

  // --- 2. Calculate actual items total ---
  const calculatedItemsTotal = safeRound(items.reduce((sum, item) => sum + (item.price || 0), 0));

  // --- 3. Compare items total with grand total ---
  const hasGrandTotal = grandTotal > 0;
  const effectiveGrandTotal = hasGrandTotal ? grandTotal : calculatedItemsTotal;
  const difference = safeRound(effectiveGrandTotal - calculatedItemsTotal);
  const absDifference = Math.abs(difference);

  let status = "verified"; // "verified", "adjusted", "mismatch"
  let reconciled = false;

  if (absDifference <= 0.01) {
    // Perfect match (within 1 paisa tolerance)
    status = "verified";
    reconciled = true;
  } else if (difference > 0 && difference <= effectiveGrandTotal * 0.35) {
    // Grand total is HIGHER than items — unaccounted charges (tax, service charge, etc.)
    status = "adjusted";
    reconciled = true;

    if (estimatedTax > 0 && Math.abs(difference - estimatedTax) < 1) {
      suggestions.push(`₹${difference.toFixed(2)} difference matches the detected tax/charges`);
    } else {
      warnings.push(
        `₹${difference.toFixed(2)} unaccounted — likely tax, service charge, or packaging fee`
      );
      suggestions.push(`Consider adding a "Tax/Charges" item for ₹${difference.toFixed(2)}`);
    }
  } else if (difference < 0) {
    // Grand total is LOWER than items — possibly duplicate items or OCR misread
    status = "mismatch";
    reconciled = false;
    warnings.push(
      `Items total (₹${calculatedItemsTotal.toFixed(2)}) exceeds bill total (₹${effectiveGrandTotal.toFixed(2)}) by ₹${absDifference.toFixed(2)} — check for duplicate or misread items`
    );
  } else {
    // Large positive difference — too much unaccounted
    status = "mismatch";
    reconciled = false;
    warnings.push(
      `Large gap: bill total (₹${effectiveGrandTotal.toFixed(2)}) exceeds items (₹${calculatedItemsTotal.toFixed(2)}) by ₹${absDifference.toFixed(2)} — many items may be missing`
    );
  }

  // --- 4. Distribute unaccounted charges proportionally ---
  let adjustedItems = items.map((item) => ({ ...item }));

  if (status === "adjusted" && difference > 0 && calculatedItemsTotal > 0) {
    // Proportionally distribute the difference across items
    let distributedCents = 0;
    const totalDiffCents = Math.round(difference * 100);

    adjustedItems = items.map((item, idx) => {
      const proportion = item.price / calculatedItemsTotal;
      let addCents;

      if (idx === items.length - 1) {
        // Last item gets the remainder to avoid rounding errors
        addCents = totalDiffCents - distributedCents;
      } else {
        addCents = Math.floor(totalDiffCents * proportion);
        distributedCents += addCents;
      }

      return {
        ...item,
        originalPrice: item.price,
        price: safeRound(item.price + addCents / 100),
        adjustment: safeRound(addCents / 100)
      };
    });
  }

  // --- 5. Verify adjusted total matches grand total ---
  const adjustedTotal = safeRound(adjustedItems.reduce((sum, item) => sum + item.price, 0));
  const finalTotal = hasGrandTotal ? effectiveGrandTotal : adjustedTotal;

  // --- 6. Confidence ---
  const confidence = calculateConfidence({
    itemsTotal: calculatedItemsTotal,
    grandTotal: effectiveGrandTotal,
    itemCount: items.length,
    duplicateCount: duplicates.length,
    hasGrandTotal
  });

  return {
    status,          // "verified" | "adjusted" | "mismatch"
    reconciled,      // boolean — safe to proceed?
    confidence,      // { score: 0-100, level: "high"|"medium"|"low" }

    items: adjustedItems,
    itemsTotal: calculatedItemsTotal,
    adjustedTotal,
    grandTotal: effectiveGrandTotal,
    finalTotal,      // The amount that should be used for splitting
    difference,
    estimatedTax,

    charges: {
      tax: charges.tax || estimatedTax,
      serviceCharge: charges.serviceCharge || 0,
      discount: charges.discount || 0,
      ...charges
    },

    duplicates,
    warnings,
    suggestions
  };
}
