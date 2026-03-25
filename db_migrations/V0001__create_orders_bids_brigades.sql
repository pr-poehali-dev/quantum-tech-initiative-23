
CREATE TABLE IF NOT EXISTS t_p11137504_quantum_tech_initiat.orders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  area NUMERIC NOT NULL,
  ceiling_type TEXT DEFAULT 'Матовый',
  comment TEXT DEFAULT '',
  city TEXT DEFAULT '',
  calculated_price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p11137504_quantum_tech_initiat.bids (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES t_p11137504_quantum_tech_initiat.orders(id),
  brigade_name TEXT NOT NULL,
  brigade_phone TEXT NOT NULL,
  price NUMERIC NOT NULL,
  comment TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p11137504_quantum_tech_initiat.brigades (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
