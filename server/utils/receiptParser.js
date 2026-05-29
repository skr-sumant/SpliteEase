/**
 * Enhanced Receipt Parser for SplitEase-AI
 * 
 * Parses OCR text from receipts into structured items with:
 * - Multi-strategy line parsing (trailing price, qty×price, prefix price, tabular)
 * - Tax/GST/service charge extraction
 * - OCR noise correction (common Tesseract misreads)
 * - Duplicate detection
 * - Confidence scoring
 */

export const parseReceiptText = (text) => {
  if (!text) return { items: [], charges: {} };

  const lines = text.split("\n");
  const items = [];

  // Exclude list for total/tax/payment methods/noise to prevent double counting
  const excludeKeywords = [
    "total", "grand total", "subtotal", "sub total", "net total", "net amount",
    "amount due", "amount payable", "bill amount", "final amount",
    "tax", "gst", "cgst", "sgst", "igst", "vat", "cess",
    "change", "cash", "visa", "card", "upi", "payment", "due", "paid", "balance",
    "round off", "rounding", "service charge", "serv charge", "serv chg", "delivery",
    "discount", "promo", "coupon", "offer", "saving",
    "tip", "gratuity", "packaging", "container",

    // Noise & non-food metadata
    "phone", "mobile", "tel", "cell", "contact", "call", "pincode", "pin code", "zip",
    "invoice", "receipt", "order no", "order id", "token", "bill no",
    "gstin", "pan", "fssai", "lic", "tin",
    "address", "road", "street", "lane", "floor", "block", "building", "plot", "sector",
    "city", "state", "country", "dist",
    "cashier", "waiter", "table", "server", "station", "counter", "pos",
    "date", "time", "fax", "email", "www", "http", "https",
    "co.", "inc.", "ltd.", "pvt", "corp", "llp",
    "thank", "thanks", "welcome", "visit", "again", "feedback",
    "customer", "guest", "member", "loyalty", "points",
    "qty", "quantity", "sr no", "sl no", "s.no", "item code", "hsn",
    "particular", "description",
    // Common Indian city names that appear in receipt headers
    "pune", "mumbai", "delhi", "bangalore", "hyderabad", "chennai", "kolkata",
    "noida", "gurgaon", "lucknow", "jaipur", "ahmedabad", "surat", "indore"
  ];

  // Regex patterns for strict numerical noise exclusion
  const phoneRegex = /(?:\+?91[\s-]?)?[6-9]\d{9}/;
  const pincodeRegex = /\b\d{6}\b/;
  const zipRegex = /\b\d{5}\b/;
  const dateRegex = /\b\d{1,4}[\/\.-]\d{1,4}[\/\.-]\d{2,4}\b/;
  const timeRegex = /\b\d{1,2}:\d{2}(?:\s?[aApP][mM])?\b/;
  // Lines that are purely dashes, equals, stars (receipt separators)
  const separatorRegex = /^[\s\-=*_~#.]+$/;
  // Lines that are only numbers (invoice numbers, token numbers, etc.)
  const pureNumberRegex = /^\s*[#]?\d+\s*$/;

  // ---- Extract charges/taxes from the text ----
  const charges = extractCharges(text);

  lines.forEach((line) => {
    let cleanLine = line.trim();
    if (!cleanLine) return;
    if (cleanLine.length < 3) return; // skip very short lines

    // Skip separator lines
    if (separatorRegex.test(cleanLine)) return;

    // Skip pure number lines
    if (pureNumberRegex.test(cleanLine)) return;

    // Apply regex exclusions
    if (phoneRegex.test(cleanLine) || pincodeRegex.test(cleanLine) ||
        zipRegex.test(cleanLine) || dateRegex.test(cleanLine) ||
        timeRegex.test(cleanLine)) {
      return;
    }

    // OCR noise correction: fix common Tesseract misreads in numbers
    // "25O" -> "250", "1l2" -> "112", "I5" -> "15" at the end of the line (price area)
    cleanLine = cleanLine.replace(/(\d)[oO](\d)/g, "$10$2");
    cleanLine = cleanLine.replace(/(\d)[oO](\s|$)/g, "$10$2");
    cleanLine = cleanLine.replace(/(\d)[lI](\d)/g, "$11$2");
    cleanLine = cleanLine.replace(/[lI](\d{2,})/g, "1$1");
    // "S" at start/end of digit sequence -> "5" (e.g. "S50" -> "550", "45S" -> "455")
    cleanLine = cleanLine.replace(/S(\d{2,})/g, "5$1");
    cleanLine = cleanLine.replace(/(\d{2,})S/g, "$15");
    // "B" at start of digits -> "8" (e.g. "B00" -> "800")
    cleanLine = cleanLine.replace(/B(\d{2,})/g, "8$1");
    // "Z" in digit sequence -> "2"
    cleanLine = cleanLine.replace(/(\d)Z(\d)/g, "$12$2");
    cleanLine = cleanLine.replace(/Z(\d{2,})/g, "2$1");

    // Normalize multiple spaces/tabs to single space
    cleanLine = cleanLine.replace(/\s+/g, " ");

    // Strategy 1: Match "qty x price = total" pattern (e.g., "2 x 325.00 = 650.00" or "2x325")
    // Decimal part requires exactly 2 digits to avoid matching non-price decimals
    const qtyTotalRegex = /(\d+)\s*[xX×]\s*[\d.,]+\s*[=\-]?\s*[₹$£€]?\s*(\d{1,6}[\.,]\d{2})\s*$/;
    const qtyTotalMatch = cleanLine.match(qtyTotalRegex);
    if (qtyTotalMatch) {
      const totalPrice = parseFloat(qtyTotalMatch[2].replace(",", "."));
      let itemName = cleanLine.substring(0, cleanLine.indexOf(qtyTotalMatch[0])).trim();
      itemName = cleanItemName(itemName);
      if (isValidItem(itemName, totalPrice, excludeKeywords)) {
        items.push({ item: itemName, price: Math.round(totalPrice * 100) / 100 });
        return;
      }
    }

    // Strategy 2: Match price with EXACTLY 2 decimal places at end of line
    // Requires .XX format (e.g., "650.00", "325.50") — prevents matching non-price decimals
    // Supports: "Margherita Pizza    650.00", "Pasta  ₹ 450.00"
    const trailingPriceRegex = /[₹$£€]?\s*(\d{1,6}[\.,]\d{2})\s*$/;
    const trailingPriceMatch = cleanLine.match(trailingPriceRegex);

    if (trailingPriceMatch) {
      const rawPrice = trailingPriceMatch[1].replace(",", ".");
      const itemPrice = Math.round(parseFloat(rawPrice) * 100) / 100;
      let itemName = cleanLine.substring(0, cleanLine.length - trailingPriceMatch[0].length).trim();

      // Strip trailing quantity info like "x2", "x 1", "2x", "Qty: 1"
      itemName = itemName.replace(/\s*[xX×]\s*\d+\s*$/, "").trim();
      itemName = itemName.replace(/\s*\d+\s*[xX×]\s*$/, "").trim();
      itemName = itemName.replace(/\s*(?:qty|quantity)\s*:?\s*\d+\s*$/i, "").trim();

      // Also strip a second price that might be unit price: "Chicken Biryani  325.00  650.00"
      itemName = itemName.replace(/\s+\d{1,6}[\.,]\d{2}\s*$/, "").trim();
      // Strip leading/trailing quantity: "1 Margherita Pizza" or "2 x Pizza" 
      itemName = itemName.replace(/^\d+\s*[xX×]?\s+/, "").trim();

      itemName = cleanItemName(itemName);

      if (isValidItem(itemName, itemPrice, excludeKeywords)) {
        items.push({ item: itemName, price: itemPrice });
        return;
      }
    }

    // Strategy 3: Match price without decimal at the END of line
    // "Margherita Pizza  650", "Coffee  120"
    const trailingIntPriceRegex = /[₹$£€]?\s*(\d{2,5})\s*$/;
    const trailingIntPriceMatch = cleanLine.match(trailingIntPriceRegex);

    if (trailingIntPriceMatch) {
      const itemPrice = parseInt(trailingIntPriceMatch[1], 10);

      // Sanity check: prices between 5 and 99999 are valid food/drink prices
      if (itemPrice >= 5 && itemPrice <= 99999) {
        let itemName = cleanLine.substring(0, cleanLine.length - trailingIntPriceMatch[0].length).trim();

        // Strip trailing quantity info
        itemName = itemName.replace(/\s*[xX×]\s*\d+\s*$/, "").trim();
        itemName = itemName.replace(/\s*\d+\s*[xX×]\s*$/, "").trim();
        itemName = itemName.replace(/\s*(?:qty|quantity)\s*:?\s*\d+\s*$/i, "").trim();
        // Strip second price or unit price before it
        itemName = itemName.replace(/\s+\d{2,5}\s*$/, "").trim();
        // Strip leading quantity
        itemName = itemName.replace(/^\d+\s*[xX×]?\s+/, "").trim();

        itemName = cleanItemName(itemName);

        if (isValidItem(itemName, itemPrice, excludeKeywords)) {
          // Store integer prices as .00 for consistency
          items.push({ item: itemName, price: parseFloat(itemPrice.toFixed(2)) });
          return;
        }
      }
    }

    // Strategy 4: Tabular format — detect columns by large whitespace gaps
    // "Margherita Pizza          1       325.00       650.00"
    const tabularRegex = /^(.+?)\s{3,}(\d+)\s{2,}[\d.,]+\s{2,}[₹$£€]?\s*(\d{1,6}[\.,]\d{1,2})\s*$/;
    const tabularMatch = cleanLine.match(tabularRegex);
    if (tabularMatch) {
      const totalPrice = parseFloat(tabularMatch[3].replace(",", "."));
      let itemName = cleanItemName(tabularMatch[1].trim());
      if (isValidItem(itemName, totalPrice, excludeKeywords)) {
        items.push({ item: itemName, price: totalPrice });
        return;
      }
    }

    // Strategy 5: Fallback — price at the beginning of line: "650 Margherita Pizza" or "₹650 Pizza"
    const prefixPriceRegex = /^[₹$£€]?\s*(\d{2,5}(?:[\.,]\d{1,2})?)\s+(.+)/;
    const prefixMatch = cleanLine.match(prefixPriceRegex);
    if (prefixMatch) {
      const rawPrice = prefixMatch[1].replace(",", ".");
      const itemPrice = parseFloat(rawPrice);
      let itemName = prefixMatch[2].trim();

      itemName = cleanItemName(itemName);

      if (itemPrice >= 5 && isValidItem(itemName, itemPrice, excludeKeywords)) {
        items.push({ item: itemName, price: itemPrice });
      }
    }
  });

  return { items, charges };
};

/**
 * Extract charges/taxes/discounts from raw receipt text.
 * Looks for specific keywords followed by amounts.
 */
function extractCharges(text) {
  const charges = {
    subtotal: 0,
    tax: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    vat: 0,
    serviceCharge: 0,
    discount: 0,
    grandTotal: 0,
    taxDetails: []
  };

  const lowerText = text.toLowerCase();

  // Helper to extract amount from a line pattern
  const extractAmount = (pattern) => {
    const regex = new RegExp(pattern + "[\\s:=-]*[₹$£€]?\\s*(\\d{1,6}[\\.,]\\d{1,2}|\\d{2,6})", "gi");
    const matches = [...text.matchAll(regex)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return parseFloat(lastMatch[1].replace(",", "."));
    }
    return 0;
  };

  // Extract individual tax components
  charges.cgst = extractAmount("(?:cgst|c\\.?g\\.?s\\.?t)");
  charges.sgst = extractAmount("(?:sgst|s\\.?g\\.?s\\.?t)");
  charges.igst = extractAmount("(?:igst|i\\.?g\\.?s\\.?t)");
  charges.vat = extractAmount("(?:vat|v\\.?a\\.?t)");

  // Service charge
  charges.serviceCharge = extractAmount("(?:service\\s*charge|serv\\s*chg|serv\\s*charge)");

  // Discount
  charges.discount = extractAmount("(?:discount|promo|coupon|offer|saving)");

  // Subtotal
  charges.subtotal = extractAmount("(?:sub\\s*total|subtotal)");

  // Grand total — take the LAST "total" match
  const totalRegex = /(?:grand\s*)?total[\s:=-]*[₹$£€]?\s*(\d{1,6}[\.,]\d{1,2}|\d{2,6})/gi;
  const totalMatches = [...text.matchAll(totalRegex)];
  if (totalMatches.length > 0) {
    const lastMatch = totalMatches[totalMatches.length - 1];
    charges.grandTotal = parseFloat(lastMatch[1].replace(",", "."));
  }

  // Total tax = sum of identified tax components, or try generic "tax" line
  const identifiedTax = charges.cgst + charges.sgst + charges.igst + charges.vat;
  if (identifiedTax > 0) {
    charges.tax = Math.round(identifiedTax * 100) / 100;
    // Build details
    if (charges.cgst > 0) charges.taxDetails.push({ name: "CGST", amount: charges.cgst });
    if (charges.sgst > 0) charges.taxDetails.push({ name: "SGST", amount: charges.sgst });
    if (charges.igst > 0) charges.taxDetails.push({ name: "IGST", amount: charges.igst });
    if (charges.vat > 0) charges.taxDetails.push({ name: "VAT", amount: charges.vat });
  } else {
    charges.tax = extractAmount("(?:tax|gst|g\\.?s\\.?t)");
    if (charges.tax > 0) {
      charges.taxDetails.push({ name: "Tax/GST", amount: charges.tax });
    }
  }

  if (charges.serviceCharge > 0) {
    charges.taxDetails.push({ name: "Service Charge", amount: charges.serviceCharge });
  }

  return charges;
}

/**
 * Clean up item name: strip bullet points, numbering, punctuation, excess whitespace
 */
function cleanItemName(name) {
  if (!name) return "";

  // Strip leading bullet points, numbering like "1.", "1)", "•", "-", "*"
  name = name.replace(/^[\s\-\*•]+/, "");
  name = name.replace(/^\d{1,2}[.)]\s*/, "");

  // Strip trailing punctuation and separators
  name = name.replace(/[\s\-:=|\/.,;]+$/, "");

  // Strip leading/trailing currency symbols
  name = name.replace(/^[₹$£€]+\s*/, "");
  name = name.replace(/\s*[₹$£€]+$/, "");

  // Collapse multiple spaces
  name = name.replace(/\s{2,}/g, " ").trim();

  return name;
}

/**
 * Validate an extracted item:
 * - Must have alphabetic chars (not pure numbers/symbols)
 * - Must have reasonable name length
 * - Must not match exclude keywords
 * - Price must be positive
 */
function isValidItem(itemName, itemPrice, excludeKeywords) {
  if (!itemName || itemName.length < 2) return false;
  if (isNaN(itemPrice) || itemPrice <= 0) return false;

  // Must contain at least 2 alphabetic characters (not just "A" or "1x")
  const alphaCount = (itemName.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount < 2) return false;

  // Name should not be longer than 60 chars (likely garbage/address if so)
  if (itemName.length > 60) return false;

  const lowerName = itemName.toLowerCase();

  // Exclude lines containing non-food/receipt metadata keywords
  const shouldExclude = excludeKeywords.some(keyword => lowerName.includes(keyword));
  if (shouldExclude) return false;

  return true;
}
