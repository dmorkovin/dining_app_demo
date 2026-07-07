-- Add missing primary keys (required for PostgREST to resolve FK relationships)
ALTER TABLE stations ADD PRIMARY KEY (id);
ALTER TABLE menu_items ADD PRIMARY KEY (id);
ALTER TABLE orders ADD PRIMARY KEY (id);
ALTER TABLE order_items ADD PRIMARY KEY (id);

-- Add FK: orders.station_id → stations.id
ALTER TABLE orders
  ADD CONSTRAINT orders_station_id_fkey
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL;

-- Add FK: order_items.order_id → orders.id
ALTER TABLE order_items
  ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Add FK: order_items.menu_item_id → menu_items.id
ALTER TABLE order_items
  ADD CONSTRAINT order_items_menu_item_id_fkey
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;
