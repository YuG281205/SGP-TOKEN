from benchmark import GeminiBenchmark

API_KEY = "AQ.Ab8RN6Kd7CQzwGkLldb9eZ6V7s_rWzzxgUkqnoLYFJAGmC-qiw"

benchmark = GeminiBenchmark(API_KEY)

original = """
Explain Binary Search with an example.
"""

optimized = """
Explain Binary Search using a simple example suitable for beginners.
"""

result = benchmark.compare(
    original_prompt=original,
    optimized_prompt=optimized,
)

from pprint import pprint
pprint(result)