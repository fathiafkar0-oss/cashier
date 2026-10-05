from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Table
from app.auth import token_required, roles_required

table_bp = Blueprint('employee_tables', __name__)

@table_bp.route('/tables', methods=['GET'])
@token_required
@roles_required(['cashier', 'admin'])
def get_tables_list(current_user):
    tables = Table.query.order_by(Table.table_number).all()
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in tables]
    }), 200

@table_bp.route('/admin/tables', methods=['GET'])
@token_required
@roles_required(['admin'])
def get_admin_tables(current_user):
    tables = Table.query.order_by(Table.table_number).all()
    return jsonify({
        'success': True,
        'data': [t.to_dict() for t in tables]
    }), 200

@table_bp.route('/admin/tables', methods=['POST'])
@token_required
@roles_required(['admin'])
def add_table(current_user):
    data = request.get_json() or {}
    table_number = data.get('table_number', '').strip()
    capacity = data.get('capacity', 4)

    if not table_number:
        return jsonify({'success': False, 'message': 'Nomor meja wajib diisi'}), 400

    existing = Table.query.filter_by(table_number=table_number).first()
    if existing:
        return jsonify({'success': False, 'message': f'Meja {table_number} sudah ada'}), 409

    new_table = Table(table_number=table_number, capacity=int(capacity), status='AVAILABLE')
    db.session.add(new_table)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Meja {table_number} berhasil ditambahkan',
        'data': new_table.to_dict()
    }), 201

@table_bp.route('/admin/tables/<int:table_id>', methods=['PUT'])
@token_required
@roles_required(['admin'])
def update_table(current_user, table_id):
    table = Table.query.filter_by(id=table_id).first()
    if not table:
        return jsonify({'success': False, 'message': 'Meja tidak ditemukan'}), 404

    data = request.get_json() or {}
    if 'table_number' in data:
        table.table_number = data['table_number'].strip()
    if 'capacity' in data:
        table.capacity = int(data['capacity'])
    if 'status' in data and data['status'] in ['AVAILABLE', 'OCCUPIED']:
        table.status = data['status']

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Meja {table.table_number} berhasil diperbarui',
        'data': table.to_dict()
    }), 200
