class JobDescription:
    def __init__(self, job_id, title, description):
        self.job_id = job_id
        self.title = title
        self.description = description

class ApplicantCV:
    def __init__(self, applicant_id, name, skills, experience):
        self.applicant_id = applicant_id
        self.name = name
        self.skills = skills
        self.experience = experience