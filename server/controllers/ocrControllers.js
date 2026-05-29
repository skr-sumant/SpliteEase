import Tesseract from "tesseract.js";
import { parseReceiptText } from "../utils/receiptParser.js";
import { reconcile, safeRound } from "../utils/reconciler.js";
import path from "path";

// 📷 Scan Receipt — Enhanced with reconciliation, confidence, and charge extraction
export const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No receipt image uploaded."
      });
    }

    // Uploaded image path
    const imagePath = req.file.path;

    // Use trained data from local file for faster/offline support
    const langPath = path.resolve(".");

    // OCR Processing with tuned parameters for receipts
    const result = await Tesseract.recognize(
      imagePath,
      "eng",
      {
        langPath,
        tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ₹$.,/-:()x×&@#%+='\"!?",
        tessedit_pageseg_mode: "6",  // Assume a single uniform block of text (best for receipts)
        preserve_interword_spaces: "1"
      }
    );

    const extractedText = result.data.text;

    // Parse receipt text into structured items + charges
    const parsed = parseReceiptText(extractedText);
    const items = parsed.items || [];
    const charges = parsed.charges || {};

    // Calculate total from items
    const itemsTotal = safeRound(items.reduce((sum, item) => sum + item.price, 0));

    // Use the extracted grand total, or fall back to items total
    let grandTotal = charges.grandTotal || itemsTotal;

    // If no grand total was extracted from charges, try legacy regex on raw text
    if (!charges.grandTotal || charges.grandTotal === 0) {
      const totalRegex = /(?:grand\s*)?total[\s:=-]*[₹$£€]?\s*(\d{1,6}[\.,]\d{1,2}|\d{2,6})/gi;
      const totalMatches = [...extractedText.matchAll(totalRegex)];
      if (totalMatches.length > 0) {
        const lastMatch = totalMatches[totalMatches.length - 1];
        const parsedTotal = parseFloat(lastMatch[1].replace(",", "."));
        if (parsedTotal > 0) {
          grandTotal = parsedTotal;
        }
      }
    }

    // Calculate estimated tax as difference between grand total and items sum
    const estimatedTax = Math.max(0, safeRound(grandTotal - itemsTotal));

    // Run reconciliation engine
    const reconciliation = reconcile({
      items,
      grandTotal,
      itemsTotal,
      estimatedTax,
      charges
    });

    res.json({
      success: true,
      text: extractedText,

      // Original parsed data
      items,
      grandTotal,
      itemsTotal,
      estimatedTax,

      // Enhanced: structured charges
      charges,

      // Enhanced: reconciliation result
      reconciliation: {
        status: reconciliation.status,
        reconciled: reconciliation.reconciled,
        confidence: reconciliation.confidence,
        adjustedItems: reconciliation.items,
        adjustedTotal: reconciliation.adjustedTotal,
        finalTotal: reconciliation.finalTotal,
        difference: reconciliation.difference,
        duplicates: reconciliation.duplicates,
        warnings: reconciliation.warnings,
        suggestions: reconciliation.suggestions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 🔄 Re-reconcile — Accept user-edited items and validate against total
export const reconcileReceipt = async (req, res) => {
  try {
    const { items, grandTotal, charges } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Items array is required."
      });
    }

    const itemsTotal = safeRound(items.reduce((sum, item) => sum + (item.price || 0), 0));
    const effectiveGrandTotal = grandTotal || itemsTotal;
    const estimatedTax = Math.max(0, safeRound(effectiveGrandTotal - itemsTotal));

    const reconciliation = reconcile({
      items,
      grandTotal: effectiveGrandTotal,
      itemsTotal,
      estimatedTax,
      charges: charges || {}
    });

    res.json({
      success: true,
      reconciliation: {
        status: reconciliation.status,
        reconciled: reconciliation.reconciled,
        confidence: reconciliation.confidence,
        adjustedItems: reconciliation.items,
        adjustedTotal: reconciliation.adjustedTotal,
        finalTotal: reconciliation.finalTotal,
        difference: reconciliation.difference,
        duplicates: reconciliation.duplicates,
        warnings: reconciliation.warnings,
        suggestions: reconciliation.suggestions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
