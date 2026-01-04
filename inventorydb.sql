-- CREATE ENTITIES
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,   
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    CONSTRAINT chk_role CHECK (role IN ('admin', 'user'))
);

CREATE TABLE Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE Items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    category_id INT,
    quantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    size VARCHAR(10) NOT NULL, 
    description TEXT,
    CONSTRAINT chk_size CHECK (size IN ('Small', 'Medium', 'Large')),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

CREATE TABLE Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    CONSTRAINT chk_status CHECK (status IN ('Pending', 'Shipped', 'Delivered', 'Cancelled')),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE OrderItems (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
);

CREATE TABLE Inventory_Logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    user_id INT NOT NULL,
    change_amount INT NOT NULL,
    change_type VARCHAR(20) NOT NULL,
    log_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT chk_change_type CHECK (change_type IN ('Restock', 'Sale', 'Correction', 'Damage')),
    FOREIGN KEY (item_id) REFERENCES Items(item_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- INSERT RECORDS INTO ENTITIES
INSERT INTO Users (username, email, password_hash, role) VALUES
('admin', 'admin@example.com', 'admin123@', 'admin'),
('ghali_user', 'mahmudghali01@gmail.com', 'mahmudghali123@', 'user'),
('john_doe', 'john@example.com', 'john123@', 'user');

INSERT INTO Categories (category_name, description) VALUES
('Electronics', 'Electronic gadgets and devices'),
('Clothing', 'Apparel and accessories'),
('Books', 'Various genres of books');

INSERT INTO Items (item_name, category_id, quantity, price, size, description) VALUES
('Smartphone', 1, 50, 350000.00, 'Medium', 'Latest model smartphone with advanced features'),
('Jeans', 2, 100, 25000.00, 'Large', 'Comfortable denim jeans'),
('Novel', 3, 200, 8500.00, 'Small', 'Bestselling fiction novel');

INSERT INTO Orders (user_id, order_date, total_amount, status) VALUES
(2, NOW(), 350000.00, 'Pending'),
(3, NOW(), 50000.00, 'Shipped');

INSERT INTO OrderItems (order_id, item_id, quantity, price) VALUES
(1, 1, 1, 350000.00),
(2, 2, 2, 25000.00);

INSERT INTO Inventory_Logs (item_id, user_id, change_amount, change_type, notes) VALUES
(1, 1, 50, 'Restock', 'Initial stock added'),
(2, 1, 100, 'Restock', 'Initial stock added'),
(3, 1, 200, 'Restock', 'Initial stock added'),
(1, 2, -1, 'Sale', 'Sold via order 1'),
(2, 2, -2, 'Sale', 'Sold via order 2');

-- Get all orders with user information
SELECT o.order_id, u.username, u.email, o.order_date, o.total_amount, o.status
FROM Orders o
JOIN Users u ON o.user_id = u.user_id;

-- Get all items with their category information
SELECT i.item_id, i.item_name, c.category_name, i.quantity, i.price, i.size
FROM Items i
JOIN Categories c ON i.category_id = c.category_id;


-- Update order status and log the change
UPDATE Orders SET status = 'Delivered' WHERE order_id = 1;
INSERT INTO Inventory_Logs (item_id, user_id, change_amount, change_type, notes)
SELECT oi.item_id, 1, -oi.quantity, 'Sale', CONCAT('Order ', oi.order_id, ' delivered')
FROM OrderItems oi WHERE oi.order_id = 1;

-- Update user role and refresh related data
UPDATE Users SET role = 'admin' WHERE username = 'ghali_user';

-- Delete orders by a specific user (cascades to OrderItems)
DELETE FROM Orders WHERE user_id = (SELECT user_id FROM Users WHERE username = 'admin');

-- Delete inventory logs and update item quantity
DELETE FROM Inventory_Logs WHERE item_id = 1;
UPDATE Items SET quantity = 0 WHERE item_id = 1;


-- Join 3+ tables: Get order details with user, items, and categories
SELECT 
    u.username,
    o.order_id,
    o.order_date,
    i.item_name,
    c.category_name,
    oi.quantity,
    oi.price
FROM Users u
JOIN Orders o ON u.user_id = o.user_id
JOIN OrderItems oi ON o.order_id = oi.order_id
JOIN Items i ON oi.item_id = i.item_id
JOIN Categories c ON i.category_id = c.category_id
ORDER BY o.order_date DESC;

-- Get inventory logs with user and item information
SELECT 
    il.log_id,
    u.username AS modified_by,
    i.item_name,
    c.category_name,
    il.change_amount,
    il.change_type,
    il.log_date,
    il.notes
FROM Inventory_Logs il
JOIN Users u ON il.user_id = u.user_id
JOIN Items i ON il.item_id = i.item_id
JOIN Categories c ON i.category_id = c.category_id
ORDER BY il.log_date DESC;

-- Get total sales by category
SELECT 
    c.category_name,
    COUNT(oi.order_item_id) AS total_items_sold,
    SUM(oi.price * oi.quantity) AS total_revenue
FROM Categories c
JOIN Items i ON c.category_id = i.category_id
JOIN OrderItems oi ON i.item_id = oi.item_id
GROUP BY c.category_id, c.category_name;