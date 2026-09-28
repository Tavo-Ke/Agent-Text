// Simple Spanish Stemmer (Snowball algorithm subset for basic plural/verb deduplication)
const StemmerES = {
  stem(word) {
    let w = word.toLowerCase();
    // Remove plural
    if (w.length > 3) {
      if (w.endsWith('s')) w = w.slice(0, -1);
      if (w.endsWith('e')) w = w.slice(0, -1);
    }
    return w;
  }
};
