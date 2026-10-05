from flask import Blueprint, jsonify
from app.models import Menu

menu_bp = Blueprint('customer_menus', __name__)

@menu_bp.route('/menus', methods=['GET'])
def get_public_menus():
    """Mengembalikan daftar menu aktif & tersedia untuk katalog pelanggan (HPP disembunyikan murni)"""
    menus = Menu.query.filter_by(is_active=True, is_available=True).order_by(Menu.category, Menu.name).all()
    return jsonify({
        'success': True,
        'data': [m.to_customer_dict() for m in menus]
    }), 200

@menu_bp.route('/menus/<int:menu_id>', methods=['GET'])
def get_menu_detail(menu_id):
    menu = Menu.query.filter_by(id=menu_id, is_active=True).first()
    if not menu:
        return jsonify({'success': False, 'message': 'Menu tidak ditemukan'}), 404
    return jsonify({
        'success': True,
        'data': menu.to_customer_dict()
    }), 200
