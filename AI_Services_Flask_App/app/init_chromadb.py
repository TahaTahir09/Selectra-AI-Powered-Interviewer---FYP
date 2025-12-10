from chromadb import Client
from chromadb.config import Settings

def initialize_chromadb():
    persist_dir = "../chromadb_data"  # or any directory you want for persistence
    client = Client(Settings(
        persist_directory=persist_dir
    ))
    # Create or get the collection for job descriptions
    collection = client.get_or_create_collection("job_descriptions")
    print(f"ChromaDB collection 'job_descriptions' initialized at {persist_dir}.")

if __name__ == "__main__":
    initialize_chromadb()