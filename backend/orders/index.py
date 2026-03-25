"""API для управления заявками на монтаж натяжных потолков"""

import json
import os
import psycopg2
import psycopg2.extras


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    method = event.get('httpMethod', 'GET')

    try:
        db_url = os.environ['DATABASE_URL']
        separator = '&' if '?' in db_url else '?'
        db_url += separator + 'options=-csearch_path%3Dt_p11137504_quantum_tech_initiat'
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if method == 'GET':
            cursor.execute("""
                SELECT o.*, COUNT(b.id) as bids_count, MIN(b.price) as min_bid
                FROM t_p11137504_quantum_tech_initiat.orders o
                LEFT JOIN t_p11137504_quantum_tech_initiat.bids b ON b.order_id = o.id
                WHERE o.status = 'active'
                GROUP BY o.id
                ORDER BY o.created_at DESC
            """)
            rows = cursor.fetchall()
            orders = []
            for row in rows:
                order = dict(row)
                for key, value in order.items():
                    if hasattr(value, 'isoformat'):
                        order[key] = value.isoformat()
                    elif value is not None and not isinstance(value, (str, int, float, bool, list, dict)):
                        order[key] = str(value)
                orders.append(order)
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'orders': orders}, ensure_ascii=False),
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name')
            phone = body.get('phone')
            area = body.get('area')
            ceiling_type = body.get('ceiling_type')
            comment = body.get('comment', '')
            city = body.get('city', '')
            calculated_price = body.get('calculated_price')

            cursor.execute("""
                INSERT INTO t_p11137504_quantum_tech_initiat.orders
                    (name, phone, area, ceiling_type, comment, city, calculated_price, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')
                RETURNING *
            """, (name, phone, area, ceiling_type, comment, city, calculated_price))
            row = cursor.fetchone()
            conn.commit()
            order = dict(row)
            for key, value in order.items():
                if hasattr(value, 'isoformat'):
                    order[key] = value.isoformat()
                elif value is not None and not isinstance(value, (str, int, float, bool, list, dict)):
                    order[key] = str(value)
            cursor.close()
            conn.close()
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'order': order}, ensure_ascii=False),
            }

        else:
            cursor.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False),
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
        }