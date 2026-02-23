from flask import Flask
from flask_cors import CORS
from .routes import main as routes
from flasgger import Swagger

def create_app():
    app = Flask(__name__)
    app.config.from_object('config')
    
    # Enable CORS for all routes (allow React frontend)
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Initialize Swagger
    Swagger(app)

    # Register blueprints
    app.register_blueprint(routes)

    return app