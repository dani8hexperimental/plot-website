import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "data", "projects", "green-valley");
mkdirSync(out, { recursive: true });

// The PDF is a schematic plan without georeferenced control points. These
// coordinates place the same plan inside the supplied site boundary.
const sitePoint = [77.14800666, 17.36609423];
const metersPerDegree = [
  111320 * Math.cos((sitePoint[1] * Math.PI) / 180),
  111320,
];
const mainRoadReference = [
  [77.1475246, 17.3657556],
  [77.1483053, 17.365459],
];
const mainRoadMidpoint = [
  (mainRoadReference[0][0] + mainRoadReference[1][0]) / 2,
  (mainRoadReference[0][1] + mainRoadReference[1][1]) / 2,
];
const mainRoadVector = [
  (mainRoadReference[1][0] - mainRoadReference[0][0]) * metersPerDegree[0],
  (mainRoadReference[1][1] - mainRoadReference[0][1]) * metersPerDegree[1],
];
const mainRoadLength = Math.hypot(...mainRoadVector);
const along = [mainRoadVector[0] / mainRoadLength, mainRoadVector[1] / mainRoadLength];
const intoLayout = [-along[1], along[0]];
const layoutOffsetFromRoad = 20;

// y=100 is the supplied road edge. All generated layout geometry is set back.
const coordinate = (x, y) => {
  const offsetY = y - 100 + layoutOffsetFromRoad;
  return [
    mainRoadMidpoint[0] + (x * along[0] + offsetY * intoLayout[0]) / metersPerDegree[0],
    mainRoadMidpoint[1] + (x * along[1] + offsetY * intoLayout[1]) / metersPerDegree[1],
  ];
};

const feature = (id, properties, geometry) => ({
  type: "Feature",
  properties: { id, ...properties },
  geometry,
});

const rectangle = (x, y, width, height) => {
  const points = [
    coordinate(x, y),
    coordinate(x + width, y),
    coordinate(x + width, y + height),
    coordinate(x, y + height),
  ];
  return [...points, points[0]];
};

const plotWidth = 12.192; // 40 ft frontage
const standardPlotDepth = 9.144; // 30 ft depth
const roadWidth = 9;

const oddPlots = new Map([
  [1, { area: 396, areaSqft: 4262.5 }],
  [17, { area: 135, areaSqft: 1453 }],
  [18, { area: 121.2, areaSqft: 1304.5 }],
  [32, { area: 175.2, areaSqft: 1885.8 }],
  [33, { area: 230, areaSqft: 2475.7 }],
  [47, { area: 136.5, areaSqft: 1469.2 }],
  [48, { area: 149.4, areaSqft: 1608 }],
  [71, { area: 216.7, areaSqft: 2332.5 }],
]);

// Boundary plots follow the angled site edges in the supplied plan instead of
// using the rectangular footprint used by the regular plots.
const irregularShapes = new Map([
  [1, { bottomWidth: 18, topWidth: plotWidth, topOffset: 1.5 }],
  [17, { bottomWidth: plotWidth, topWidth: 10.8, topOffset: 1.2 }],
  [18, { bottomWidth: plotWidth, topWidth: 10.8, topOffset: 0.8 }],
  [32, { bottomWidth: 15.2, topWidth: plotWidth, topOffset: 0.4 }],
  [33, { bottomWidth: 15.2, topWidth: plotWidth, topOffset: 0.2 }],
  [47, { bottomWidth: plotWidth, topWidth: 10.8, topOffset: 0.8 }],
  [48, { bottomWidth: plotWidth, topWidth: 14.8, topOffset: -1.2 }],
  [71, { bottomWidth: 17.2, topWidth: plotWidth, topOffset: -0.8 }],
]);

const developerPlots = new Set([
  3, 4, 5, 6, 10, 11, 12, 13, 22, 23, 24, 25, 32, 33, 41,
  46, 47, 55, 56, 57, 58, 62, 63, 66, 67, 68, 69,
]);

// Four plot bands flank two outer 9 m road corridors. The central gap between
// the middle bands is reserved for the CA SITE and PARK.
const plotColumns = {
  west: -56,
  centerWest: -34.808,
  centerEast: -34.808 + plotWidth,
  east: -34.808 + plotWidth * 2 + roadWidth,
};
const roadColumns = {
  west: -39.308,
  east: -34.808 + plotWidth * 2 + roadWidth / 2,
};

const plots = [];
const addPlot = (number, x, y) => {
  const ownership = developerPlots.has(number) ? "developer" : "owner";
  const odd = oddPlots.get(number);
  const depth = odd ? odd.area / plotWidth : standardPlotDepth;
  const shape = irregularShapes.get(number);
  const geometry = shape
    ? {
        type: "Polygon",
        coordinates: [
          [
            coordinate(x, y),
            coordinate(x + shape.bottomWidth, y),
            coordinate(x + shape.topOffset + shape.topWidth, y + depth),
            coordinate(x + shape.topOffset, y + depth),
            coordinate(x, y),
          ],
        ],
      }
    : { type: "Polygon", coordinates: [rectangle(x, y, plotWidth, depth)] };
  plots.push(
    feature(
      `P${String(number).padStart(2, "0")}`,
      {
        number: String(number),
        area: odd?.area ?? 111.48,
        areaSqft: odd?.areaSqft ?? 1200,
        dimensions: odd ? "Unique size shown in document" : "30 x 40 ft",
        status: ownership === "developer" ? "available" : "sold",
        ownership,
        price: 0,
        facing: "East",
        roadWidth: 9,
        zone: "Bharat ASM Colony",
      },
      geometry
    )
  );
  return depth;
};

