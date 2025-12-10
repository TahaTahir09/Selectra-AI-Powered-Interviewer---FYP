from chromadb import Client
from chromadb.config import Settings
import os

def get_chroma_client():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    persist_dir = os.path.join(base_dir, "../chromadb_data")
    persist_dir = os.path.abspath(persist_dir)
    os.makedirs(persist_dir, exist_ok=True)
    return Client(Settings(persist_directory=persist_dir))

def save_job_description(job_description):
    client = get_chroma_client()
    collection = client.get_or_create_collection("job_descriptions")
    job_id = str(abs(hash(job_description)))
    collection.add(documents=[job_description], ids=[job_id])
    return job_id

def get_job_description(job_id):
    client = get_chroma_client()
    collection = client.get_collection("job_descriptions")
    result = collection.get(ids=[str(job_id)])
    if result['documents']:
        return result['documents'][0]
    return None