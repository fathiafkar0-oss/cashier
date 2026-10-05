import os
from flask import Flask, jsonify
from flask_cors import CORS
from app.database import db

def create_app(test_config=None):
    app = Flask(__name__)

    # Default configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'sqlite:///restaurant_pos.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get(
        'JWT_SECRET_KEY', 'restaurant_pos_super_secret_jwt_key_2026'
    )

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    CORS(app)

    # Health Check Endpoint Wajib Rubrik AWS
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'customer-microservice',
            'port': 5001
        }), 200

    # Daftarkan Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.table_routes import table_bp
    from app.routes.menu_routes import menu_bp
    from app.routes.order_routes import order_bp
    from app.routes.payment_routes import payment_bp

    # Mendaftarkan rute dengan prefix /api/customer dan /api
    app.register_blueprint(auth_bp, url_prefix='/api/customer')
    app.register_blueprint(table_bp, url_prefix='/api/customer')
    app.register_blueprint(menu_bp, url_prefix='/api/customer')
    app.register_blueprint(order_bp, url_prefix='/api/customer')
    app.register_blueprint(payment_bp, url_prefix='/api/customer')

    # Alias /api/* untuk kompatibilitas direct call
    app.register_blueprint(auth_bp, url_prefix='/api', name='api_auth')
    app.register_blueprint(table_bp, url_prefix='/api', name='api_table')
    app.register_blueprint(menu_bp, url_prefix='/api', name='api_menu')
    app.register_blueprint(order_bp, url_prefix='/api', name='api_order')
    app.register_blueprint(payment_bp, url_prefix='/api', name='api_payment')

    with app.app_context():
        db.create_all()

    return app
