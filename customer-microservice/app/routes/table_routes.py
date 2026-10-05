from flask import Blueprint, jsonify
from app.models import Table

table_bp = Blueprint('customer_tables', __name__)

@table_bp.route('/tables/available', methods=['GET'])
def get_available_tables():
    """Mengembalikan daftar meja yang hanya berstatus AVAILABLE"""
    tables = Table.query.filter_by(status='AVAILABLE').order_by(Table.table_number).all()
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in tables]
    }), 200

@table_bp.route('/tables', methods=['GET'])
def get_all_tables():
    """Mengembalikan seluruh meja dengan status ketersediaannya (untuk grid meja pelanggan)"""
    tables = Table.query.order_by(Table.table_number).all()
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in tables]
    }), 200
