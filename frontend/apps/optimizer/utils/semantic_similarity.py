from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")


def calculate_semantic_accuracy(original_prompt, optimized_prompt):

    original_embedding = model.encode([original_prompt])

    optimized_embedding = model.encode([optimized_prompt])

    similarity = cosine_similarity(
        original_embedding,
        optimized_embedding
    )[0][0]

    return float(round(float(similarity) * 100, 2))