const addColumn = (numbers, x, startY) => {
  let y = startY;
  for (const number of numbers) {
    y += addPlot(number, x, y);
  }
  return y;
};

// Lower bands are contiguous. Their number direction follows the pamphlet,
// with the first number in each band nearest the main road where applicable.
addColumn([1, 2, 3, 4, 5, 6, 7], plotColumns.west, 115);
addColumn(
  [32, 31, 30, 29, 28, 27, 26, 25, 24],
  plotColumns.centerWest,
  115
);
addColumn(
  [33, 34, 35, 36, 37, 38, 39, 40, 41],
  plotColumns.centerEast,
  115
);
const eastLowerEnd = addColumn(
  [71, 70, 69, 68, 67, 66, 65, 64, 63, 62],
  plotColumns.east,
  115
);
const crossRoadY = eastLowerEnd + roadWidth / 2;
// The 9 m cross-road separates the lower and upper plan sections.
const westUpperEnd = addColumn(
  [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  plotColumns.west,
  crossRoadY + roadWidth / 2
);
addColumn(
  [23, 22, 21, 20, 19, 18],
  plotColumns.centerWest,
  309
);
addColumn(
  [42, 43, 44, 45, 46, 47],
  plotColumns.centerEast,
  309
);

const eastUpperEnd = addColumn(
  [61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48],
  plotColumns.east,
  crossRoadY + roadWidth / 2
);
const roadBottom = 110;
const boundaryPadding = 2;
const layoutMinX = plotColumns.west - boundaryPadding;
const layoutMaxX = plotColumns.east + plotWidth + boundaryPadding;

const boundary = rectangle(layoutMinX, 100, layoutMaxX - layoutMinX, 280);

const write = (name, data) =>
  writeFileSync(path.join(out, name), `${JSON.stringify(data, null, 2)}\n`);

write("project.json", {
  id: "bharat-asm-colony",
  name: "Bharat ASM Colony",
  slug: "green-valley",
  location: { latitude: sitePoint[1], longitude: sitePoint[0] },
  map: { defaultZoom: 17, minZoom: 15, maxZoom: 20 },
  description:
    "NA and TP approved 4 acre 10 guntas plotted development at 120/3 and 120/4, Kalgi, Kalaburagi.",
  contact: { phone: "+91-98765-43210", email: "sales@asm-builders.example" },
  plan: {
    totalPlots: 71,
    ownerPlots: 44,
    developerPlots: 27,
    ownerAreaSqm: 5417.3,
    developerAreaSqm: 3181,
  },
});

write("plots.geojson", { type: "FeatureCollection", features: plots });

write("zones.geojson", {
  type: "FeatureCollection",
  features: [
    feature("layout-boundary", { name: "Bharat ASM Colony Layout", kind: "boundary" }, {
      type: "Polygon",
      coordinates: [boundary],
    }),
  ],
});

write("roads.geojson", {
  type: "FeatureCollection",
  features: [
    feature("main-road", { name: "MAIN ROAD", width: 9, kind: "main" }, {
      type: "LineString",
      coordinates: mainRoadReference,
    }),
    feature("road-west", { name: "9 MTS WIDE ROAD", width: roadWidth, kind: "internal" }, {
      type: "LineString",
      coordinates: [coordinate(roadColumns.west, roadBottom), coordinate(roadColumns.west, westUpperEnd)],
    }),
    feature("road-east", { name: "9 MTS WIDE ROAD", width: roadWidth, kind: "internal" }, {
      type: "LineString",
      coordinates: [coordinate(roadColumns.east, roadBottom), coordinate(roadColumns.east, eastUpperEnd)],
    }),
    feature("road-crossing", { name: "9 MTS WIDE ROAD", width: roadWidth, kind: "internal" }, {
      type: "LineString",
      coordinates: [
        coordinate(layoutMinX, crossRoadY),
        coordinate(layoutMaxX, crossRoadY),
      ],
    }),
  ],
});

write("amenities.geojson", {
  type: "FeatureCollection",
  features: [
    feature("ca-site", { name: "CA SITE", kind: "ca-site" }, {
      type: "Polygon",
      coordinates: [rectangle(plotColumns.centerWest, 230, plotWidth * 2, 32)],
    }),
    feature("park", { name: "PARK", kind: "park" }, {
      type: "Polygon",
      coordinates: [rectangle(plotColumns.centerWest, 268, plotWidth * 2, 32)],
    }),
  ],
});

console.log(`Generated ${plots.length} document-based plots for Bharat ASM Colony.`);
