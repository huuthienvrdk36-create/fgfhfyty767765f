// Auto Platform - Database Seed Script
// Run: node scripts/seed.js or mongosh auto_platform --file scripts/seed.mongo.js

// For MongoDB Shell (mongosh)
// Usage: mongosh auto_platform --file scripts/seed.mongo.js

print("🌱 Seeding Auto Platform database...");

// ============== ADMIN USER ==============
var adminEmail = "admin@autoservice.com";
var adminExists = db.users.findOne({email: adminEmail});

if (!adminExists) {
  db.users.insertOne({
    email: adminEmail,
    // Password: Admin123! (bcrypt hash - bcryptjs)
    passwordHash: "$2b$10$QYitWQLnikBaDgYgOLCbpOdS5laAw6JQZuq91Ymu33lkU3kPctEd6",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print("✅ Created admin user: " + adminEmail);
} else {
  print("⏭️  Admin user already exists");
}

// ============== SERVICES ==============
var services = [
  {name: "Замена масла", code: "oil_change", category: "maintenance", slug: "oil-change"},
  {name: "Диагностика", code: "diagnostics", category: "diagnostics", slug: "diagnostics"},
  {name: "Шиномонтаж", code: "tire_service", category: "tires", slug: "tire-service"},
  {name: "Замена колодок", code: "brake_pads", category: "brakes", slug: "brake-pads"},
  {name: "ТО", code: "maintenance", category: "maintenance", slug: "maintenance-to"}
];

services.forEach(function(s) {
  var exists = db.services.findOne({code: s.code});
  if (!exists) {
    db.services.insertOne({
      name: s.name,
      code: s.code,
      category: s.category,
      slug: s.slug,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    print("✅ Created service: " + s.name);
  }
});

// ============== ORGANIZATION 1: BMW GARAGE ==============
var org1Name = "BMW Garage";
var org1Exists = db.organizations.findOne({name: org1Name});
var org1Id;

if (!org1Exists) {
  var org1Result = db.organizations.insertOne({
    name: org1Name,
    status: "active",
    isVerified: true,
    rating: 4.8,
    visibilityScore: 80,
    behavioralScore: 75,
    isOnline: true,
    isMobile: false,
    completedBookingsCount: 120,
    responseRate: 0.85,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  org1Id = org1Result.insertedId;
  print("✅ Created organization: " + org1Name);
  
  // Create branch
  var branch1Result = db.branches.insertOne({
    organizationId: org1Id,
    name: "Центральный филиал",
    address: "ул. Тверская, 10, Москва",
    status: "active",
    location: {type: "Point", coordinates: [37.6086, 55.7636]},
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print("✅ Created branch for " + org1Name);
  
  // Create provider services
  var allServices = db.services.find().toArray();
  allServices.forEach(function(svc) {
    db.providerservices.insertOne({
      organizationId: org1Id,
      branchId: branch1Result.insertedId,
      serviceId: svc._id,
      description: svc.name,
      priceMin: 1000,
      priceMax: 5000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  print("✅ Created provider services for " + org1Name);
} else {
  org1Id = org1Exists._id;
  print("⏭️  Organization exists: " + org1Name);
}

// ============== PROVIDER USER ==============
var providerEmail = "provider@bmwgarage.com";
var providerExists = db.users.findOne({email: providerEmail});

if (!providerExists) {
  db.users.insertOne({
    email: providerEmail,
    // Password: Provider123! (bcrypt hash - bcryptjs)
    passwordHash: "$2b$10$B3ihhs9.S992kqq1/iq/aeYHFx2cZGSICLHveWqJL3MpJUPLiLE66",
    role: "provider_owner",
    firstName: "Иван",
    lastName: "Мастер",
    organizationId: org1Id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print("✅ Created provider user: " + providerEmail);
} else {
  // Update organizationId if missing
  if (!providerExists.organizationId) {
    db.users.updateOne({email: providerEmail}, {$set: {organizationId: org1Id}});
    print("✅ Updated provider user with organizationId");
  }
}

// ============== ORGANIZATION 2: АВТОСЕРВИС ПРОФИ ==============
var org2Name = "Автосервис Профи";
var org2Exists = db.organizations.findOne({name: org2Name});

if (!org2Exists) {
  var org2Result = db.organizations.insertOne({
    name: org2Name,
    status: "active",
    isVerified: true,
    rating: 4.5,
    visibilityScore: 70,
    behavioralScore: 60,
    isOnline: true,
    isMobile: true,
    completedBookingsCount: 85,
    responseRate: 0.75,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  var org2Id = org2Result.insertedId;
  print("✅ Created organization: " + org2Name);
  
  // Create branch
  var branch2Result = db.branches.insertOne({
    organizationId: org2Id,
    name: "Филиал на Арбате",
    address: "ул. Арбат, 25, Москва",
    status: "active",
    location: {type: "Point", coordinates: [37.5916, 55.7483]},
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print("✅ Created branch for " + org2Name);
  
  // Create provider services
  var allServices2 = db.services.find().toArray();
  allServices2.forEach(function(svc) {
    db.providerservices.insertOne({
      organizationId: org2Id,
      branchId: branch2Result.insertedId,
      serviceId: svc._id,
      description: svc.name,
      priceMin: 800,
      priceMax: 4000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  print("✅ Created provider services for " + org2Name);
} else {
  print("⏭️  Organization exists: " + org2Name);
}

// ============== CUSTOMER USER ==============
var customerEmail = "customer@test.com";
var customerExists = db.users.findOne({email: customerEmail});

if (!customerExists) {
  db.users.insertOne({
    email: customerEmail,
    firstName: "Дмитрий",
    lastName: "Иванов",
    phone: "+380991234567",
    role: "customer",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print("✅ Created customer user: " + customerEmail);
}

// ============== INDEXES ==============
print("\n📊 Creating indexes...");

try {
  db.branches.createIndex({location: "2dsphere"});
  print("✅ Created 2dsphere index on branches.location");
} catch(e) {
  print("⏭️  Index already exists");
}

try {
  db.bookings.createIndex({customerLocation: "2dsphere"});
  print("✅ Created 2dsphere index on bookings.customerLocation");
} catch(e) {}

try {
  db.providerlivelocation.createIndex({location: "2dsphere"});
  print("✅ Created 2dsphere index on providerlivelocation.location");
} catch(e) {}

print("\n🎉 Seed completed successfully!");
print("\nTest credentials:");
print("  Admin: admin@autoservice.com / Admin123!");
print("  Provider: provider@bmwgarage.com / Provider123!");
print("  Customer: customer@test.com");
