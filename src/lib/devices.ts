export const DEVICE_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Huawei",
  "OnePlus",
  "Google",
  "Sony",
  "Motorola",
  "Nokia",
  "OPPO",
  "Vivo",
  "Realme",
  "Asus",
  "Lenovo",
  "Microsoft",
  "Honor",
  "Nothing",
  "Fairphone",
  "TCL",
  "LG",
] as const;

export type DeviceBrand = (typeof DEVICE_BRANDS)[number];

export const DEVICE_MODELS: Record<string, string[]> = {
  Apple: [
    // iPhone
    "iPhone 6", "iPhone 6 Plus", "iPhone 6s", "iPhone 6s Plus",
    "iPhone SE (2016)", "iPhone 7", "iPhone 7 Plus",
    "iPhone 8", "iPhone 8 Plus", "iPhone X",
    "iPhone XR", "iPhone XS", "iPhone XS Max",
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
    "iPhone SE (2020)", "iPhone 12", "iPhone 12 Mini",
    "iPhone 12 Pro", "iPhone 12 Pro Max",
    "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
    "iPhone SE (2022)", "iPhone 14", "iPhone 14 Plus",
    "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
    // iPad
    "iPad (5a gen)", "iPad (6a gen)", "iPad (7a gen)", "iPad (8a gen)",
    "iPad (9a gen)", "iPad (10a gen)",
    "iPad Mini 4", "iPad Mini 5", "iPad Mini 6", "iPad Mini 7",
    "iPad Air 3", "iPad Air 4", "iPad Air 5", "iPad Air 11\" M2", "iPad Air 13\" M2",
    "iPad Pro 9.7\"", "iPad Pro 10.5\"", "iPad Pro 11\" (1a gen)",
    "iPad Pro 11\" (2a gen)", "iPad Pro 11\" (3a gen)", "iPad Pro 11\" (4a gen)",
    "iPad Pro 11\" M4", "iPad Pro 12.9\" (3a gen)", "iPad Pro 12.9\" (4a gen)",
    "iPad Pro 12.9\" (5a gen)", "iPad Pro 12.9\" (6a gen)", "iPad Pro 13\" M4",
    // Apple Watch
    "Apple Watch Series 4", "Apple Watch Series 5", "Apple Watch Series 6",
    "Apple Watch Series 7", "Apple Watch Series 8", "Apple Watch Series 9",
    "Apple Watch Ultra", "Apple Watch Ultra 2", "Apple Watch SE (2a gen)",
    // MacBook
    "MacBook Air M1", "MacBook Air M2", "MacBook Air M3",
    "MacBook Pro 13\" M1", "MacBook Pro 13\" M2",
    "MacBook Pro 14\" M3", "MacBook Pro 16\" M3",
  ],

  Samsung: [
    // Galaxy S
    "Galaxy S10", "Galaxy S10+", "Galaxy S10e", "Galaxy S10 5G",
    "Galaxy S20", "Galaxy S20+", "Galaxy S20 Ultra", "Galaxy S20 FE",
    "Galaxy S21", "Galaxy S21+", "Galaxy S21 Ultra", "Galaxy S21 FE",
    "Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra",
    "Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra", "Galaxy S23 FE",
    "Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra", "Galaxy S24 FE",
    "Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra",
    // Galaxy Note
    "Galaxy Note 10", "Galaxy Note 10+", "Galaxy Note 20", "Galaxy Note 20 Ultra",
    // Galaxy A
    "Galaxy A03", "Galaxy A04", "Galaxy A05", "Galaxy A05s",
    "Galaxy A13", "Galaxy A14", "Galaxy A15", "Galaxy A15 5G",
    "Galaxy A23", "Galaxy A24", "Galaxy A25", "Galaxy A25 5G",
    "Galaxy A33 5G", "Galaxy A34 5G", "Galaxy A35 5G",
    "Galaxy A53 5G", "Galaxy A54 5G", "Galaxy A55 5G",
    "Galaxy A73 5G",
    // Galaxy Z
    "Galaxy Z Flip 3", "Galaxy Z Flip 4", "Galaxy Z Flip 5", "Galaxy Z Flip 6",
    "Galaxy Z Fold 3", "Galaxy Z Fold 4", "Galaxy Z Fold 5", "Galaxy Z Fold 6",
    // Tablet
    "Galaxy Tab S6 Lite", "Galaxy Tab S7", "Galaxy Tab S7+", "Galaxy Tab S7 FE",
    "Galaxy Tab S8", "Galaxy Tab S8+", "Galaxy Tab S8 Ultra",
    "Galaxy Tab S9", "Galaxy Tab S9+", "Galaxy Tab S9 Ultra", "Galaxy Tab S9 FE",
    "Galaxy Tab A7", "Galaxy Tab A7 Lite", "Galaxy Tab A8",
    "Galaxy Tab A9", "Galaxy Tab A9+",
  ],

  Xiaomi: [
    // Redmi
    "Redmi 9", "Redmi 9A", "Redmi 9C", "Redmi 9T",
    "Redmi 10", "Redmi 10A", "Redmi 10C",
    "Redmi 12", "Redmi 12C", "Redmi 12 5G",
    "Redmi 13", "Redmi 13C", "Redmi 13 5G",
    "Redmi Note 9", "Redmi Note 9 Pro", "Redmi Note 9S",
    "Redmi Note 10", "Redmi Note 10 Pro", "Redmi Note 10S",
    "Redmi Note 11", "Redmi Note 11 Pro", "Redmi Note 11S",
    "Redmi Note 12", "Redmi Note 12 Pro", "Redmi Note 12S",
    "Redmi Note 13", "Redmi Note 13 Pro", "Redmi Note 13 Pro+",
    // POCO
    "POCO X3", "POCO X3 Pro", "POCO X3 NFC",
    "POCO X4 Pro 5G", "POCO X4 GT",
    "POCO X5", "POCO X5 Pro 5G",
    "POCO X6", "POCO X6 Pro",
    "POCO F3", "POCO F4", "POCO F5", "POCO F6",
    "POCO M3", "POCO M4 Pro", "POCO M5", "POCO M6 Pro",
    // Xiaomi (Mi)
    "Xiaomi 11", "Xiaomi 11T", "Xiaomi 11T Pro",
    "Xiaomi 12", "Xiaomi 12 Pro", "Xiaomi 12T", "Xiaomi 12T Pro",
    "Xiaomi 13", "Xiaomi 13 Pro", "Xiaomi 13T", "Xiaomi 13T Pro",
    "Xiaomi 14", "Xiaomi 14 Pro", "Xiaomi 14T", "Xiaomi 14T Pro",
    // Pad
    "Xiaomi Pad 5", "Xiaomi Pad 6", "Xiaomi Pad 6 Pro",
  ],

  Huawei: [
    // P series
    "P30", "P30 Lite", "P30 Pro",
    "P40", "P40 Lite", "P40 Pro",
    "P50", "P50 Pro",
    "P60", "P60 Pro",
    // Mate
    "Mate 30 Pro", "Mate 40 Pro", "Mate 50 Pro", "Mate 60 Pro",
    // Nova
    "Nova 5T", "Nova 7i", "Nova 8i", "Nova 9", "Nova 10",
    "Nova 11", "Nova 12",
    // Y series
    "Y6p", "Y7a", "Y8p", "Y9a",
    // MediaPad / MatePad
    "MediaPad T5", "MatePad 10.4", "MatePad 11", "MatePad Pro 12.6",
  ],

  OnePlus: [
    "OnePlus 7T", "OnePlus 7 Pro",
    "OnePlus 8", "OnePlus 8 Pro", "OnePlus 8T",
    "OnePlus 9", "OnePlus 9 Pro", "OnePlus 9R",
    "OnePlus 10 Pro", "OnePlus 10T",
    "OnePlus 11", "OnePlus 11R",
    "OnePlus 12", "OnePlus 12R",
    "OnePlus Nord", "OnePlus Nord CE", "OnePlus Nord 2",
    "OnePlus Nord CE 2", "OnePlus Nord CE 2 Lite",
    "OnePlus Nord 3", "OnePlus Nord CE 3",
    "OnePlus Nord 4", "OnePlus Nord CE 4",
    "OnePlus Open",
  ],

  Google: [
    "Pixel 4", "Pixel 4 XL", "Pixel 4a",
    "Pixel 5", "Pixel 5a",
    "Pixel 6", "Pixel 6 Pro", "Pixel 6a",
    "Pixel 7", "Pixel 7 Pro", "Pixel 7a",
    "Pixel 8", "Pixel 8 Pro", "Pixel 8a",
    "Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro XL", "Pixel 9 Pro Fold",
    "Pixel Fold",
    "Pixel Tablet",
  ],

  Sony: [
    "Xperia 1 II", "Xperia 1 III", "Xperia 1 IV", "Xperia 1 V", "Xperia 1 VI",
    "Xperia 5 II", "Xperia 5 III", "Xperia 5 IV", "Xperia 5 V",
    "Xperia 10 III", "Xperia 10 IV", "Xperia 10 V", "Xperia 10 VI",
  ],

  Motorola: [
    // Moto G
    "Moto G9 Play", "Moto G9 Plus",
    "Moto G10", "Moto G20", "Moto G30", "Moto G50",
    "Moto G31", "Moto G41", "Moto G51", "Moto G71",
    "Moto G32", "Moto G42", "Moto G52", "Moto G62",
    "Moto G53", "Moto G73", "Moto G84",
    "Moto G04", "Moto G14", "Moto G24", "Moto G34",
    "Moto G45", "Moto G55", "Moto G85",
    // Edge
    "Motorola Edge 20", "Motorola Edge 30", "Motorola Edge 40",
    "Motorola Edge 50", "Motorola Edge 50 Pro", "Motorola Edge 50 Fusion",
    "Motorola Edge 50 Ultra",
    // Razr
    "Motorola Razr 40", "Motorola Razr 40 Ultra",
    "Motorola Razr 50", "Motorola Razr 50 Ultra",
  ],

  Nokia: [
    "Nokia 5.4", "Nokia 6.3", "Nokia 7.3",
    "Nokia G10", "Nokia G20", "Nokia G50",
    "Nokia X10", "Nokia X20", "Nokia XR20",
    "Nokia C30", "Nokia C31",
    "Nokia G11", "Nokia G21", "Nokia G42",
    "Nokia G60", "Nokia G400",
    "Nokia 3310 (2017)",
  ],

  OPPO: [
    "OPPO A54", "OPPO A55", "OPPO A74", "OPPO A76", "OPPO A78",
    "OPPO A96", "OPPO A98",
    "OPPO Find X3 Pro", "OPPO Find X5", "OPPO Find X5 Pro",
    "OPPO Find X6 Pro", "OPPO Find X7 Ultra",
    "OPPO Reno 6", "OPPO Reno 7", "OPPO Reno 8",
    "OPPO Reno 10", "OPPO Reno 10 Pro",
    "OPPO Reno 12", "OPPO Reno 12 Pro",
  ],

  Vivo: [
    "Vivo Y21", "Vivo Y33s", "Vivo Y52 5G", "Vivo Y72 5G",
    "Vivo V21", "Vivo V23", "Vivo V25",
    "Vivo X60 Pro", "Vivo X70 Pro", "Vivo X80 Pro", "Vivo X90 Pro",
  ],

  Realme: [
    "Realme 8", "Realme 8 Pro", "Realme 8i",
    "Realme 9", "Realme 9 Pro", "Realme 9i",
    "Realme 10", "Realme 10 Pro", "Realme 10 Pro+",
    "Realme 11", "Realme 11 Pro", "Realme 11 Pro+",
    "Realme 12", "Realme 12 Pro", "Realme 12 Pro+",
    "Realme C21", "Realme C25", "Realme C31", "Realme C33",
    "Realme C35", "Realme C51", "Realme C53", "Realme C55",
    "Realme GT Neo 3", "Realme GT Neo 5",
    "Realme GT 6",
  ],

  Asus: [
    "Zenfone 8", "Zenfone 9", "Zenfone 10", "Zenfone 11 Ultra",
    "ROG Phone 5", "ROG Phone 6", "ROG Phone 7", "ROG Phone 8",
    "Asus Vivobook 15", "Asus Vivobook 16",
  ],

  Lenovo: [
    "Lenovo Tab M8", "Lenovo Tab M10", "Lenovo Tab M10 Plus",
    "Lenovo Tab P11", "Lenovo Tab P11 Pro", "Lenovo Tab P12",
    "Lenovo Tab P12 Pro",
    "Lenovo Tab M9",
    "Lenovo ThinkPad X1 Carbon",
    "Lenovo IdeaPad 5",
  ],

  Microsoft: [
    "Surface Pro 7", "Surface Pro 8", "Surface Pro 9", "Surface Pro 10",
    "Surface Go 2", "Surface Go 3", "Surface Go 4",
    "Surface Laptop 4", "Surface Laptop 5", "Surface Laptop 6",
    "Surface Laptop Studio", "Surface Laptop Studio 2",
    "Surface Duo 2",
  ],

  Honor: [
    "Honor 50", "Honor 70", "Honor 90", "Honor 200",
    "Honor Magic 4", "Honor Magic 5", "Honor Magic 6",
    "Honor X8", "Honor X9", "Honor X9b",
    "Honor Pad 8", "Honor Pad X8",
  ],

  Nothing: [
    "Nothing Phone (1)",
    "Nothing Phone (2)",
    "Nothing Phone (2a)",
    "Nothing Phone (3a)",
  ],

  Fairphone: [
    "Fairphone 4", "Fairphone 5",
  ],

  TCL: [
    "TCL 20 SE", "TCL 20L", "TCL 20 Pro 5G",
    "TCL 30", "TCL 30 SE", "TCL 30+",
    "TCL 40 SE", "TCL 40 NxtPaper",
    "TCL Tab 10 Gen 2",
  ],

  LG: [
    "LG G8", "LG V50", "LG Velvet",
    "LG Wing", "LG G9 ThinQ",
  ],
};
