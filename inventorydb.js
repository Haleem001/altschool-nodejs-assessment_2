// ==========================================
// CREATE ENTITIES (COLLECTIONS)
// ==========================================
db.createCollection("users");
db.createCollection("categories");
db.createCollection("items");
db.createCollection("orders");
db.createCollection("inventory_logs");

// Create Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.categories.createIndex({ category_name: 1 }, { unique: true });
db.items.createIndex({ item_name: 1 }, { unique: true });
db.orders.createIndex({ user_id: 1 });
db.orders.createIndex({ order_date: -1 });
db.inventory_logs.createIndex({ item_id: 1, timestamp: -1 });
// Insert records
db.users.insertMany([
  { 
    _id: ObjectId(),
    username: "admin", 
    email: "admin@example.com", 
    password_hash: "admin123@", 
    role: "admin",
    created_at: new Date()
  },
  { 
    _id: ObjectId(),
    username: "ghali_user", 
    email: "mahmudghali01@gmail.com", 
    password_hash: "mahmudghali123@", 
    role: "user",
    created_at: new Date()
  },
  { 
    _id: ObjectId(),
    username: "john_doe", 
    email: "john@example.com", 
    password_hash: "john123@", 
    role: "user",
    created_at: new Date()
  }
]);

db.categories.insertMany([
  { 
    _id: ObjectId(),
    category_name: "Electronics", 
    description: "Electronic gadgets and devices" 
  },
  { 
    _id: ObjectId(),
    category_name: "Clothing", 
    description: "Apparel and accessories" 
  },
  { 
    _id: ObjectId(),
    category_name: "Books", 
    description: "Various genres of books" 
  }
]);

db.items.insertMany([
  { 
    _id: ObjectId(),
    item_name: "Smartphone", 
    category_id: db.categories.findOne({ category_name: "Electronics" })._id,
    price: 350000.00, 
    size: "Medium", 
    quantity: 50, 
    description: "Latest model smartphone with advanced features"
  },
  { 
    _id: ObjectId(),
    item_name: "Jeans", 
    category_id: db.categories.findOne({ category_name: "Clothing" })._id,
    price: 25000.00, 
    size: "Large", 
    quantity: 100, 
    description: "Comfortable denim jeans"
  },
  { 
    _id: ObjectId(),
    item_name: "Novel", 
    category_id: db.categories.findOne({ category_name: "Books" })._id,
    price: 8500.00, 
    size: "Small", 
    quantity: 200, 
    description: "Bestselling fiction novel"
  }
]);

db.orders.insertMany([
  { 
    _id: ObjectId(),
    user_id: db.users.findOne({ username: "ghali_user" })._id,
    order_date: new Date(),
    status: "Pending",
    total_amount: 350000.00,
    items: [
      { 
        item_id: db.items.findOne({ item_name: "Smartphone" })._id,
        item_name: "Smartphone", 
        qty: 1, 
        price: 350000.00 
      }
    ]
  },
  { 
    _id: ObjectId(),
    user_id: db.users.findOne({ username: "john_doe" })._id,
    order_date: new Date(),
    status: "Shipped",
    total_amount: 50000.00,
    items: [
      { 
        item_id: db.items.findOne({ item_name: "Jeans" })._id,
        item_name: "Jeans", 
        qty: 2, 
        price: 25000.00 
      }
    ]
  }
]);

db.inventory_logs.insertMany([
  {
    _id: ObjectId(),
    item_id: db.items.findOne({ item_name: "Smartphone" })._id,
    user_id: db.users.findOne({ username: "admin" })._id,
    change_amount: 50,
    change_type: "Restock",
    timestamp: new Date(),
    notes: "Initial stock added"
  },
  {
    _id: ObjectId(),
    item_id: db.items.findOne({ item_name: "Jeans" })._id,
    user_id: db.users.findOne({ username: "admin" })._id,
    change_amount: 100,
    change_type: "Restock",
    timestamp: new Date(),
    notes: "Initial stock added"
  },
  {
    _id: ObjectId(),
    item_id: db.items.findOne({ item_name: "Smartphone" })._id,
    user_id: db.users.findOne({ username: "ghali_user" })._id,
    change_amount: -1,
    change_type: "Sale",
    timestamp: new Date(),
    notes: "Sold via order"
  }
]);
// Get all orders with user information
db.orders.find({}).pretty();
db.users.find({ _id: { $in: db.orders.find({}).map(o => o.user_id) } }).pretty();

