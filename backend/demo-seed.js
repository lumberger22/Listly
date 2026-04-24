const bcrypt = require("bcrypt");
const db = require("./db");
require("dotenv").config();

function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function seedDemoData() {
  console.log("Seeding demo users, listings, offers, transactions, and messages...");

  const adminColumn = await q(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'User'
       AND COLUMN_NAME = 'is_admin'`
  );

  if (!adminColumn[0].count) {
    await q("ALTER TABLE User ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0");
    console.log("Added missing User.is_admin column");
  }

  const password = "password123";
  const demoUsers = [
    { username: "demo_admin", email: "demo_admin@example.com", address: "1 Admin Plaza", is_admin: true },
    { username: "demo_alice", email: "demo_alice@example.com", address: "123 Maple St", is_admin: false },
    { username: "demo_bob", email: "demo_bob@example.com", address: "88 Oak Ave", is_admin: false },
    { username: "demo_cara", email: "demo_cara@example.com", address: "42 Pine Rd", is_admin: false },
    { username: "demo_diana", email: "demo_diana@example.com", address: "9 Birch Ln", is_admin: false },
    { username: "demo_evan", email: "demo_evan@example.com", address: "301 Cedar Blvd", is_admin: false },
    { username: "demo_frank", email: "demo_frank@example.com", address: "77 Cedar St", is_admin: false },
  ];

  const existingUsers = await q("SELECT UID, Username FROM User");
  const existingNames = new Set(existingUsers.map((u) => u.Username));

  for (const user of demoUsers) {
    if (!existingNames.has(user.username)) {
      const hash = await bcrypt.hash(password, 10);
      await q(
        "INSERT INTO User (Username, Password, Email, Address, is_admin) VALUES (?, ?, ?, ?, ?)",
        [user.username, hash, user.email, user.address, user.is_admin ? 1 : 0]
      );
      console.log(`Created demo user ${user.username}`);
    } else {
      await q(
        "UPDATE User SET Email = ?, Address = ?, is_admin = ? WHERE Username = ?",
        [user.email, user.address, user.is_admin ? 1 : 0, user.username]
      );
    }
  }

  const users = await q("SELECT UID, Username FROM User");
  const userByName = Object.fromEntries(users.map((u) => [u.Username, u.UID]));

  const buyers = await q("SELECT UID, BID FROM Buyer");
  const sellers = await q("SELECT UID, SID FROM Seller");
  const buyerByUid = Object.fromEntries(buyers.map((b) => [b.UID, b.BID]));
  const sellerByUid = Object.fromEntries(sellers.map((s) => [s.UID, s.SID]));

  for (const { UID, Username } of users) {
    if (!buyerByUid[UID]) {
      const result = await q("INSERT INTO Buyer (UID) VALUES (?)", [UID]);
      buyerByUid[UID] = result.insertId;
      console.log(`Created Buyer for ${Username} (UID ${UID})`);
    }
    if (!sellerByUid[UID]) {
      const result = await q("INSERT INTO Seller (UID) VALUES (?)", [UID]);
      sellerByUid[UID] = result.insertId;
      console.log(`Created Seller for ${Username} (UID ${UID})`);
    }
  }

  const demoListings = [
    { seller: "demo_alice", name: "MacBook Pro 2017", description: "Lightly used MacBook Pro, 256GB SSD, 8GB RAM.", images: null, price: 320.0, category: "Electronics", status: "active" },
    { seller: "demo_alice", name: "Oak Dining Table", description: "Sturdy oak dining table, seats 4 comfortably.", images: null, price: 120.0, category: "Furniture", status: "active" },
    { seller: "demo_alice", name: "Bose Soundbar", description: "2.1 channel Bose soundbar with remote.", images: null, price: 140.0, category: "Electronics", status: "active" },
    { seller: "demo_alice", name: "Apple Watch SE", description: "40mm Apple Watch SE with sport band.", images: null, price: 180.0, category: "Electronics", status: "active" },
    { seller: "demo_bob", name: "Vintage Denim Jacket", description: "Size M, classic blue denim jacket.", images: null, price: 45.0, category: "Clothing & Apparel", status: "active" },
    { seller: "demo_bob", name: "Canon DSLR Lens", description: "Canon 50mm f/1.8 lens with caps.", images: null, price: 75.0, category: "Electronics", status: "active" },
    { seller: "demo_bob", name: "Electric Scooter", description: "Foldable electric scooter, 15-mile range.", images: null, price: 220.0, category: "Vehicles & Parts", status: "active" },
    { seller: "demo_bob", name: "Adidas Running Shoes", description: "Men's size 10, lightly used.", images: null, price: 55.0, category: "Sports & Outdoors", status: "active" },
    { seller: "demo_cara", name: "Wireless Keyboard and Mouse", description: "Compact wireless keyboard and mouse set.", images: null, price: 28.0, category: "Electronics", status: "active" },
    { seller: "demo_cara", name: "Nike Running Shorts", description: "Large size, good condition.", images: null, price: 18.0, category: "Clothing & Apparel", status: "active" },
    { seller: "demo_cara", name: "Sony Monitor 24\"", description: "24-inch Sony monitor, great picture.", images: null, price: 125.0, category: "Electronics", status: "active" },
    { seller: "demo_cara", name: "Espresso Machine", description: "Compact espresso machine, works well.", images: null, price: 85.0, category: "Home & Garden", status: "active" },
    { seller: "demo_diana", name: "Leather Backpack", description: "Brown leather backpack, good condition.", images: null, price: 65.0, category: "Clothing & Apparel", status: "active" },
    { seller: "demo_diana", name: "Fitbit Charge 5", description: "Fitness tracker with charger.", images: null, price: 95.0, category: "Health & Beauty", status: "active" },
    { seller: "demo_diana", name: "Board Game Set", description: "Complete board game set for 4 players.", images: null, price: 35.0, category: "Toys & Games", status: "active" },
    { seller: "demo_diana", name: "Patio Umbrella", description: "7ft patio umbrella, good shape.", images: null, price: 40.0, category: "Home & Garden", status: "active" },
    { seller: "demo_evan", name: "Guitar Pedal", description: "Overdrive guitar pedal, works perfectly.", images: null, price: 65.0, category: "Musical Instruments", status: "active" },
    { seller: "demo_evan", name: "GoPro Hero 8", description: "Action camera with case.", images: null, price: 180.0, category: "Electronics", status: "active" },
    { seller: "demo_evan", name: "DSLR Tripod", description: "Lightweight tripod, easy setup.", images: null, price: 45.0, category: "Electronics", status: "active" },
    { seller: "demo_evan", name: "Garden Tool Set", description: "4-piece garden tool set with tote.", images: null, price: 30.0, category: "Home & Garden", status: "active" },
    { seller: "demo_frank", name: "Bicycle Helmet", description: "Protective helmet, size L.", images: null, price: 22.0, category: "Sports & Outdoors", status: "active" },
    { seller: "demo_frank", name: "Instant Camera Film", description: "30-pack film for instant cameras.", images: null, price: 20.0, category: "Other", status: "active" },
    { seller: "demo_frank", name: "Bluetooth Speaker", description: "Portable Bluetooth speaker.", images: null, price: 38.0, category: "Electronics", status: "active" },
    { seller: "demo_frank", name: "Indoor Plant Set", description: "Three small potted plants.", images: null, price: 27.0, category: "Home & Garden", status: "active" },
  ];

  const listingIds = {};

  for (const listing of demoListings) {
    const uid = userByName[listing.seller];
    if (!uid) {
      console.warn(`Skipping listing for missing user ${listing.seller}`);
      continue;
    }
    const sid = sellerByUid[uid];
    const exists = await q(
      "SELECT LID FROM Item_Listing WHERE SID = ? AND Name = ?",
      [sid, listing.name]
    );
    if (exists.length > 0) {
      listingIds[listing.name] = exists[0].LID;
      continue;
    }
    const inserted = await q(
      "INSERT INTO Item_Listing (SID, Name, Description, Images, Price, Category, Status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sid, listing.name, listing.description, listing.images, listing.price, listing.category, listing.status]
    );
    listingIds[listing.name] = inserted.insertId;
    console.log(`Inserted listing ${listing.name} (LID ${inserted.insertId})`);
  }

  const demoOffers = [
    { listingName: "MacBook Pro 2017", buyer: "demo_bob", seller: "demo_alice", price: 300.0, status: "pending" },
    { listingName: "MacBook Pro 2017", buyer: "demo_diana", seller: "demo_alice", price: 310.0, status: "countered" },
    { listingName: "Oak Dining Table", buyer: "demo_diana", seller: "demo_alice", price: 110.0, status: "pending" },
    { listingName: "Oak Dining Table", buyer: "demo_evan", seller: "demo_alice", price: 115.0, status: "pending" },
    { listingName: "Bose Soundbar", buyer: "demo_cara", seller: "demo_alice", price: 130.0, status: "accepted" },
    { listingName: "Apple Watch SE", buyer: "demo_frank", seller: "demo_alice", price: 170.0, status: "pending" },
    { listingName: "Vintage Denim Jacket", buyer: "demo_cara", seller: "demo_bob", price: 40.0, status: "accepted" },
    { listingName: "Vintage Denim Jacket", buyer: "demo_evan", seller: "demo_bob", price: 42.0, status: "rejected" },
    { listingName: "Canon DSLR Lens", buyer: "demo_alice", seller: "demo_bob", price: 70.0, status: "pending" },
    { listingName: "Electric Scooter", buyer: "demo_frank", seller: "demo_bob", price: 200.0, status: "pending" },
    { listingName: "Adidas Running Shoes", buyer: "demo_diana", seller: "demo_bob", price: 50.0, status: "accepted" },
    { listingName: "Wireless Keyboard and Mouse", buyer: "demo_frank", seller: "demo_cara", price: 25.0, status: "pending" },
    { listingName: "Wireless Keyboard and Mouse", buyer: "demo_evan", seller: "demo_cara", price: 26.0, status: "rejected" },
    { listingName: "Nike Running Shorts", buyer: "demo_bob", seller: "demo_cara", price: 16.0, status: "accepted" },
    { listingName: "Sony Monitor 24\"", buyer: "demo_alice", seller: "demo_cara", price: 118.0, status: "pending" },
    { listingName: "Espresso Machine", buyer: "demo_diana", seller: "demo_cara", price: 80.0, status: "pending" },
    { listingName: "Leather Backpack", buyer: "demo_frank", seller: "demo_diana", price: 60.0, status: "accepted" },
    { listingName: "Fitbit Charge 5", buyer: "demo_bob", seller: "demo_diana", price: 90.0, status: "pending" },
    { listingName: "Board Game Set", buyer: "demo_cara", seller: "demo_diana", price: 30.0, status: "accepted" },
    { listingName: "Patio Umbrella", buyer: "demo_alice", seller: "demo_diana", price: 35.0, status: "pending" },
    { listingName: "Guitar Pedal", buyer: "demo_diana", seller: "demo_evan", price: 60.0, status: "accepted" },
    { listingName: "GoPro Hero 8", buyer: "demo_cara", seller: "demo_evan", price: 175.0, status: "pending" },
    { listingName: "DSLR Tripod", buyer: "demo_frank", seller: "demo_evan", price: 42.0, status: "pending" },
    { listingName: "Garden Tool Set", buyer: "demo_alice", seller: "demo_evan", price: 28.0, status: "pending" },
    { listingName: "Bicycle Helmet", buyer: "demo_cara", seller: "demo_frank", price: 20.0, status: "accepted" },
    { listingName: "Instant Camera Film", buyer: "demo_diana", seller: "demo_frank", price: 18.0, status: "pending" },
    { listingName: "Bluetooth Speaker", buyer: "demo_bob", seller: "demo_frank", price: 35.0, status: "pending" },
    { listingName: "Indoor Plant Set", buyer: "demo_evan", seller: "demo_frank", price: 25.0, status: "pending" },
  ];

  for (const offer of demoOffers) {
    const lid = listingIds[offer.listingName];
    if (!lid) {
      console.warn(`Skipping offer for missing listing ${offer.listingName}`);
      continue;
    }
    const buyerUid = userByName[offer.buyer];
    const sellerUid = userByName[offer.seller];
    if (!buyerUid || !sellerUid) {
      console.warn(`Skipping offer for missing user ${offer.buyer} or ${offer.seller}`);
      continue;
    }
    const bid = buyerByUid[buyerUid];
    const sid = sellerByUid[sellerUid];
    const exists = await q(
      "SELECT OID FROM Offer WHERE LID = ? AND BID = ? AND SID = ? AND Price = ?",
      [lid, bid, sid, offer.price]
    );
    if (exists.length > 0) continue;
    await q("INSERT INTO Offer (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)", [lid, bid, sid, offer.price, offer.status]);
    console.log(`Inserted offer by ${offer.buyer} on ${offer.listingName}`);
  }

  const demoTransactions = [
    { listingName: "MacBook Pro 2017", buyer: "demo_bob", seller: "demo_alice", price: 300.0, status: "completed", delivery: { type: "mail", origin: "123 Maple St", address: "88 Oak Ave" } },
    { listingName: "Vintage Denim Jacket", buyer: "demo_cara", seller: "demo_bob", price: 40.0, status: "completed", delivery: { type: "mail", origin: "88 Oak Ave", address: "42 Pine Rd" } },
    { listingName: "Bose Soundbar", buyer: "demo_cara", seller: "demo_alice", price: 130.0, status: "completed", delivery: { type: "mail", origin: "123 Maple St", address: "42 Pine Rd" } },
    { listingName: "Adidas Running Shoes", buyer: "demo_diana", seller: "demo_bob", price: 50.0, status: "completed", delivery: { type: "mail", origin: "88 Oak Ave", address: "9 Birch Ln" } },
    { listingName: "Nike Running Shorts", buyer: "demo_bob", seller: "demo_cara", price: 16.0, status: "completed", delivery: { type: "mail", origin: "42 Pine Rd", address: "88 Oak Ave" } },
    { listingName: "Leather Backpack", buyer: "demo_frank", seller: "demo_diana", price: 60.0, status: "completed", delivery: { type: "mail", origin: "9 Birch Ln", address: "77 Cedar St" } },
    { listingName: "Guitar Pedal", buyer: "demo_diana", seller: "demo_evan", price: 60.0, status: "completed", delivery: { type: "in-person", origin: null, address: null } },
    { listingName: "Bicycle Helmet", buyer: "demo_cara", seller: "demo_frank", price: 20.0, status: "completed", delivery: { type: "mail", origin: "77 Cedar St", address: "42 Pine Rd" } },
    { listingName: "Sony Monitor 24\"", buyer: "demo_alice", seller: "demo_cara", price: 118.0, status: "pending", delivery: { type: "mail", origin: "42 Pine Rd", address: "123 Maple St" } },
    { listingName: "Apple Watch SE", buyer: "demo_frank", seller: "demo_alice", price: 170.0, status: "pending", delivery: { type: "mail", origin: "123 Maple St", address: "77 Cedar St" } },
  ];

  for (const tx of demoTransactions) {
    const lid = listingIds[tx.listingName];
    if (!lid) {
      console.warn(`Skipping transaction for missing listing ${tx.listingName}`);
      continue;
    }
    const buyerUid = userByName[tx.buyer];
    const sellerUid = userByName[tx.seller];
    if (!buyerUid || !sellerUid) {
      console.warn(`Skipping transaction for missing user ${tx.buyer} or ${tx.seller}`);
      continue;
    }
    const bid = buyerByUid[buyerUid];
    const sid = sellerByUid[sellerUid];
    const existingTx = await q(
      "SELECT TID FROM Transaction WHERE LID = ? AND BID = ? AND SID = ? AND Price = ?",
      [lid, bid, sid, tx.price]
    );
    let tid;
    if (existingTx.length > 0) {
      tid = existingTx[0].TID;
    } else {
      const inserted = await q(
        "INSERT INTO Transaction (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)",
        [lid, bid, sid, tx.price, tx.status]
      );
      tid = inserted.insertId;
      console.log(`Inserted transaction for ${tx.listingName} (TID ${tid})`);
    }

    if (tx.status === "completed" || tx.status === "pending") {
      await q("UPDATE Item_Listing SET Status = ? WHERE LID = ?", [tx.status === "completed" ? "sold" : "active", lid]);
    }

    const existingDelivery = await q(
      "SELECT DMID FROM Delivery_Method WHERE TID = ?",
      [tid]
    );
    if (existingDelivery.length === 0) {
      await q(
        "INSERT INTO Delivery_Method (TID, Type, Shipping_Origin, Shipping_Address) VALUES (?, ?, ?, ?)",
        [tid, tx.delivery.type, tx.delivery.origin, tx.delivery.address]
      );
      console.log(`Inserted delivery method for transaction ${tid}`);
    }
  }

  const demoConversations = [
    {
      userA: "demo_alice",
      userB: "demo_bob",
      messages: [
        { from: "demo_bob", to: "demo_alice", text: "Hi, is the MacBook still available?" },
        { from: "demo_alice", to: "demo_bob", text: "Yes, it's available and ready to ship." },
      ],
    },
    {
      userA: "demo_cara",
      userB: "demo_diana",
      messages: [
        { from: "demo_diana", to: "demo_cara", text: "Can you ship the monitor this week?" },
        { from: "demo_cara", to: "demo_diana", text: "Yes, I can drop it off on Friday." },
      ],
    },
    {
      userA: "demo_evan",
      userB: "demo_frank",
      messages: [
        { from: "demo_frank", to: "demo_evan", text: "Is the helmet lightly used?" },
        { from: "demo_evan", to: "demo_frank", text: "Yes, just a few rides. It is still in great shape." },
      ],
    },
  ];

  for (const convo of demoConversations) {
    const uidA = userByName[convo.userA];
    const uidB = userByName[convo.userB];
    if (!uidA || !uidB) {
      console.warn(`Skipping conversation for missing users ${convo.userA} / ${convo.userB}`);
      continue;
    }
    const existingConv = await q(
      "SELECT CID FROM Conversation WHERE (UID_1 = ? AND UID_2 = ?) OR (UID_1 = ? AND UID_2 = ?)",
      [uidA, uidB, uidB, uidA]
    );
    let cid;
    if (existingConv.length > 0) {
      cid = existingConv[0].CID;
    } else {
      const inserted = await q("INSERT INTO Conversation (UID_1, UID_2) VALUES (?, ?)", [uidA, uidB]);
      cid = inserted.insertId;
      console.log(`Inserted conversation between ${convo.userA} and ${convo.userB} (CID ${cid})`);
    }
    for (const msg of convo.messages) {
      const sender = userByName[msg.from];
      const receiver = userByName[msg.to];
      const exists = await q(
        "SELECT MID FROM Message WHERE UID_Sender = ? AND UID_Receiver = ? AND CID = ? AND Content = ?",
        [sender, receiver, cid, msg.text]
      );
      if (exists.length > 0) continue;
      await q(
        "INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
        [sender, receiver, cid, msg.text]
      );
      console.log(`Inserted message from ${msg.from} to ${msg.to}`);
    }
  }

  console.log("\nDemo credentials (password for all accounts below): password123");
  demoUsers.forEach((user) => {
    const role = user.is_admin ? "admin" : "user";
    console.log(`  ${user.username} (${role})`);
  });
  console.log("\nDemo seed successful.");
  db.end();
}

seedDemoData().catch((err) => {
  console.error("Demo seed failed:", err);
  db.end();
});
