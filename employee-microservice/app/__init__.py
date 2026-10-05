import os
from flask import Flask, jsonify
from flask_cors import CORS
from app.database import db

def create_app(test_config=None):
    app = Flask(__name__)

    default_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'instance', 'restaurant_pos.db'))
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', f'sqlite:///{default_db_path}'
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
            'service': 'employee-microservice',
            'port': 5002
        }), 200

    # Register Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.cashier_routes import cashier_bp
    from app.routes.admin_menu_routes import admin_menu_bp
    from app.routes.admin_report_routes import admin_report_bp
    from app.routes.admin_target_routes import admin_target_bp
    from app.routes.table_routes import table_bp
    from app.routes.payment_webhook import webhook_bp

    # Prefix /api/employee
    app.register_blueprint(auth_bp, url_prefix='/api/employee')
    app.register_blueprint(cashier_bp, url_prefix='/api/employee')
    app.register_blueprint(admin_menu_bp, url_prefix='/api/employee')
    app.register_blueprint(admin_report_bp, url_prefix='/api/employee')
    app.register_blueprint(admin_target_bp, url_prefix='/api/employee')
    app.register_blueprint(table_bp, url_prefix='/api/employee')
    app.register_blueprint(webhook_bp, url_prefix='/api/employee')

    # Alias /api/* untuk kompatibilitas direct
    app.register_blueprint(auth_bp, url_prefix='/api', name='emp_api_auth')
    app.register_blueprint(cashier_bp, url_prefix='/api', name='emp_api_cashier')
    app.register_blueprint(admin_menu_bp, url_prefix='/api', name='emp_api_menu')
    app.register_blueprint(admin_report_bp, url_prefix='/api', name='emp_api_report')
    app.register_blueprint(admin_target_bp, url_prefix='/api', name='emp_api_target')
    app.register_blueprint(table_bp, url_prefix='/api', name='emp_api_table')
    app.register_blueprint(webhook_bp, url_prefix='/api', name='emp_api_webhook')

    with app.app_context():
        db.create_all()

    return app
