from chromadb import Client
from sklearn.feature_extraction.text import TfidfVectorizer

class Vectorizer:
    def __init__(self, db_url):
        self.client = Client(db_url)
        self.vectorizer = TfidfVectorizer()

    def vectorize_job_description(self, job_description):
        return self.vectorizer.fit_transform([job_description]).toarray()

    def vectorize_cv(self, cv):
        return self.vectorizer.transform([cv]).toarray()

    def save_job_description(self, job_id, job_description):
        vector = self.vectorize_job_description(job_description)
        self.client.save(job_id, vector)

    def compare_cv_with_job(self, job_id, cv):
        job_vector = self.client.retrieve(job_id)
        cv_vector = self.vectorize_cv(cv)
        score = self.calculate_similarity(job_vector, cv_vector)
        return score

    def calculate_similarity(self, job_vector, cv_vector):
        return (job_vector @ cv_vector.T).toarray()[0][0]