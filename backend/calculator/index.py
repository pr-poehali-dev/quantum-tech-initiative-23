"""Калькулятор стоимости натяжного потолка"""

import json


PRICES_PER_M2 = {
    "Матовый": 450,
    "Глянцевый": 550,
    "Сатиновый": 500,
    "Тканевый": 650,
    "Парящий": 750,
}

INSTALLATION_FEE = 1500
MINIMUM_PRICE = 3000


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
    method = event.get('httpMethod', 'POST')

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False),
        }

    try:
        body = json.loads(event.get('body', '{}'))
        area = body.get('area')
        ceiling_type = body.get('ceiling_type')

        if area is None or ceiling_type is None:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'area and ceiling_type are required'}, ensure_ascii=False),
            }

        if ceiling_type not in PRICES_PER_M2:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': f'Unknown ceiling_type. Available types: {", ".join(PRICES_PER_M2.keys())}'
                }, ensure_ascii=False),
            }

        area = float(area)
        price_per_m2 = PRICES_PER_M2[ceiling_type]
        subtotal = max(area * price_per_m2, MINIMUM_PRICE)
        installation = INSTALLATION_FEE
        total = subtotal + installation

        result = {
            'price_per_m2': price_per_m2,
            'area': area,
            'ceiling_type': ceiling_type,
            'subtotal': subtotal,
            'installation': installation,
            'total': total,
            'price_range': {
                'min': round(total * 0.85, 2),
                'max': round(total * 1.15, 2),
            },
        }

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result, ensure_ascii=False),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
        }
