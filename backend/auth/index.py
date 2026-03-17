"""
Авторизация и регистрация пользователей Arkumesenger.
Принимает POST / с полем action: register | login | me | logout
"""
import json
import os
import hashlib
import secrets
import random
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

COLORS = ['#8B5CF6','#EC4899','#06B6D4','#D946EF','#F59E0B','#10B981','#EF4444','#3B82F6']

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token() -> str:
    return secrets.token_hex(32)

def ok(data: dict):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status: int = 400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = body.get('action', '')

    if action == 'register':
        name = (body.get('name') or '').strip()
        username = (body.get('username') or '').strip().lstrip('@').lower()
        phone = (body.get('phone') or '').strip()
        password = body.get('password') or ''

        if not name or not username or not password:
            return err('Заполните имя, имя пользователя и пароль')
        if len(password) < 6:
            return err('Пароль должен быть не менее 6 символов')
        if len(username) < 3:
            return err('Имя пользователя слишком короткое')

        color = random.choice(COLORS)
        pw_hash = hash_password(password)
        token = make_token()

        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            conn.close()
            return err('Имя пользователя уже занято')

        cur.execute(
            "INSERT INTO users (name, username, phone, password_hash, session_token, avatar_color) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, name, username, phone, avatar_color, created_at",
            (name, username, phone or None, pw_hash, token, color)
        )
        user = dict(cur.fetchone())
        conn.commit()
        conn.close()
        return ok({'token': token, 'user': user})

    if action == 'login':
        login = (body.get('login') or '').strip()
        password = body.get('password') or ''

        if not login or not password:
            return err('Введите логин и пароль')

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, username, phone, avatar_color, created_at FROM users WHERE (username = %s OR phone = %s OR email = %s) AND password_hash = %s",
            (login.lower().lstrip('@'), login, login, pw_hash)
        )
        user = cur.fetchone()
        if not user:
            conn.close()
            return err('Неверный логин или пароль')

        token = make_token()
        cur.execute("UPDATE users SET session_token = %s, is_online = TRUE, last_seen = NOW() WHERE id = %s", (token, user['id']))
        conn.commit()
        conn.close()
        return ok({'token': token, 'user': dict(user)})

    if action == 'me':
        token = body.get('token') or (event.get('headers') or {}).get('X-Session-Token') or (event.get('headers') or {}).get('x-session-token')
        if not token:
            return err('Токен не передан', 401)
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, name, username, phone, avatar_color, created_at, is_online FROM users WHERE session_token = %s", (token,))
        user = cur.fetchone()
        conn.close()
        if not user:
            return err('Сессия не найдена', 401)
        return ok({'user': dict(user)})

    if action == 'logout':
        token = body.get('token') or (event.get('headers') or {}).get('X-Session-Token')
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("UPDATE users SET session_token = NULL, is_online = FALSE WHERE session_token = %s", (token,))
            conn.commit()
            conn.close()
        return ok({'ok': True})

    return err('Неизвестное действие', 400)