// Get all items with their categories
db.items.find({}).pretty();
db.categories.find({}).pretty();
// Update order status
db.orders.updateOne(
  { user_id: db.users.findOne({ username: "ghali_user" })._id },
  { $set: { status: "Shipped" } }
);

// Insert inventory log for the order update
db.inventory_logs.insertOne({
  _id: ObjectId(),
  item_id: db.items.findOne({ item_name: "Smartphone" })._id,
  user_id: db.users.findOne({ username: "admin" })._id,
  change_amount: -1,
  change_type: "Sale",
  timestamp: new Date(),
  notes: "Order shipped"
});

// Update user role
db.users.updateOne(
  { username: "ghali_user" },
  { $set: { role: "admin" } }
);

// Update item quantity
db.items.updateOne(
  { item_name: "Jeans" },
  { $inc: { quantity: 50 } }
);
// Delete all orders by a user and related logs
var user_to_delete = db.users.findOne({ username: "admin" });
db.orders.deleteMany({ user_id: user_to_delete._id });
db.inventory_logs.deleteMany({ user_id: user_to_delete._id });

// Delete a specific item and its logs
var item_to_delete = db.items.findOne({ item_name: "Smartphone" });
db.items.deleteOne({ _id: item_to_delete._id });
db.inventory_logs.deleteMany({ item_id: item_to_delete._id });

// Aggregation: Get orders with user details using $lookup
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user_details"
    }
  },
  { $unwind: "$user_details" },
  {
    $project: {
      order_id: "$_id",
      username: "$user_details.username",
      email: "$user_details.email",
      order_date: 1,
      total_amount: 1,
      status: 1
    }
  }
]).pretty();

// Aggregation: Get items with category information using $lookup
db.items.aggregate([
  {
    $lookup: {
      from: "categories",
      localField: "category_id",
      foreignField: "_id",
      as: "category_info"
    }
  },
  { $unwind: "$category_info" },
  {
    $project: {
      item_name: 1,
      category_name: "$category_info.category_name",
      quantity: 1,
      price: 1,
      size: 1
    }
  }
]).pretty();

// Aggregation: Get complete order details with user, items, and categories
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user_info"
    }
  },
  { $unwind: "$user_info" },
  {
    $lookup: {
      from: "items",
      localField: "items.item_id",
      foreignField: "_id",
      as: "item_details"
    }
  },
  {
    $lookup: {
      from: "categories",
      localField: "item_details.category_id",
      foreignField: "_id",
      as: "categories"
    }
  },
  {
    $project: {
      order_id: "$_id",
      username: "$user_info.username",
      order_date: 1,
      items: 1,
      item_details: 1,
      categories: 1,
      total_amount: 1,
      status: 1
    }
  }
]).pretty();

// Aggregation: Get inventory logs with user and item details
db.inventory_logs.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user_info"
    }
  },
  { $unwind: "$user_info" },
  {
    $lookup: {
      from: "items",
      localField: "item_id",
      foreignField: "_id",
      as: "item_info"
    }
  },
  { $unwind: "$item_info" },
  {
    $lookup: {
      from: "categories",
      localField: "item_info.category_id",
      foreignField: "_id",
      as: "category_info"
    }
  },
  { $unwind: "$category_info" },
  {
    $sort: { timestamp: -1 }
  },
  {
    $project: {
      log_id: "$_id",
      username: "$user_info.username",
      item_name: "$item_info.item_name",
      category_name: "$category_info.category_name",
      change_amount: 1,
      change_type: 1,
      timestamp: 1,
      notes: 1
    }
  }
]).pretty();

// Aggregation: Get total sales by category
db.items.aggregate([
  {
    $lookup: {
      from: "categories",
      localField: "category_id",
      foreignField: "_id",
      as: "category"
    }
  },
  { $unwind: "$category" },
  {
    $lookup: {
      from: "orders",
      let: { item_id: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ["$$item_id", "$items.item_id"]
            }
          }
        }
      ],
      as: "order_details"
    }
  },
  {
    $group: {
      _id: "$category.category_name",
      total_items_sold: { $sum: { $size: "$order_details" } },
      total_revenue: { $sum: { $multiply: ["$price", { $size: "$order_details" }] } }
    }
  }
]).pretty();