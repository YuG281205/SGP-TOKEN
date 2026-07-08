import re

FILLER_WORDS = [
    "please",
    "kindly",
    "i would like you to",
    "i want you to",
    "could you",
    "can you",
    "would you",
    "if possible",
    "i would appreciate",
    "it would be great if",
    "i need you to",
]

PHRASE_REPLACEMENTS = {
    "in order to": "to",
    "with the help of": "using",
    "at this point in time": "now",
    "due to the fact that": "because",
    "for the purpose of": "for",
    "a large number of": "many",
    "a small number of": "few",
    "make use of": "use",
    "provide an explanation of": "explain",
    "give an explanation of": "explain",
    "carry out": "perform",
    "has the ability to": "can",
    "is able to": "can",
    "in the event that": "if",
    "prior to": "before",
    "subsequent to": "after",
    "as well as": "and",
}

# Sort longest-first so overlapping phrases don't get partially matched.
_FILLER_SORTED = sorted(FILLER_WORDS, key=len, reverse=True)
_PHRASE_SORTED = sorted(PHRASE_REPLACEMENTS.keys(), key=len, reverse=True)

# Compiled once, at import time.
# Also swallow a trailing comma/space so we don't leave orphaned punctuation
# like ", explain that" after stripping "could you".
FILLER_PATTERN = re.compile(
    r"\b(?:" + "|".join(re.escape(w) for w in _FILLER_SORTED) + r")\b[,]?\s*",
    re.IGNORECASE,
)

PHRASE_PATTERN = re.compile(
    r"\b(?:" + "|".join(re.escape(p) for p in _PHRASE_SORTED) + r")\b",
    re.IGNORECASE,
)

# Lowercase key -> replacement, for the phrase-replacement callback.
_PHRASE_LOOKUP = {k.lower(): v for k, v in PHRASE_REPLACEMENTS.items()}

# Common abbreviations that shouldn't be treated as sentence boundaries.
_ABBREVIATIONS = {
    "mr.", "mrs.", "ms.", "dr.", "prof.", "sr.", "jr.",
    "vs.", "etc.", "e.g.", "i.e.", "fig.", "no.", "approx.",
}


def normalize_whitespace(text):
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_filler_words(text):
    text = FILLER_PATTERN.sub("", text)
    # Clean up any leading punctuation/space left behind after a strip,
    # e.g. "Hello, please explain" -> "Hello,  explain" -> "Hello explain"
    text = re.sub(r"\s*,\s*", ", ", text)
    text = re.sub(r"^\s*,\s*", "", text)
    text = re.sub(r",\s*([.!?])", r"\1", text)
    return text


def replace_common_phrases(text):
    def _replace(match):
        return _PHRASE_LOOKUP[match.group(0).lower()]

    return PHRASE_PATTERN.sub(_replace, text)


def remove_repeated_punctuation(text):
    # Handles both same-character runs ("!!!") and mixed runs ("!?!", "?!.")
    return re.sub(r"([!?.,])[!?.,]*", r"\1", text)


def _looks_like_abbreviation(sentence_end_fragment):
    """Check whether the text right before a split point is a known abbreviation."""
    tail = sentence_end_fragment.strip().split(" ")[-1].lower()
    return tail in _ABBREVIATIONS


def _split_sentences(text):
    # Split on sentence-ending punctuation followed by whitespace,
    # but avoid splitting on decimals (3.14) or known abbreviations (Dr. Smith).
    raw_parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'])', text)

    merged = []
    for part in raw_parts:
        if merged and _looks_like_abbreviation(merged[-1]):
            merged[-1] = merged[-1] + " " + part
        else:
            merged.append(part)
    return merged


def remove_duplicate_sentences(text):
    sentences = _split_sentences(text)

    seen = set()
    result = []

    for sentence in sentences:
        key = sentence.strip().lower()

        if key and key not in seen:
            seen.add(key)
            result.append(sentence.strip())

    return " ".join(result)


def remove_extra_spaces(text):
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([.,!?])", r"\1", text)
    return text.strip()


def fix_capitalization(text):
    """Ensure each sentence starts with an uppercase letter (filler removal
    can otherwise leave a sentence starting mid-word/lowercase)."""
    sentences = _split_sentences(text)
    fixed = []
    for s in sentences:
        s = s.strip()
        if s:
            s = s[0].upper() + s[1:]
        fixed.append(s)
    return " ".join(fixed)


def optimize_prompt_locally(prompt):
    prompt = normalize_whitespace(prompt)
    prompt = remove_filler_words(prompt)
    prompt = replace_common_phrases(prompt)
    prompt = remove_repeated_punctuation(prompt)
    prompt = remove_duplicate_sentences(prompt)
    prompt = remove_extra_spaces(prompt)
    prompt = fix_capitalization(prompt)

    return prompt


