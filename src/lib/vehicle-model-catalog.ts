export type VehicleModelCatalogEntry = {
  brand: string;
  models: Array<{
    name: string;
    versions: string[];
  }>;
};

export const vehicleModelCatalog = [
  {
    brand: "Toyota",
    models: [
      { name: "Hilux", versions: ["DX", "DX 4x2", "DX 4x4", "SR", "SR 4x2", "SR 4x4", "SRV", "SRV 4x2", "SRV 4x4", "SRX", "SRX 4x4", "GR-Sport", "Conquest"] },
      { name: "SW4", versions: ["SR", "SRX", "Diamond", "GR-Sport"] },
      { name: "Corolla", versions: ["XLI", "XEI", "SEG", "Hybrid XEI", "Hybrid SEG", "GR-S"] },
      { name: "Corolla Cross", versions: ["XLI", "XEI", "SEG", "Hybrid XEI", "Hybrid SEG", "GR-S"] },
      { name: "Yaris", versions: ["XS", "XLS", "S", "S CVT", "GR-S"] },
      { name: "Etios", versions: ["X", "XS", "XLS", "Cross", "Platinum"] },
      { name: "RAV4", versions: ["2.0 4x2", "2.5 4x4", "Hybrid", "Limited"] },
      { name: "Camry", versions: ["XLE", "V6", "Hybrid"] },
      { name: "Land Cruiser", versions: ["Prado", "VX", "VXR"] },
      { name: "Prius", versions: ["Hybrid", "Base"] },
    ],
  },
  {
    brand: "Volkswagen",
    models: [
      { name: "Amarok", versions: ["Trendline 4x2", "Trendline 4x4", "Comfortline", "Highline", "Highline Pack", "Extreme", "V6 Comfortline", "V6 Highline", "V6 Extreme", "Black Style"] },
      { name: "Gol", versions: ["Power", "Trend", "Trendline", "Comfortline", "Highline", "Pack I", "Pack II", "Pack III", "Serie"] },
      { name: "Gol Trend", versions: ["Pack I", "Pack II", "Pack III", "Trendline", "Comfortline", "Highline", "Serie", "I-Motion"] },
      { name: "Voyage", versions: ["Trendline", "Comfortline", "Highline", "I-Motion"] },
      { name: "Fox", versions: ["Comfortline", "Trendline", "Highline", "Pepper", "Connect", "Suran Fox"] },
      { name: "Suran", versions: ["Comfortline", "Highline", "Cross", "I-Motion"] },
      { name: "Polo", versions: ["Track", "Trendline", "Comfortline", "Highline", "GTS", "MSI"] },
      { name: "Virtus", versions: ["Trendline", "Comfortline", "Highline", "GTS", "MSI"] },
      { name: "Vento", versions: ["Advance", "Advance Plus", "Luxury", "Sportline", "GLI", "2.5", "TSI"] },
      { name: "Bora", versions: ["Trendline", "Comfortline", "Highline", "1.8T", "TDI"] },
      { name: "Golf", versions: ["Trendline", "Comfortline", "Highline", "GTI", "Variant"] },
      { name: "Saveiro", versions: ["Cabina Simple", "Cabina Extendida", "Doble Cabina", "Pack", "High", "Cross"] },
      { name: "Taos", versions: ["Comfortline", "Highline", "Hero"] },
      { name: "T-Cross", versions: ["Trendline", "Comfortline", "Highline", "Hero"] },
      { name: "Tiguan", versions: ["Trendline", "Sport & Style", "Allspace", "Comfortline", "Highline"] },
      { name: "Up", versions: ["Take Up", "Move Up", "High Up", "Cross Up", "Pepper"] },
    ],
  },
  {
    brand: "Ford",
    models: [
      { name: "Ranger", versions: ["XL 4x2", "XL 4x4", "XLS 4x2", "XLS 4x4", "XLT 4x2", "XLT 4x4", "Limited", "Limited 4x4", "Black", "Raptor", "Wildtrak"] },
      { name: "F-100", versions: ["Base", "Custom", "Deluxe", "Duty", "4x2", "4x4"] },
      { name: "F-150", versions: ["Lariat", "Platinum", "Raptor", "Limited"] },
      { name: "Mustang", versions: ["EcoBoost", "GT", "Mach 1", "Dark Horse", "Shelby GT500"] },
      { name: "EcoSport", versions: ["S", "SE", "FreeStyle", "Titanium", "Storm", "4WD"] },
      { name: "Fiesta", versions: ["One", "Ambiente", "Edge", "Kinetic", "S", "SE", "Titanium"] },
      { name: "Focus", versions: ["One", "Edge", "Trend", "S", "SE", "SE Plus", "Titanium", "Ghia"] },
      { name: "Ka", versions: ["Fly", "Viral", "S", "SE", "SEL", "Freestyle"] },
      { name: "Mondeo", versions: ["Ghia", "Titanium", "Vignale"] },
      { name: "Kuga", versions: ["Sel", "Titanium", "Hybrid"] },
      { name: "Territory", versions: ["SEL", "Titanium"] },
      { name: "Maverick", versions: ["XLT", "Lariat", "FX4"] },
      { name: "Bronco Sport", versions: ["Big Bend", "Wildtrak"] },
      { name: "Transit", versions: ["Furgon", "Minibus", "Chasis"] },
    ],
  },
  {
    brand: "Chevrolet",
    models: [
      { name: "S10", versions: ["LS 4x2", "LS 4x4", "LT 4x2", "LT 4x4", "LTZ", "LTZ 4x4", "High Country", "Z71"] },
      { name: "Silverado", versions: ["LT", "LTZ", "High Country", "Z71", "Trail Boss"] },
      { name: "Camaro", versions: ["LT", "RS", "SS", "ZL1", "Convertible"] },
      { name: "Onix", versions: ["Joy", "LS", "LT", "LTZ", "Premier", "RS", "Plus"] },
      { name: "Corsa", versions: ["Classic", "City", "GL", "GLS", "Super", "Wind", "Wagon"] },
      { name: "Classic", versions: ["LS", "LT", "Spirit", "Advantage"] },
      { name: "Celta", versions: ["LS", "LT", "Advantage"] },
      { name: "Agile", versions: ["LS", "LT", "LTZ", "Effect"] },
      { name: "Prisma", versions: ["Joy", "LT", "LTZ", "Advantage"] },
      { name: "Cruze", versions: ["LT", "LTZ", "Premier", "RS", "5 Puertas"] },
      { name: "Tracker", versions: ["LS", "LT", "LTZ", "Premier", "RS"] },
      { name: "Spin", versions: ["LT", "LTZ", "Activ", "Premier"] },
      { name: "Meriva", versions: ["GL", "GLS", "CD", "Easytronic"] },
      { name: "Astra", versions: ["GL", "GLS", "CD", "GSI"] },
      { name: "Vectra", versions: ["GLS", "CD", "GT", "GTX"] },
      { name: "Captiva", versions: ["LS", "LT", "LTZ", "AWD"] },
      { name: "Montana", versions: ["LS", "Sport", "Conquest"] },
    ],
  },
  {
    brand: "Fiat",
    models: [
      { name: "Toro", versions: ["Freedom", "Volcano", "Ranch", "Ultra", "Endurance", "4x2", "4x4"] },
      { name: "Titano", versions: ["Endurance 4x2", "Endurance 4x4", "Freedom 4x4", "Volcano 4x4", "Ranch 4x4"] },
      { name: "Strada", versions: ["Working", "Trekking", "Adventure", "Freedom", "Volcano", "Endurance"] },
      { name: "Cronos", versions: ["Attractive", "Like", "Drive", "Precision", "Stile", "S-Design"] },
      { name: "Argo", versions: ["Drive", "Precision", "HGT", "Trekking", "S-Design"] },
      { name: "Pulse", versions: ["Drive", "Audace", "Impetus", "Abarth"] },
      { name: "Fastback", versions: ["Turbo", "Audace", "Impetus", "Limited", "Abarth"] },
      { name: "Palio", versions: ["Fire", "ELX", "HLX", "Attractive", "Essence", "Sporting", "Adventure"] },
      { name: "Siena", versions: ["Fire", "EL", "ELX", "HLX", "Attractive", "Essence"] },
      { name: "Uno", versions: ["Fire", "Way", "Attractive", "Sporting", "Cargo"] },
      { name: "Punto", versions: ["Attractive", "Essence", "Sporting", "Blackmotion", "T-Jet"] },
      { name: "Idea", versions: ["Attractive", "Essence", "Adventure", "Sporting"] },
      { name: "Ducato", versions: ["Furgon", "Combinato", "Minibus", "Chasis"] },
      { name: "Mobi", versions: ["Easy", "Like", "Way", "Trekking"] },
    ],
  },
  {
    brand: "Renault",
    models: [
      { name: "Kangoo", versions: ["Express", "Confort", "Emotion", "Authentique", "Sportway", "Furgon", "Pasajeros"] },
      { name: "Duster", versions: ["Expression", "Dynamique", "Privilege", "Outsider", "Intens", "Iconic", "Oroch"] },
      { name: "Sandero", versions: ["Authentique", "Expression", "Dynamique", "Privilege", "Life", "Zen", "Intens", "Stepway", "RS"] },
      { name: "Logan", versions: ["Authentique", "Expression", "Dynamique", "Privilege", "Life", "Zen", "Intens"] },
      { name: "Clio", versions: ["RL", "RN", "RT", "Authentique", "Expression", "Dynamique", "Mio"] },
      { name: "Megane", versions: ["Expression", "Privilege", "Luxe", "Sportway", "RS"] },
      { name: "Fluence", versions: ["Confort", "Dynamique", "Privilege", "GT", "Luxe"] },
      { name: "Symbol", versions: ["Authentique", "Expression", "Luxe"] },
      { name: "Scenic", versions: ["RT", "RXE", "Privilege", "Sportway"] },
      { name: "Captur", versions: ["Zen", "Intens", "Iconic", "Bose"] },
      { name: "Kwid", versions: ["Life", "Zen", "Intens", "Iconic"] },
      { name: "Alaskan", versions: ["Confort", "Emotion", "Iconic", "Outsider", "4x2", "4x4"] },
      { name: "Trafic", versions: ["Furgon", "Minibus", "Combi"] },
    ],
  },
  {
    brand: "Peugeot",
    models: [
      { name: "208", versions: ["Like", "Active", "Allure", "Feline", "GT", "GT-Line", "XY"] },
      { name: "207", versions: ["Compact", "XS", "XT", "Feline", "Allure", "GTI"] },
      { name: "206", versions: ["XR", "XS", "XT", "Premium", "GTI", "CC"] },
      { name: "2008", versions: ["Active", "Allure", "Feline", "GT", "Sport"] },
      { name: "308", versions: ["Active", "Allure", "Feline", "GT", "GTI", "SW"] },
      { name: "307", versions: ["XR", "XS", "XT", "Premium", "Feline", "SW"] },
      { name: "408", versions: ["Active", "Allure", "Feline", "Sport", "HDI"] },
      { name: "3008", versions: ["Allure", "GT-Line", "GT", "Hybrid"] },
      { name: "5008", versions: ["Allure", "GT-Line", "GT"] },
      { name: "Partner", versions: ["Confort", "Patagonica", "Furgon", "Presence", "PLC"] },
      { name: "Expert", versions: ["Furgon", "Minibus", "Business"] },
      { name: "Boxer", versions: ["Furgon", "Minibus", "Chasis"] },
    ],
  },
  {
    brand: "Citroen",
    models: [
      { name: "C3", versions: ["Live", "Feel", "Shine", "SX", "Exclusive", "Aircross"] },
      { name: "C3 Aircross", versions: ["Live", "Feel", "Shine", "Exclusive"] },
      { name: "C4", versions: ["X", "SX", "Exclusive", "Lounge", "VTS", "Cactus"] },
      { name: "C4 Lounge", versions: ["Origine", "Tendance", "Exclusive", "Feel", "Shine"] },
      { name: "C4 Cactus", versions: ["Feel", "Shine", "Rip Curl"] },
      { name: "Berlingo", versions: ["Furgon", "Multispace", "XTR", "Business"] },
      { name: "Xsara Picasso", versions: ["SX", "Exclusive", "Picasso"] },
      { name: "C-Elysee", versions: ["Feel", "Shine", "HDI"] },
      { name: "Jumper", versions: ["Furgon", "Minibus", "Chasis"] },
    ],
  },
  {
    brand: "Nissan",
    models: [
      { name: "Frontier", versions: ["S 4x2", "S 4x4", "SE", "XE", "LE", "Attack", "Platinum", "PRO-4X", "X-Gear"] },
      { name: "Kicks", versions: ["Sense", "Advance", "Exclusive", "Play", "X-Play"] },
      { name: "Versa", versions: ["Sense", "Advance", "Exclusive", "SR"] },
      { name: "March", versions: ["Active", "Sense", "Advance", "Media-Tech", "SR"] },
      { name: "Sentra", versions: ["Sense", "Advance", "Exclusive", "SR"] },
      { name: "Tiida", versions: ["Visia", "Acenta", "Tekna"] },
      { name: "X-Trail", versions: ["Sense", "Advance", "Exclusive", "Tekna"] },
      { name: "Murano", versions: ["SL", "Exclusive"] },
      { name: "Note", versions: ["Sense", "Advance", "Exclusive"] },
      { name: "Pathfinder", versions: ["SE", "LE", "Platinum"] },
    ],
  },
  {
    brand: "Jeep",
    models: [
      { name: "Renegade", versions: ["Sport", "Longitude", "Limited", "Trailhawk", "Willys"] },
      { name: "Compass", versions: ["Sport", "Longitude", "Limited", "Trailhawk", "S"] },
      { name: "Commander", versions: ["Limited", "Overland"] },
      { name: "Wrangler", versions: ["Sport", "Sahara", "Rubicon", "Unlimited"] },
      { name: "Cherokee", versions: ["Sport", "Longitude", "Limited", "Trailhawk"] },
      { name: "Grand Cherokee", versions: ["Laredo", "Limited", "Overland", "Summit", "SRT"] },
      { name: "Patriot", versions: ["Sport", "Limited"] },
    ],
  },
  {
    brand: "Honda",
    models: [
      { name: "HR-V", versions: ["LX", "EX", "EXL", "Touring"] },
      { name: "WR-V", versions: ["LX", "EX", "EXL"] },
      { name: "Civic", versions: ["LX", "EX", "EXS", "EXL", "Touring", "SI"] },
      { name: "CR-V", versions: ["LX", "EX", "EXL", "Touring", "4WD"] },
      { name: "Fit", versions: ["LX", "LXL", "EX", "EXL", "Twist"] },
      { name: "City", versions: ["LX", "EX", "EXL"] },
      { name: "Accord", versions: ["LX", "EX", "EXL", "V6"] },
      { name: "Pilot", versions: ["EX", "EXL", "Touring"] },
    ],
  },
  {
    brand: "Mercedes-Benz",
    models: [
      { name: "Sprinter", versions: ["Furgon", "Combi", "Minibus", "Chasis", "Street"] },
      { name: "Clase A", versions: ["A200", "A250", "AMG A35", "AMG A45"] },
      { name: "Clase B", versions: ["B200", "B250"] },
      { name: "Clase C", versions: ["C180", "C200", "C250", "C300", "AMG C43", "AMG C63"] },
      { name: "Clase E", versions: ["E200", "E250", "E300", "E350", "AMG E63"] },
      { name: "GLA", versions: ["GLA 200", "GLA 250", "AMG GLA 35", "AMG GLA 45"] },
      { name: "GLC", versions: ["GLC 300", "Coupe", "AMG GLC 43", "AMG GLC 63"] },
      { name: "Vito", versions: ["Furgon", "Tourer", "Mixto"] },
    ],
  },
  {
    brand: "BMW",
    models: [
      { name: "Serie 1", versions: ["116i", "118i", "120i", "125i", "M135i", "M140i"] },
      { name: "Serie 2", versions: ["220i", "230i", "M240i", "Gran Coupe"] },
      { name: "Serie 3", versions: ["318i", "320i", "325i", "328i", "330i", "335i", "M3"] },
      { name: "Serie 4", versions: ["420i", "428i", "430i", "435i", "440i", "M4"] },
      { name: "Serie 5", versions: ["520i", "523i", "528i", "530i", "535i", "M5"] },
      { name: "X1", versions: ["sDrive18i", "sDrive20i", "xDrive20i", "xDrive25i"] },
      { name: "X3", versions: ["xDrive20i", "xDrive28i", "xDrive30i", "M40i"] },
      { name: "X5", versions: ["xDrive35i", "xDrive40i", "xDrive50i", "M"] },
    ],
  },
  {
    brand: "Audi",
    models: [
      { name: "A1", versions: ["Attraction", "Ambition", "Sportback", "S-Line"] },
      { name: "A3", versions: ["Attraction", "Ambition", "Sportback", "Sedan", "S-Line", "S3"] },
      { name: "A4", versions: ["Attraction", "Ambition", "Luxury", "S-Line", "Avant"] },
      { name: "A5", versions: ["Coupe", "Sportback", "Cabrio", "S-Line", "S5"] },
      { name: "A6", versions: ["Luxury", "S-Line", "Quattro"] },
      { name: "Q2", versions: ["Design", "Sport", "S-Line"] },
      { name: "Q3", versions: ["Attraction", "Ambition", "S-Line", "Sportback"] },
      { name: "Q5", versions: ["Luxury", "S-Line", "Quattro"] },
      { name: "TT", versions: ["Coupe", "Roadster", "TTS"] },
    ],
  },
  {
    brand: "Hyundai",
    models: [
      { name: "Tucson", versions: ["GL", "GLS", "Limited", "4WD"] },
      { name: "Santa Fe", versions: ["GLS", "Limited", "4WD"] },
      { name: "Creta", versions: ["Safety", "Comfort", "Style", "Premium"] },
      { name: "HB20", versions: ["Comfort", "Style", "Premium", "Sense"] },
      { name: "i10", versions: ["GL", "GLS"] },
      { name: "i30", versions: ["GLS", "Premium", "N"] },
      { name: "Elantra", versions: ["GLS", "Limited"] },
      { name: "H1", versions: ["Minibus", "Furgon", "Premium"] },
    ],
  },
  {
    brand: "Kia",
    models: [
      { name: "Sportage", versions: ["LX", "EX", "SX", "GT-Line", "AWD"] },
      { name: "Sorento", versions: ["LX", "EX", "SX", "AWD"] },
      { name: "Soul", versions: ["Classic", "Pop", "EX", "SX"] },
      { name: "Rio", versions: ["LX", "EX", "SX"] },
      { name: "Cerato", versions: ["EX", "SX", "Forte"] },
      { name: "Picanto", versions: ["LX", "EX", "GT-Line"] },
      { name: "Carnival", versions: ["EX", "Premium"] },
    ],
  },
  {
    brand: "Mitsubishi",
    models: [
      { name: "L200", versions: ["GL", "GLS", "Outdoor", "Sport", "Triton", "4x4"] },
      { name: "Montero", versions: ["GLS", "Limited", "Sport"] },
      { name: "Outlander", versions: ["GLS", "Limited", "4WD"] },
      { name: "ASX", versions: ["GLS", "4WD"] },
      { name: "Eclipse Cross", versions: ["GLS", "HPE", "4WD"] },
    ],
  },
  {
    brand: "Chery",
    models: [
      { name: "Tiggo", versions: ["2", "3", "4", "5", "7", "8", "Comfort", "Luxury"] },
      { name: "QQ", versions: ["Light", "Confort", "Luxury"] },
      { name: "Fulwin", versions: ["Sedan", "Hatch"] },
      { name: "Arrizo", versions: ["5", "6", "Comfort", "Luxury"] },
    ],
  },
  {
    brand: "Suzuki",
    models: [
      { name: "Vitara", versions: ["JX", "JLX", "GL", "GLX", "AllGrip"] },
      { name: "Grand Vitara", versions: ["JIII", "2.0", "2.4", "4x4"] },
      { name: "Fun", versions: ["Base", "Full"] },
      { name: "Swift", versions: ["GL", "GLX", "Sport"] },
      { name: "Jimny", versions: ["JX", "JLX", "GLX"] },
    ],
  },
  {
    brand: "Dodge",
    models: [
      { name: "Journey", versions: ["SXT", "R/T", "Crossroad"] },
      { name: "Ram 1500", versions: ["Laramie", "Limited", "Rebel", "Big Horn"] },
      { name: "Ram 2500", versions: ["Laramie", "Heavy Duty"] },
      { name: "Dakota", versions: ["Sport", "SLT", "4x2", "4x4"] },
      { name: "Polara", versions: ["Sedan", "Coupe", "RT"] },
      { name: "1500", versions: ["Base", "GT", "M 1.8"] },
    ],
  },
  {
    brand: "Iveco",
    models: [
      { name: "Daily", versions: ["Furgon", "Chasis", "Minibus", "35S", "55C"] },
      { name: "Tector", versions: ["Attack", "Evo", "Chasis"] },
      { name: "Eurocargo", versions: ["Chasis", "Tractor"] },
    ],
  },
] satisfies VehicleModelCatalogEntry[];

export const vehicleBrandOptions = vehicleModelCatalog.map((entry) => entry.brand);

export function getModelsForBrand(brand: string) {
  return (
    vehicleModelCatalog.find(
      (entry) => entry.brand.toLowerCase() === brand.trim().toLowerCase()
    )?.models ?? []
  );
}

export function getModelOptionsForBrand(brand: string) {
  return getModelsForBrand(brand).map((model) => model.name);
}

export function getVersionsForBrandModel(brand: string, model: string) {
  return (
    getModelsForBrand(brand).find(
      (entry) => entry.name.toLowerCase() === model.trim().toLowerCase()
    )?.versions ?? []
  );
}
