import json
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── Load dataset ──────────────────────────────────────────────
with open("job_roles.json") as f:
    job_roles = json.load(f)

# ── 1. NLP Synonym Map — handles abbreviations & aliases ──────
SKILL_SYNONYMS = {
    "js":             "javascript",
    "ts":             "typescript",
    "py":             "python",
    "ml":             "machine learning",
    "dl":             "deep learning",
    "cv":             "computer vision",
    "tf":             "tensorflow",
    "node":           "node.js",
    "nodejs":         "node.js",
    "react.js":       "react",
    "reactjs":        "react",
    "vue":            "vue.js",
    "vuejs":          "vue.js",
    "sb":             "spring boot",
    "postgres":       "postgresql",
    "mongo":          "mongodb",
    "k8s":            "kubernetes",
    "ai":             "machine learning",
    "data viz":       "data visualization",
    "stats":          "statistics",
    "rest":           "rest api",
    "api":            "rest api",
    "micro":          "microservices",
}

def normalize_skill(skill):
    """Normalize skill using synonym map."""
    s = skill.lower().strip()
    return SKILL_SYNONYMS.get(s, s)

# ── 2. TF-IDF Vectorizer — weighted skill importance ──────────
def build_tfidf_vectors(user_skills, job_skills):
    """Convert skill sets into TF-IDF weighted vectors."""
    # Combine all skills into documents
    user_doc = " ".join(user_skills)
    job_doc  = " ".join(job_skills)

    if not user_doc.strip() or not job_doc.strip():
        return None, None

    vectorizer = TfidfVectorizer()
    try:
        tfidf_matrix = vectorizer.fit_transform([user_doc, job_doc])
        return tfidf_matrix[0], tfidf_matrix[1]
    except Exception:
        return None, None

# ── 3. Cosine Similarity — fuzzy skill matching ───────────────
def cosine_similarity_score(user_vec, job_vec):
    """Compute cosine similarity between user and job skill vectors."""
    if user_vec is None or job_vec is None:
        return 0.0
    sim = cosine_similarity(user_vec, job_vec)
    return float(sim[0][0])

def fuzzy_skill_match(user_skill, job_skill):
    """Check if two skills are similar using cosine similarity on characters."""
    if user_skill == job_skill:
        return True, 1.0

    # Character-level n-gram similarity for partial matches
    def char_ngrams(s, n=2):
        return set(s[i:i+n] for i in range(len(s) - n + 1))

    user_grams = char_ngrams(user_skill)
    job_grams  = char_ngrams(job_skill)

    if not user_grams or not job_grams:
        return False, 0.0

    intersection = user_grams & job_grams
    union        = user_grams | job_grams
    similarity   = len(intersection) / len(union)  # Jaccard similarity

    # Threshold: 0.6 means 60% character overlap → fuzzy match
    return similarity >= 0.6, round(similarity, 2)

# ── Main Analysis Function ─────────────────────────────────────
def analyze_skills(user_skills, role):

    # Step 1 — Normalize user skills with NLP synonym map
    normalized_user = [normalize_skill(s) for s in user_skills]

    # Step 2 — Find job role
    job = next((r for r in job_roles if r["role"].lower() == role.lower()), None)
    if not job:
        return {"error": "Role not found"}

    job_skills_list = job["skills"]  # already lowercase in JSON

    # Step 3 — Exact + Fuzzy matching (Cosine similarity on chars)
    matched_skills  = []
    missing_skills  = []
    fuzzy_matched   = []  # skills matched via fuzzy (not exact)

    for job_skill in job_skills_list:
        exact_match = job_skill in normalized_user
        if exact_match:
            matched_skills.append(job_skill)
        else:
            # Try fuzzy match against each user skill
            best_sim   = 0.0
            best_match = None
            for u_skill in normalized_user:
                is_match, sim = fuzzy_skill_match(u_skill, job_skill)
                if is_match and sim > best_sim:
                    best_sim   = sim
                    best_match = u_skill

            if best_match:
                matched_skills.append(job_skill)
                fuzzy_matched.append({
                    "user_skill":   best_match,
                    "matched_to":   job_skill,
                    "similarity":   best_sim
                })
            else:
                missing_skills.append(job_skill)

    # Step 4 — TF-IDF weighted score
    user_vec, job_vec = build_tfidf_vectors(normalized_user, job_skills_list)
    tfidf_score       = cosine_similarity_score(user_vec, job_vec) * 100

    # Step 5 — Base match score (exact + fuzzy matches)
    base_score = (len(matched_skills) / len(job_skills_list)) * 100

    # Step 6 — Blend: 70% base match + 30% TF-IDF similarity
    final_score = (base_score * 0.7) + (tfidf_score * 0.3)

    return {
        "role":           role,
        "match_score":    round(final_score, 2),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "fuzzy_matches":  fuzzy_matched,
        "tfidf_score":    round(tfidf_score, 2),
        "base_score":     round(base_score, 2),
    }

# ── Test ──────────────────────────────────────────────────────
if __name__ == "__main__":
    # Test 1: Exact match
    print("=== Test 1: Exact match ===")
    result = analyze_skills(["python", "sql", "pandas"], "Data Scientist")
    print(result)

    # Test 2: NLP synonym — 'js' should match 'javascript'
    print("\n=== Test 2: NLP Synonym (js → javascript) ===")
    result = analyze_skills(["js", "node", "sql", "rest api"], "Full Stack Developer")
    print(result)

    # Test 3: Fuzzy match — 'javascrip' should fuzzy match 'javascript'
    print("\n=== Test 3: Fuzzy match ===")
    result = analyze_skills(["javascrip", "reacts", "sql"], "Full Stack Developer")
    print(result) # trigger reload
