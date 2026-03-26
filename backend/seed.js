const bcrypt = require("bcrypt");
require("dotenv").config();
const db = require("./db");

async function seed() {
  console.log("Seeding database...");

  // ── Clear existing data (dependency order) ──────────────────────────────
  await q("DELETE FROM Review");
  await q("DELETE FROM Message");
  await q("DELETE FROM Conversation");
  await q("DELETE FROM Offer");
  await q("DELETE FROM Delivery_Method");
  await q("DELETE FROM Payment");
  await q("DELETE FROM Transaction");
  await q("DELETE FROM Item_Listing");
  await q("DELETE FROM Seller");
  await q("DELETE FROM Buyer");
  await q("DELETE FROM User");

  // Reset auto-increment so IDs are predictable
  for (const t of ["User","Buyer","Seller","Item_Listing","Transaction","Payment","Delivery_Method","Conversation","Message","Review","Offer"]) {
    await q(`ALTER TABLE ${t} AUTO_INCREMENT = 1`);
  }

  // ── Users ────────────────────────────────────────────────────────────────
  const pass = await bcrypt.hash("password123", 10);

  const users = [
    { username: "alex_sells", email: "alex@example.com", address: "123 Maple St, Austin TX" },
    { username: "brianna_b",  email: "brianna@example.com", address: "88 Oak Ave, Denver CO" },
    { username: "carlos_c",   email: "carlos@example.com", address: "42 Pine Rd, Miami FL" },
    { username: "diana_d",    email: "diana@example.com", address: "9 Birch Ln, Seattle WA" },
    { username: "evan_e",     email: "evan@example.com", address: "301 Cedar Blvd, Chicago IL" },
  ];

  const uids = [];
  for (const u of users) {
    const r = await q("INSERT INTO User (Username, Password, Email, Address) VALUES (?, ?, ?, ?)",
      [u.username, pass, u.email, u.address]);
    uids.push(r.insertId);
  }

  // ── Buyers & Sellers ─────────────────────────────────────────────────────
  const bids = [], sids = [];
  for (const uid of uids) {
    const b = await q("INSERT INTO Buyer (UID) VALUES (?)", [uid]);
    bids.push(b.insertId);
    const s = await q("INSERT INTO Seller (UID) VALUES (?)", [uid]);
    sids.push(s.insertId);
  }
  // uid index → [0]=alex, [1]=brianna, [2]=carlos, [3]=diana, [4]=evan

  // ── Listings ─────────────────────────────────────────────────────────────
  const listings = [
    // alex (sid[0])
    { sid: sids[0], name: "Sony WH-1000XM5 Headphones", desc: "Excellent noise cancelling, used 3 months. Comes with case and cable.", img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600", price: 210.00, cat: "Electronics", status: "active" },
    { sid: sids[0], name: "IKEA KALLAX Shelf Unit", desc: "White 4x4 shelf, perfect condition, smoke-free home. Buyer must pick up.", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600", price: 65.00, cat: "Furniture", status: "active" },
    { sid: sids[0], name: "The Great Gatsby (1st Ed Reprint)", desc: "Beautiful hardcover reprint. Minor shelf wear on spine.", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600", price: 18.00, cat: "Books & Media", status: "active" },

    // brianna (sid[1])
    { sid: sids[1], name: "Levi's 501 Jeans – Size 32x32", desc: "Classic straight fit, worn twice. Dark wash, great condition.", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", price: 45.00, cat: "Clothing & Apparel", status: "active" },
    { sid: sids[1], name: "Trek FX 3 Hybrid Bike", desc: "2022 model, 18 miles on it. Comes with lock and lights.", img: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600", price: 520.00, cat: "Sports & Outdoors", status: "active" },
    { sid: sids[1], name: "Nintendo Switch OLED + 4 Games", desc: "White model, purchased 8 months ago. Includes Mario Kart, Zelda, Splatoon, Animal Crossing.", img: "https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?w=600", price: 290.00, cat: "Electronics", status: "sold" },

    // carlos (sid[2])
    { sid: sids[2], name: "Weber Spirit II E-310 Grill", desc: "3-burner propane grill. Used two summers, cleaned and ready. Tank not included.", img: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600", price: 175.00, cat: "Home & Garden", status: "active" },
    { sid: sids[2], name: "Acoustic Guitar – Yamaha FG800", desc: "Solid spruce top, great tone. Small ding near strap button but plays perfectly.", img: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600", price: 130.00, cat: "Musical Instruments", status: "active" },
    { sid: sids[2], name: "Dewalt 20V Cordless Drill", desc: "Barely used, two batteries and charger included. Selling because I upgraded.", img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600", price: 88.00, cat: "Tools & Hardware", status: "active" },

    // diana (sid[3])
    { sid: sids[3], name: "Vintage Polaroid OneStep Camera", desc: "1970s instant camera in working condition. Tested with fresh film. Great collector piece.", img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600", price: 55.00, cat: "Collectibles & Art", status: "active" },
    { sid: sids[3], name: "Hydro Flask 32oz Wide Mouth", desc: "Stone colorway, light scratches on bottom from daily use. Lid is perfect.", img: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600", price: 22.00, cat: "Sports & Outdoors", status: "active" },
    { sid: sids[3], name: "Macbook Air M1 (2020)", desc: "Space Gray, 8GB RAM, 256GB SSD. Battery at 91% health. Original box included.", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", price: 750.00, cat: "Electronics", status: "active" },

    // evan (sid[4])
    { sid: sids[4], name: "Air Jordan 1 Retro High OG – Size 11", desc: "Chicago colorway, worn once indoors. No box.", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", price: 340.00, cat: "Clothing & Apparel", status: "active" },
    { sid: sids[4], name: "Instant Pot Duo 7-in-1", desc: "6qt model. Used maybe 10 times, all accessories included.", img: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600", price: 48.00, cat: "Home & Garden", status: "active" },
    { sid: sids[4], name: "Canon EOS Rebel T7 Kit", desc: "18-55mm kit lens, 2 batteries, bag, memory card. ~500 shutter count.", img: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600", price: 395.00, cat: "Electronics", status: "active" },
  ];

  const lids = [];
  for (const l of listings) {
    const r = await q(
      "INSERT INTO Item_Listing (SID, Name, Description, Images, Price, Category, Status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [l.sid, l.name, l.desc, l.img, l.price, l.cat, l.status]
    );
    lids.push(r.insertId);
  }

  // ── Offers ────────────────────────────────────────────────────────────────
  // brianna offers on alex's headphones (lids[0])
  await q("INSERT INTO Offer (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)",
    [lids[0], bids[1], sids[0], 185.00, "pending"]);

  // carlos offers on alex's headphones
  await q("INSERT INTO Offer (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)",
    [lids[0], bids[2], sids[0], 195.00, "pending"]);

  // evan offers on diana's MacBook (lids[11]), accepted
  await q("INSERT INTO Offer (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)",
    [lids[11], bids[4], sids[3], 720.00, "accepted"]);

  // diana offers on carlos's guitar (lids[7])
  await q("INSERT INTO Offer (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)",
    [lids[7], bids[3], sids[2], 110.00, "countered"]);

  // ── Transactions ──────────────────────────────────────────────────────────
  // brianna bought brianna's Switch from herself — let's do: evan bought brianna's Switch (lids[5], sold)
  const tx1 = await q(
    "INSERT INTO Transaction (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)",
    [lids[5], bids[4], sids[1], 290.00, "completed"]
  );
  await q("INSERT INTO Delivery_Method (TID, Type, Shipping_Origin, Shipping_Address) VALUES (?, ?, ?, ?)",
    [tx1.insertId, "mail", "88 Oak Ave, Denver CO", "301 Cedar Blvd, Chicago IL"]);

  // diana bought carlos's drill (lids[8])
  const tx2 = await q(
    "INSERT INTO Transaction (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, ?)",
    [lids[8], bids[3], sids[2], 88.00, "completed"]
  );
  await q("INSERT INTO Delivery_Method (TID, Type, Shipping_Origin, Shipping_Address) VALUES (?, ?, ?, ?)",
    [tx2.insertId, "in-person", null, null]);

  // ── Reviews ───────────────────────────────────────────────────────────────
  // evan reviews brianna (seller) after buying Switch
  await q("INSERT INTO Review (TID, BID, SID, LID, Content, Rating) VALUES (?, ?, ?, ?, ?, ?)",
    [tx1.insertId, bids[4], sids[1], lids[5],
     "Great seller! Item was exactly as described and shipped super fast. Would buy from again.", 5]);

  // diana reviews carlos after buying drill
  await q("INSERT INTO Review (TID, BID, SID, LID, Content, Rating) VALUES (?, ?, ?, ?, ?, ?)",
    [tx2.insertId, bids[3], sids[2], lids[8],
     "Smooth transaction, met at a coffee shop. Drill works perfectly.", 4]);

  // ── Conversations & Messages ──────────────────────────────────────────────
  // alex ↔ brianna
  const c1 = await q("INSERT INTO Conversation (UID_1, UID_2) VALUES (?, ?)", [uids[0], uids[1]]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[1], uids[0], c1.insertId, "Hey! Is the headphone listing still available?"]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[0], uids[1], c1.insertId, "Yes, still available! I also threw in a couple extra ear cushions."]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[1], uids[0], c1.insertId, "Nice! Would you take $185 shipped?"]);

  // carlos ↔ diana
  const c2 = await q("INSERT INTO Conversation (UID_1, UID_2) VALUES (?, ?)", [uids[2], uids[3]]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[3], uids[2], c2.insertId, "Is the guitar still available? Can you share more photos?"]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[2], uids[3], c2.insertId, "Yes it is! Happy to send more pics. What do you want to see?"]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[3], uids[2], c2.insertId, "Close-up of the neck and frets please"]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[2], uids[3], c2.insertId, "Sent! Frets have very little wear, plays like new."]);

  // evan ↔ diana (about MacBook)
  const c3 = await q("INSERT INTO Conversation (UID_1, UID_2) VALUES (?, ?)", [uids[4], uids[3]]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[4], uids[3], c3.insertId, "Hi! I just submitted an offer on your MacBook. Let me know if you have questions."]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[3], uids[4], c3.insertId, "Thanks! Offer accepted. I'll ship it out Monday."]);
  await q("INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
    [uids[4], uids[3], c3.insertId, "Perfect, thanks so much!"]);

  console.log("Done! Seed data inserted.");
  console.log("\nTest accounts (all passwords: password123):");
  users.forEach(u => console.log(`  ${u.username}`));
  db.end();
}

function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  db.end();
});
