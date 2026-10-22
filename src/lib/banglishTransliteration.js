/*
 * Banglish-to-Bangla transliteration adapted from bn-translit.
 * Original project: https://github.com/shahjalal-bu/bn-translit
 * Copyright (c) 2026 Md Shahjalal — MIT License.
 * Adapted for client-side recipe search; no runtime dependency.
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

const CONSONANTS = [
  ["cch", "চ্চ"], ["chh", "ছ"],
  ["kh", "খ"], ["gh", "ঘ"], ["ch", "চ"], ["jh", "ঝ"],
  ["th", "থ"], ["dh", "ধ"], ["ph", "ফ"], ["bh", "ভ"],
  ["sh", "শ"], ["ng", "ং"],
  ["k", "ক"], ["g", "গ"], ["j", "জ"], ["t", "ত"], ["d", "দ"],
  ["n", "ন"], ["p", "প"], ["f", "ফ"], ["b", "ব"], ["m", "ম"],
  ["r", "র"], ["l", "ল"], ["s", "স"], ["h", "হ"], ["y", "য়"],
  ["w", "ও"], ["v", "ভ"], ["z", "জ"], ["c", "ক"], ["q", "ক"], ["x", "ক্স"]
];

const VOWELS = [
  ["aa", "আ", "া"], ["ee", "ঈ", "ী"], ["oo", "ঊ", "ূ"],
  ["ou", "ঔ", "ৌ"], ["oi", "ঐ", "ৈ"],
  ["a", "আ", "া"], ["i", "ই", "ি"], ["u", "উ", "ু"],
  ["e", "এ", "ে"], ["o", "ও", "ো"]
];

const DIACRITICS = new Set(["ং", "ঃ", "ঁ"]);

/**
 * Convert a Romanized Bengali word or phrase to a search-oriented Bangla form.
 * This is phonetic and intentionally heuristic; the original query is always
 * searched too, so transliteration never replaces the user's actual spelling.
 */
export function toBangla(input) {
  if (!input) return "";
  const lower = String(input).toLowerCase();
  let out = "";
  let i = 0;
  let previousWasConsonant = false;
  let previousConsonantKey = null;

  while (i < lower.length) {
    let matched = false;
    for (const [key, value] of CONSONANTS) {
      if (!lower.startsWith(key, i)) continue;
      const isDiacritic = DIACRITICS.has(value);
      if (previousWasConsonant && !isDiacritic && previousConsonantKey === key) {
        out += "্";
      }
      out += value;
      previousWasConsonant = !isDiacritic;
      previousConsonantKey = isDiacritic ? null : key;
      i += key.length;
      matched = true;
      break;
    }
    if (matched) continue;

    for (const [key, full, kar] of VOWELS) {
      if (!lower.startsWith(key, i)) continue;
      out += previousWasConsonant ? kar : full;
      previousWasConsonant = false;
      previousConsonantKey = null;
      i += key.length;
      matched = true;
      break;
    }
    if (matched) continue;

    out += lower[i];
    if (!/[a-z]/.test(lower[i])) {
      previousWasConsonant = false;
      previousConsonantKey = null;
    }
    i++;
  }
  return out;
}
