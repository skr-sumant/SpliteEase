const categoryKeywords = {
  Food: [
    "pizza",
    "burger",
    "restaurant",
    "zomato",
    "swiggy",
    "cafe",
    "coffee",
    "starbucks",
    "dinner",
    "lunch",
    "breakfast",
    "food",
    "mcdonald"
  ],
  Transport: [
    "uber",
    "ola",
    "metro",
    "fuel",
    "petrol",
    "cab",
    "ride",
    "train",
    "bus",
    "flight",
    "ticket"
  ],
  Entertainment: [
    "movie",
    "netflix",
    "spotify",
    "gaming",
    "concert",
    "show",
    "cinema",
    "club",
    "bar"
  ],
  Shopping: [
    "amazon",
    "flipkart",
    "mall",
    "cloth",
    "shoes",
    "groceries",
    "supermarket"
  ]
};

export const classifyExpense = (title) => {
  if (!title) return "Other";
  const lowerTitle = title.toLowerCase();

  for (const category in categoryKeywords) {
    const keywords = categoryKeywords[category];
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return category;
      }
    }
  }

  return "Other";
};
