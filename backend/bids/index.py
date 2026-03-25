"""API для аукциона — ставки монтажных бригад на заказы"""

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
            query_params = event.get('queryStringParameters') or {}
            order_id = query_params.get('order_id')

            if not order_id:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'order_id is required'}, ensure_ascii=False),
                }

            cursor.execute("""
                SELECT *
                FROM t_p11137504_quantum_tech_initiat.bids
                WHERE order_id = %s
                ORDER BY price ASC
            """, (order_id,))
            rows = cursor.fetchall()
            bids = []
            for row in rows:
                bid = dict(row)
                for key, value in bid.items():
                    if hasattr(value, 'isoformat'):
                        bid[key] = value.isoformat()
                    elif value is not None and not isinstance(value, (str, int, float, bool, list, dict)):
                        bid[key] = str(value)
                bids.append(bid)
            cursor.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'bids': bids}, ensure_ascii=False),
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('order_id')
            brigade_name = body.get('brigade_name')
            brigade_phone = body.get('brigade_phone')
            price = body.get('price')
            comment = body.get('comment', '')

            cursor.execute("""
                INSERT INTO t_p11137504_quantum_tech_initiat.bids
                    (order_id, brigade_name, brigade_phone, price, comment)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (order_id, brigade_name, brigade_phone, price, comment))
            row = cursor.fetchone()
            conn.commit()
            bid = dict(row)
            for key, value in bid.items():
                if hasattr(value, 'isoformat'):
                    bid[key] = value.isoformat()
                elif value is not None and not isinstance(value, (str, int, float, bool, list, dict)):
                    bid[key] = str(value)
            cursor.close()
            conn.close()
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'bid': bid}, ensure_ascii=False),
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