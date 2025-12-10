# Flask ChromaDB Application

This project is a Flask application that allows users to submit job descriptions and CVs, vectorizes them using ChromaDB, and compares the CVs against specific job descriptions to return a similarity score.

## Project Structure

```
flask-chromadb-app
├── app
│   ├── __init__.py
│   ├── routes.py
│   ├── chromadb_utils.py
│   ├── vectorizer.py
│   └── models.py
├── requirements.txt
├── config.py
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd flask-chromadb-app
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Configuration

Edit the `config.py` file to set up your database connection details and any other necessary configurations.

## Usage

1. Start the Flask application:
   ```
   flask run
   ```

2. Use the following endpoints:
   - **POST /job**: Submit a job description. The request body should contain the job description.
   - **POST /cv**: Submit a CV. The request body should contain the CV text and the job ID to compare against.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

