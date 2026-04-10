// Seed zones for City-Level Control
const zones = [
  {
    name: "Центр",
    code: "kyiv-center",
    cityName: "Киев",
    center: { type: "Point", coordinates: [30.5234, 50.4501] },
    radiusKm: 3,
    zoneType: "district",
    status: "active",
    config: { baseSurge: 1.0, maxSurge: 2.5, autoMode: true, priority: 10 }
  },
  {
    name: "Печерск",
    code: "kyiv-pechersk",
    cityName: "Киев",
    center: { type: "Point", coordinates: [30.5502, 50.4320] },
    radiusKm: 2.5,
    zoneType: "district",
    status: "active",
    config: { baseSurge: 1.0, maxSurge: 2.0, autoMode: true, priority: 8 }
  },
  {
    name: "Оболонь",
    code: "kyiv-obolon",
    cityName: "Киев",
    center: { type: "Point", coordinates: [30.4928, 50.5116] },
    radiusKm: 4,
    zoneType: "district",
    status: "active",
    config: { baseSurge: 1.0, maxSurge: 2.0, autoMode: true, priority: 5 }
  },
  {
    name: "Подол",
    code: "kyiv-podol",
    cityName: "Киев",
    center: { type: "Point", coordinates: [30.5167, 50.4700] },
    radiusKm: 2,
    zoneType: "district",
    status: "active",
    config: { baseSurge: 1.0, maxSurge: 2.0, autoMode: true, priority: 7 }
  },
  {
    name: "Троещина",
    code: "kyiv-troeshchyna",
    cityName: "Киев",
    center: { type: "Point", coordinates: [30.6167, 50.5300] },
    radiusKm: 5,
    zoneType: "district",
    status: "active",
    config: { baseSurge: 1.0, maxSurge: 1.8, autoMode: true, priority: 3 }
  },
  {
    name: "Позняки",
    code: "kyiv-pozniaky",
    cityName: "Киев",
    center: { type: "Point", coordinates: [30.6278, 50.3983] },
    radiusKm: 3.5,
    zoneType: "district",
    status: "active",
    config: { baseSurge: 1.0, maxSurge: 2.0, autoMode: true, priority: 4 }
  }
];

// Insert zones
db = db.getSiblingDB('auto_platform');
db.geozones.deleteMany({});
db.geozones.insertMany(zones);
print("Inserted " + zones.length + " zones");

// Create 2dsphere index
db.geozones.createIndex({ center: "2dsphere" });
print("Created 2dsphere index on zones");
