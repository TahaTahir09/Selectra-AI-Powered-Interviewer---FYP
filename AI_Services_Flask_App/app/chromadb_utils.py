import chromadb
from chromadb.config import Settings
import os
import uuid
from datetime import datetime

def get_chroma_client():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    persist_dir = os.path.join(base_dir, "../chromadb_data")
    persist_dir = os.path.abspath(persist_dir)
    os.makedirs(persist_dir, exist_ok=True)
    # Use PersistentClient for ChromaDB 1.x
    return chromadb.PersistentClient(path=persist_dir)

def save_job_description(job_description, job_id=None):
    """
    Save job description to ChromaDB
    Args:
        job_description: The job description text
        job_id: Optional job ID (if not provided, will generate from hash)
    Returns:
        job_id: The ID of the saved job
    """
    client = get_chroma_client()
    collection = client.get_or_create_collection("job_descriptions")
    
    if not job_id:
        job_id = str(abs(hash(job_description)))
    
    # Add metadata
    metadata = {
        "created_at": datetime.now().isoformat(),
        "type": "job_description"
    }
    
    collection.add(
        documents=[job_description], 
        ids=[str(job_id)],
        metadatas=[metadata]
    )
    print(f"✓ Job {job_id} saved to ChromaDB")
    return job_id

def get_job_description(job_id):
    """Retrieve job description from ChromaDB"""
    client = get_chroma_client()
    try:
        collection = client.get_or_create_collection("job_descriptions")
        result = collection.get(ids=[str(job_id)])
        if result['documents']:
            return result['documents'][0]
    except Exception as e:
        print(f"Error retrieving job description: {e}")
    return None

def save_application(cv_text, application_id=None, metadata=None):
    """
    Save application CV text to ChromaDB
    Args:
        cv_text: The extracted CV text
        application_id: Optional application ID (if not provided, will generate UUID)
        metadata: Optional metadata dict (candidate_name, job_id, etc.)
    Returns:
        application_id: The ID of the saved application
    """
    client = get_chroma_client()
    collection = client.get_or_create_collection("applications")
    
    if not application_id:
        application_id = str(uuid.uuid4())
    
    # Default metadata
    app_metadata = {
        "created_at": datetime.now().isoformat(),
        "type": "application"
    }
    
    # Merge with provided metadata
    if metadata:
        app_metadata.update(metadata)
    
    collection.add(
        documents=[cv_text], 
        ids=[str(application_id)],
        metadatas=[app_metadata]
    )
    print(f"✓ Application {application_id} saved to ChromaDB")
    return application_id

def get_application(application_id):
    """Retrieve application CV text from ChromaDB"""
    client = get_chroma_client()
    try:
        collection = client.get_collection("applications")
        result = collection.get(ids=[str(application_id)])
        if result['documents']:
            return {
                'cv_text': result['documents'][0],
                'metadata': result['metadatas'][0] if result['metadatas'] else None
            }
    except Exception as e:
        print(f"Error retrieving application: {e}")
    return None

def search_similar_applications(query_text, job_id=None, n_results=10):
    """
    Search for similar applications using semantic search
    Args:
        query_text: The query text (e.g., job description or requirements)
        job_id: Optional job ID to filter by
        n_results: Number of results to return
    Returns:
        List of similar applications with scores
    """
    client = get_chroma_client()
    try:
        collection = client.get_collection("applications")
        
        where_filter = None
        if job_id:
            where_filter = {"job_id": str(job_id)}
        
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where_filter if where_filter else None
        )
        
        return results
    except Exception as e:
        print(f"Error searching applications: {e}")
    return None