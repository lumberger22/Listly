-- USER
CREATE TABLE User (
    UID                 INT PRIMARY KEY AUTO_INCREMENT,
    Username            VARCHAR(50) UNIQUE NOT NULL,
    Password            VARCHAR(255) NOT NULL,
    Email               VARCHAR(100) UNIQUE NOT NULL,
    Address             VARCHAR(255),
    stripe_customer_id  VARCHAR(255)
);


-- BUYER (subtype of User)
CREATE TABLE Buyer (
    BID                      INT PRIMARY KEY AUTO_INCREMENT,
    UID                      INT NOT NULL UNIQUE,
    stripe_payment_method_id VARCHAR(255),
    FOREIGN KEY (UID) REFERENCES User(UID) ON DELETE CASCADE
);


-- SELLER (subtype of User)
CREATE TABLE Seller (
    SID               INT PRIMARY KEY AUTO_INCREMENT,
    UID               INT NOT NULL UNIQUE,
    stripe_account_id VARCHAR(255),
    FOREIGN KEY (UID) REFERENCES User(UID) ON DELETE CASCADE
);


-- ITEM LISTING
CREATE TABLE Item_Listing (
    LID         INT PRIMARY KEY AUTO_INCREMENT,
    SID         INT NOT NULL,
    Name        VARCHAR(150) NOT NULL,
    Description TEXT,
    Images      TEXT,
    Price       DECIMAL(10,2) NOT NULL,
    Category    ENUM(
                    'Electronics',
                    'Clothing & Apparel',
                    'Furniture',
                    'Books & Media',
                    'Sports & Outdoors',
                    'Toys & Games',
                    'Home & Garden',
                    'Vehicles & Parts',
                    'Collectibles & Art',
                    'Musical Instruments',
                    'Health & Beauty',
                    'Pet Supplies',
                    'Tools & Hardware',
                    'Other'
                ) NOT NULL DEFAULT 'Other',
    Status      ENUM('active', 'sold', 'removed') DEFAULT 'active',
    FOREIGN KEY (SID) REFERENCES Seller(SID)
);


-- TRANSACTION
CREATE TABLE Transaction (
    TID        INT PRIMARY KEY AUTO_INCREMENT,
    LID        INT NOT NULL,
    BID        INT NOT NULL,
    SID        INT NOT NULL,
    Price      DECIMAL(10,2) NOT NULL,
    Status     ENUM('pending', 'completed', 'cancelled', 'disputed') DEFAULT 'pending',
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (LID) REFERENCES Item_Listing(LID),
    FOREIGN KEY (BID) REFERENCES Buyer(BID),
    FOREIGN KEY (SID) REFERENCES Seller(SID)
);


-- PAYMENT
CREATE TABLE Payment (
    PID                      INT PRIMARY KEY AUTO_INCREMENT,
    TID                      INT NOT NULL,
    BID                      INT NOT NULL,
    SID                      INT NOT NULL,
    Amount                   DECIMAL(10,2),
    Status                   ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id         VARCHAR(255),
    stripe_status            VARCHAR(50),
    FOREIGN KEY (TID) REFERENCES Transaction(TID),
    FOREIGN KEY (BID) REFERENCES Buyer(BID),
    FOREIGN KEY (SID) REFERENCES Seller(SID)
);


-- DELIVERY METHOD
CREATE TABLE Delivery_Method (
    DMID             INT PRIMARY KEY AUTO_INCREMENT,
    TID              INT NOT NULL,
    Type             ENUM('in-person', 'mail') NOT NULL,
    Shipping_Origin  VARCHAR(255),
    Shipping_Address VARCHAR(255),
    FOREIGN KEY (TID) REFERENCES Transaction(TID)
);


-- CONVERSATION
CREATE TABLE Conversation (
    CID   INT PRIMARY KEY AUTO_INCREMENT,
    UID_1 INT NOT NULL,
    UID_2 INT NOT NULL,
    FOREIGN KEY (UID_1) REFERENCES User(UID),
    FOREIGN KEY (UID_2) REFERENCES User(UID)
);


-- MESSAGE
CREATE TABLE Message (
    MID          INT PRIMARY KEY AUTO_INCREMENT,
    UID_Sender   INT NOT NULL,
    UID_Receiver INT NOT NULL,
    CID          INT NOT NULL,
    Content      TEXT NOT NULL,
    Time         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UID_Sender) REFERENCES User(UID),
    FOREIGN KEY (UID_Receiver) REFERENCES User(UID),
    FOREIGN KEY (CID) REFERENCES Conversation(CID)
);


-- REVIEW
CREATE TABLE Review (
    ReviewID INT PRIMARY KEY AUTO_INCREMENT,
    TID      INT NOT NULL,
    BID      INT NOT NULL,
    SID      INT NOT NULL,
    LID      INT,
    Content  TEXT,
    Rating   TINYINT CHECK (Rating BETWEEN 1 AND 5),
    FOREIGN KEY (TID) REFERENCES Transaction(TID),
    FOREIGN KEY (BID) REFERENCES Buyer(BID),
    FOREIGN KEY (SID) REFERENCES Seller(SID),
    FOREIGN KEY (LID) REFERENCES Item_Listing(LID)
);


-- OFFER
CREATE TABLE Offer (
    OID    INT PRIMARY KEY AUTO_INCREMENT,
    LID    INT NOT NULL,
    BID    INT NOT NULL,
    SID    INT NOT NULL,
    Price  DECIMAL(10,2) NOT NULL,
    Status ENUM('pending', 'accepted', 'rejected', 'countered') DEFAULT 'pending',
    FOREIGN KEY (LID) REFERENCES Item_Listing(LID),
    FOREIGN KEY (BID) REFERENCES Buyer(BID),
    FOREIGN KEY (SID) REFERENCES Seller(SID)
);
