from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Menu, MenuImage
from app.auth import token_required, roles_required

admin_menu_bp = Blueprint('employee_admin_menu', __name__)

@admin_menu_bp.route('/admin/menus', methods=['GET'])
@token_required
@roles_required(['admin'])
def get_all_menus_admin(current_user):
    category = request.args.get('category')
    include_inactive = request.args.get('include_inactive', 'true').lower() == 'true'

    query = Menu.query
    if not include_inactive:
        query = query.filter_by(is_active=True)
    if category:
        query = query.filter_by(category=category)

    menus = query.order_by(Menu.category, Menu.name).all()
    return jsonify({
        'success': True,
        'data': [m.to_admin_dict() for m in menus]
    }), 200

@admin_menu_bp.route('/admin/menus', methods=['POST'])
@token_required
@roles_required(['admin'])
def create_menu(current_user):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', 'Makanan').strip()
    price = data.get('price')
    cost_price = data.get('cost_price', 0)
    description = data.get('description', '')
    image_url = data.get('image_url', '')

    if not name or price is None:
        return jsonify({'success': False, 'message': 'Nama dan harga menu wajib diisi'}), 400

    try:
        price = int(price)
        cost_price = int(cost_price)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Format harga atau HPP harus angka bulat'}), 400

    if price < 0 or cost_price < 0:
        return jsonify({'success': False, 'message': 'Harga dan HPP tidak boleh negatif'}), 400

    menu = Menu(
        name=name,
        category=category,
        price=price,
        cost_price=cost_price,
        description=description,
        is_available=True,
        is_active=True
    )
    db.session.add(menu)
    db.session.flush()

    if image_url:
        img = MenuImage(menu_id=menu.id, image_url=image_url, is_primary=True)
        db.session.add(img)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Menu "{menu.name}" berhasil ditambahkan',
        'data': menu.to_admin_dict()
    }), 201

@admin_menu_bp.route('/admin/menus/<int:menu_id>', methods=['PUT'])
@token_required
@roles_required(['admin'])
def update_menu(current_user, menu_id):
    menu = Menu.query.filter_by(id=menu_id).first()
    if not menu:
        return jsonify({'success': False, 'message': 'Menu tidak ditemukan'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        menu.name = data['name'].strip()
    if 'category' in data:
        menu.category = data['category'].strip()
    if 'price' in data:
        menu.price = int(data['price'])
    if 'cost_price' in data:
        menu.cost_price = int(data['cost_price'])
    if 'description' in data:
        menu.description = data['description']
    if 'is_available' in data:
        menu.is_available = bool(data['is_available'])
    if 'is_active' in data:
        menu.is_active = bool(data['is_active'])

    if 'image_url' in data and data['image_url']:
        primary_img = MenuImage.query.filter_by(menu_id=menu.id, is_primary=True).first()
        if primary_img:
            primary_img.image_url = data['image_url']
        else:
            db.session.add(MenuImage(menu_id=menu.id, image_url=data['image_url'], is_primary=True))

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Menu "{menu.name}" berhasil diperbarui',
        'data': menu.to_admin_dict()
    }), 200

@admin_menu_bp.route('/admin/menus/<int:menu_id>', methods=['DELETE'])
@token_required
@roles_required(['admin'])
def delete_menu(current_user, menu_id):
    """Soft Delete Menu agar integritas histori transaksi lama tetap utuh"""
    menu = Menu.query.filter_by(id=menu_id).first()
    if not menu:
        return jsonify({'success': False, 'message': 'Menu tidak ditemukan'}), 404

    menu.is_active = False
    menu.is_available = False
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Menu "{menu.name}" berhasil dinonaktifkan (soft-delete)'
    }), 200
