from flask import Flask
from .routes import main as routes
from flasgger import Swagger

def create_app():
    app = Flask(__name__)
    app.config.from_object('config')

    # Initialize Swagger
    Swagger(app)

    # Register blueprints
    app.register_blueprint(routes)

    return app