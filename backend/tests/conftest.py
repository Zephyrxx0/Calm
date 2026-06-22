import os

# Set testing environment variable so backend routes use the /api prefix during tests
os.environ["TESTING"] = "1"
