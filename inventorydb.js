// CREATE ENTITIES & INDEXES

db.createCollection("users");
db.createCollection("categories");
db.createCollection("items");
db.createCollection("orders");
db.createCollection("inventory_logs");

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.categories.createIndex({ category_name: 1 }, { unique: true });
db.items.createIndex({ item_name: 1 }, { unique: true });
db.orders.createIndex({ user_id: 1 });
db.inventory_logs.createIndex({ item_id: 1, timestamp: -1 });

// INSERT RECORDS
db.users.insertMany([
  { username: "admin", email: "admin@example.com", password_hash: "admin123@", role: "admin", created_at: new Date() },
  { username: "ghali_user", email: "mahmudghali01@gmail.com", password_hash: "mahmudghali123@", role: "user", created_at: new Date() },
  { username: "john_doe", email: "john@example.com", password_hash: "john123@", role: "user", created_at: new Date() }
]);

db.categories.insertMany([
  { category_name: "Electronics", description: "Electronic gadgets and devices" },
  { category_name: "Clothing", description: "Apparel and accessories" },
  { category_name: "Books", description: "Various genres of books" }
]);

db.items.insertMany([
  { item_name: "Smartphone", category_id: db.categories.findOne({ category_name: "Electronics" })._id, price: 350000.00, size: "Medium", quantity: 50, description: "Latest model smartphone" },
  { item_name: "Jeans", category_id: db.categories.findOne({ category_name: "Clothing" })._id, price: 25000.00, size: "Large", quantity: 100, description: "Comfortable denim jeans" },
  { item_name: "Novel", category_id: db.categories.findOne({ category_name: "Books" })._id, price: 8500.00, size: "Small", quantity: 200, description: "Bestselling fiction novel" }
]);

db.orders.insertMany([
  { user_id: db.users.findOne({ username: "ghali_user" })._id, order_date: new Date(), status: "Pending", total_amount: 350000.00, items: [{ item_id: db.items.findOne({ item_name: "Smartphone" })._id, qty: 1, price: 350000.00 }] },
  { user_id: db.users.findOne({ username: "john_doe" })._id, order_date: new Date(), status: "Shipped", total_amount: 50000.00, items: [{ item_id: db.items.findOne({ item_name: "Jeans" })._id, qty: 2, price: 25000.00 }] }
]);

db.inventory_logs.insertMany([
  { item_id: db.items.findOne({ item_name: "Smartphone" })._id, user_id: db.users.findOne({ username: "admin" })._id, change_amount: 50, change_type: "Restock", timestamp: new Date(), notes: "Initial stock" },
  { item_id: db.items.findOne({ item_name: "Smartphone" })._id, user_id: db.users.findOne({ username: "ghali_user" })._id, change_amount: -1, change_type: "Sale", timestamp: new Date(), notes: "Sold via order" }
]);

// GET RECORDS FROM MULTIPLE ENTITIES

db.orders.aggregate([{ $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } }]);
db.items.aggregate([{ $lookup: { from: "categories", localField: "category_id", foreignField: "_id", as: "category" } }]);


// UPDATE RECORDS

db.orders.updateOne({ user_id: db.users.findOne({ username: "ghali_user" })._id }, { $set: { status: "Shipped" } });
db.users.updateOne({ username: "ghali_user" }, { $set: { role: "admin" } });
db.items.updateOne({ item_name: "Jeans" }, { $inc: { quantity: 50 } });


// DELETE RECORDS

var user = db.users.findOne({ username: "admin" });
db.orders.deleteMany({ user_id: user._id });
db.inventory_logs.deleteMany({ user_id: user._id });

// Orders with user details
db.orders.aggregate([
  { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user_details" } },
  { $unwind: "$user_details" },
  { $project: { username: "$user_details.username", order_date: 1, total_amount: 1, status: 1 } }
]);

// Items with category
db.items.aggregate([
  { $lookup: { from: "categories", localField: "category_id", foreignField: "_id", as: "category" } },
  { $unwind: "$category" },
  { $project: { item_name: 1, category_name: "$category.category_name", quantity: 1, price: 1 } }
]);

// Inventory logs with user and item details
db.inventory_logs.aggregate([
  { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user" } },
  { $lookup: { from: "items", localField: "item_id", foreignField: "_id", as: "item" } },
  { $unwind: "$user" },
  { $unwind: "$item" },
  { $project: { username: "$user.username", item_name: "$item.item_name", change_amount: 1, change_type: 1, timestamp: 1 } }
]);