# Interactive Real Estate Plot Viewer

## Technical Architecture & Development Plan

## 1. Project Overview

### Objective

Build a visually interactive real estate website that allows potential buyers to explore a land development project through an interactive map.

Users should be able to:

* View the complete project layout
* Explore individual land plots
* Click on plots to view detailed information
* Identify plot availability through visual indicators
* Filter plots based on availability and attributes
* View project amenities and infrastructure
* Open a shareable link directly to a specific plot
* View images, videos, and project information

The application will be **completely view-only**.

There will be:

* No backend
* No database
* No authentication
* No user accounts
* No user tracking
* No CRM
* No payment processing

All project and plot information will be stored as static configuration files and served directly by the frontend.

---

# 2. Core Architectural Principle

The application should be treated as a:

> **Static Geospatial Visualization Application**

rather than a traditional real estate application.

The architecture should separate:

1. **Geospatial data**
2. **Plot metadata**
3. **Project configuration**
4. **Media assets**
5. **UI rendering logic**

The frontend should act purely as a rendering and interaction layer over static project data.

```text
                     STATIC DATA
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    Project Config    GeoJSON         Media
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
                  Frontend Engine
                         │
                         ▼
                Interactive Map UI
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Plots       Filters    Details
```

---

# 3. Technology Stack

## Frontend

| Technology   | Purpose               |
| ------------ | --------------------- |
| Next.js      | Application framework |
| TypeScript   | Type safety           |
| React        | UI rendering          |
| Tailwind CSS | Styling               |
| Zod          | Data validation       |

## Mapping

Preferred options:

| Option         | Usage                                 |
| -------------- | ------------------------------------- |
| MapLibre GL JS | Preferred open-source option          |
| Mapbox GL JS   | Alternative with managed map services |

Recommended starting point:

> **MapLibre GL JS**

This avoids unnecessary vendor lock-in and provides sufficient capabilities for rendering polygons, labels, layers, and interactions.

## Data Formats

| Data                 | Format            |
| -------------------- | ----------------- |
| Plot geometry        | GeoJSON           |
| Roads                | GeoJSON           |
| Amenities            | GeoJSON           |
| Project metadata     | JSON / TypeScript |
| Static configuration | JSON              |
| Images               | WebP / AVIF       |
| Videos               | MP4 / CDN hosted  |

## Hosting

Recommended:

> **Vercel**

Alternative options:

* Cloudflare Pages
* Netlify
* AWS S3 + CloudFront

Since the application is fully static, there is no server infrastructure requirement.

---

# 4. High-Level Architecture

```text
                         USER
                           │
                           ▼
                  ┌─────────────────┐
                  │    Next.js      │
                  │ Static Website  │
                  └────────┬────────┘
                           │
           ┌───────────────┼────────────────┐
           │               │                │
           ▼               ▼                ▼
      Project Config     GeoJSON         Media CDN
           │               │                │
           └───────────────┼────────────────┘
                           │
                           ▼
                   Map Rendering Engine
                           │
                           ▼
                   Interactive UI
```

The application should be deployable as a static site.

```text
git push
    │
    ▼
CI Build
    │
    ▼
Data Validation
    │
    ▼
Static Build
    │
    ▼
Deployment
```

---

# 5. Data Architecture

The project data should be divided into multiple independent files.

Avoid putting everything into a single massive JSON file.

Recommended structure:

```text
project-data/
│
├── project.json
├── plots.geojson
├── roads.geojson
├── amenities.geojson
├── zones.geojson
└── media.json
```

This separation ensures that each type of data has a clear responsibility.

---

# 6. Project Configuration

`project.json`

```json
{
  "id": "green-valley",
  "name": "Green Valley",
  "slug": "green-valley",

  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },

  "map": {
    "defaultZoom": 16,
    "minZoom": 14,
    "maxZoom": 20
  },

  "description": "Premium residential plotted development",

  "contact": {
    "phone": "+91XXXXXXXXXX",
    "email": "example@email.com"
  }
}
```

This file should contain high-level project metadata only.

It should not contain individual plot geometry.

---

# 7. Plot Data Architecture

Plots should be stored using GeoJSON.

Example:

```json
{
  "type": "Feature",
  "properties": {
    "id": "A101",
    "number": "A-101",

    "area": 1200,

    "status": "available",

    "price": 4800000,

    "facing": "East",

    "roadWidth": 30
  },

  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [77.5941, 12.9717],
        [77.5943, 12.9717],
        [77.5943, 12.9715],
        [77.5941, 12.9715],
        [77.5941, 12.9717]
      ]
    ]
  }
}
```

The `properties` object contains business metadata.

The `geometry` object contains the physical plot boundary.

This separation is important because the same geometry can later be rendered differently without changing the underlying data.

---

# 8. Plot Status Model

Initially, support:

```text
AVAILABLE
RESERVED
SOLD
UNAVAILABLE
```

Recommended visual representation:

```text
AVAILABLE     → Green
RESERVED      → Yellow
SOLD          → Red
UNAVAILABLE   → Grey
```

The status should remain a data property:

```json
{
  "status": "available"
}
```

The UI should determine how that status is displayed.

Avoid storing UI-specific information like:

```json
{
  "color": "#00FF00"
}
```

Instead:

```text
Data
 ↓
status = AVAILABLE
 ↓
Frontend
 ↓
Status Color Mapping
 ↓
Green
```

This keeps data independent from UI design.

---

# 9. Geographic Layers

The map should be constructed from multiple layers.

```text
MAP
│
├── Base Map
│
├── Project Boundary
│
├── Roads
│
├── Zones
│
├── Amenities
│
├── Plot Polygons
│
└── Plot Labels
```

Each layer should be independently toggleable.

Potential future controls:

```text
[✓] Plots
[✓] Roads
[✓] Amenities
[ ] Satellite View
[ ] Zone Labels
```

---

# 10. Map Component Architecture

Recommended component structure:

```text
components/
│
├── Map/
│   │
│   ├── ProjectMap.tsx
│   ├── PlotLayer.tsx
│   ├── RoadLayer.tsx
│   ├── AmenityLayer.tsx
│   ├── ZoneLayer.tsx
│   ├── PlotLabels.tsx
│   └── MapControls.tsx
│
├── Plot/
│   │
│   ├── PlotDetails.tsx
│   ├── PlotCard.tsx
│   ├── PlotFilters.tsx
│   └── PlotLegend.tsx
│
└── Project/
    │
    ├── ProjectHeader.tsx
    ├── ProjectGallery.tsx
    └── ProjectInformation.tsx
```

The main map component should coordinate the layers but should not contain all rendering logic.

Recommended:

```text
ProjectMap
    │
    ├── RoadLayer
    ├── AmenityLayer
    ├── ZoneLayer
    ├── PlotLayer
    └── PlotLabels
```

---

# 11. Application State

Since there is no backend, application state remains relatively simple.

Core state:

```text
selectedPlot
activeFilters
mapViewport
activeLayers
```

Example:

```typescript
interface MapState {
  selectedPlotId: string | null;

  activeFilters: {
    status?: string[];
    minArea?: number;
    maxArea?: number;
  };

  activeLayers: {
    plots: boolean;
    roads: boolean;
    amenities: boolean;
  };
}
```

A complex global state management solution should not be introduced initially.

Recommended approach:

* React state
* URL search parameters
* Context only if necessary

Avoid Redux unless the application complexity genuinely requires it.

---

# 12. URL Architecture

The application should support deep linking.

Examples:

```text
/project/green-valley
```

Specific plot:

```text
/project/green-valley?plot=A103
```

Filtered view:

```text
/project/green-valley?status=available
```

Zone:

```text
/project/green-valley?zone=A
```

Combined:

```text
/project/green-valley?zone=A&status=available
```

This provides shareable URLs without requiring a backend.

Example flow:

```text
User clicks Plot A103
        │
        ▼
Update URL
        │
        ▼
?plot=A103
        │
        ▼
Open Plot Details
```

When someone opens the same URL:

```text
Read URL
    │
    ▼
Find Plot A103
    │
    ▼
Center Map
    │
    ▼
Open Plot Details
```

---

# 13. Plot Interaction Flow

The primary user flow:

```text
User opens website
        │
        ▼
Project Map Loads
        │
        ▼
User explores map
        │
        ▼
User clicks Plot
        │
        ▼
Plot Highlighted
        │
        ▼
Details Panel Opens
        │
        ▼
URL Updated
```

The details panel can display:

```text
Plot A-103

AVAILABLE

Area
1,200 sq.ft

Facing
East

Road Width
30 ft

Price
₹48 Lakhs

[ View Images ]

[ Get Directions ]
```

---

# 14. Plot Selection Architecture

When a plot is clicked:

```text
Plot Click Event
       │
       ▼
Extract Plot ID
       │
       ▼
Set selectedPlotId
       │
       ├──────────────► Highlight Polygon
       │
       ├──────────────► Open Details Panel
       │
       └──────────────► Update URL
```

The selected plot should not duplicate plot data in state.

Preferred:

```typescript
selectedPlotId = "A103"
```

Then derive:

```typescript
selectedPlot = plots.find(
  plot => plot.id === selectedPlotId
);
```

This avoids multiple sources of truth.

---

# 15. Filtering Architecture

Initial filters:

```text
Status
Area
Price
Facing
Zone
```

Example:

```text
Status

☑ Available
☐ Reserved
☐ Sold
```

Filtering should happen entirely client-side.

```text
All Plot Data
      │
      ▼
Apply Filters
      │
      ▼
Visible Plots
      │
      ▼
Update Map Layer
```

For a few thousand plots, client-side filtering should be sufficient.

---

# 16. Media Architecture

Media should be separate from the main application repository where possible.

Recommended:

```text
Frontend Repository
│
├── Source Code
├── GeoJSON
├── Configuration
└── Small Assets
```

External storage/CDN:

```text
Media Storage
│
├── Images
├── Drone Footage
├── Videos
├── Brochures
└── Documents
```

Possible providers:

* Cloudflare R2
* Cloudinary
* AWS S3 + CloudFront

Example media configuration:

```json
{
  "projectGallery": [
    {
      "type": "image",
      "url": "https://cdn.example.com/project/image1.webp"
    },
    {
      "type": "video",
      "url": "https://cdn.example.com/project/drone-tour.mp4"
    }
  ]
}
```

---

# 17. Recommended Folder Structure

```text
real-estate-viewer/
│
├── app/
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   └── project/
│       │
│       └── [slug]/
│           └── page.tsx
│
├── components/
│   │
│   ├── Map/
│   │   ├── ProjectMap.tsx
│   │   ├── PlotLayer.tsx
│   │   ├── RoadLayer.tsx
│   │   ├── AmenityLayer.tsx
│   │   └── MapControls.tsx
│   │
│   ├── Plot/
│   │   ├── PlotDetails.tsx
│   │   ├── PlotFilters.tsx
│   │   └── PlotLegend.tsx
│   │
│   └── Project/
│       ├── ProjectHeader.tsx
│       └── ProjectGallery.tsx
│
├── data/
│   │
│   └── projects/
│       │
│       └── green-valley/
│           ├── project.json
│           ├── plots.geojson
│           ├── roads.geojson
│           ├── amenities.geojson
│           └── zones.geojson
│
├── lib/
│   │
│   ├── geo.ts
│   ├── plots.ts
│   └── url-state.ts
│
├── schemas/
│   │
│   ├── project.schema.ts
│   └── plot.schema.ts
│
├── scripts/
│   │
│   └── validate-data.ts
│
└── public/
    │
    └── assets/
```

---

# 18. Data Validation

Since the application has no backend or database enforcing constraints, validation becomes important.

Use Zod schemas.

Example:

```typescript
const PlotPropertiesSchema = z.object({
  id: z.string(),
  number: z.string(),

  area: z.number().positive(),

  price: z.number().nonnegative(),

  status: z.enum([
    "available",
    "reserved",
    "sold",
    "unavailable"
  ]),

  facing: z.enum([
    "North",
    "South",
    "East",
    "West"
  ]).optional()
});
```

Validation should run during the build process.

```text
npm run build
      │
      ▼
Validate Project Data
      │
      ├── Valid → Continue Build
      │
      └── Invalid → Fail Build
```

Examples of validation:

* Duplicate plot IDs
* Invalid plot status
* Missing geometry
* Invalid polygon
* Missing required metadata
* Invalid coordinates

---

# 19. GeoJSON Validation

Additional geographic validation should ensure:

```text
Polygon is closed
Polygon has valid coordinates
Polygon does not self-intersect
Plot IDs are unique
Coordinates are within project bounds
```

This is important because a broken polygon can cause rendering issues.

Recommended future utility:

```text
scripts/
    validate-geojson.ts
```

---

# 20. Performance Strategy

The application should initially optimize for:

```text
500 – 2,000 plots
```

Recommended optimizations:

### Load GeoJSON efficiently

Avoid converting GeoJSON repeatedly.

Load once:

```text
GeoJSON
   │
   ▼
Map Source
   │
   ▼
Multiple Map Layers
```

### Use map layers instead of React components per plot

Avoid:

```tsx
plots.map(plot => (
  <PlotComponent plot={plot} />
))
```

for hundreds or thousands of plots.

Instead:

```text
GeoJSON Source
      │
      ▼
MapLibre Source
      │
      ▼
Fill Layer
      │
      ▼
Line Layer
      │
      ▼
Symbol Layer
```

This allows the map rendering engine to handle polygons efficiently.

---

# 21. Recommended Map Layers

```text
Layer Order

1. Base Map
2. Satellite Layer
3. Project Boundary
4. Roads
5. Zones
6. Plot Fill
7. Plot Borders
8. Selected Plot Highlight
9. Plot Labels
10. Amenities
```

The selected plot should be rendered separately.

Example:

```text
All Plots Layer
       │
       ▼
Click A103
       │
       ▼
Selected Plot Layer
       │
       ▼
Highlight A103
```

This avoids unnecessarily recalculating every plot style.

---

# 22. Build and Deployment Pipeline

```text
Developer
    │
    ▼
Modify Code / GeoJSON
    │
    ▼
Git Commit
    │
    ▼
GitHub
    │
    ▼
CI Pipeline
    │
    ├── Lint
    ├── Type Check
    ├── Validate Config
    ├── Validate GeoJSON
    └── Build
         │
         ▼
      Deploy
```

Recommended commands:

```text
npm run lint

npm run type-check

npm run validate-data

npm run build
```

Deployment should only happen if all validations pass.

---

# 23. Content Update Workflow

Since there is no backend, content updates should follow a simple Git-based workflow.

Example:

```text
Plot A103 becomes SOLD
        │
        ▼
Update plots.geojson
        │
        ▼
status: available
        ↓
status: sold
        │
        ▼
Commit Changes
        │
        ▼
Push to Git
        │
        ▼
Automatic Deployment
```

This becomes the content management system.

---

# 24. Development Phases

## Phase 1 — Project Setup

### Goals

* Setup Next.js
* Setup TypeScript
* Setup Tailwind
* Setup MapLibre
* Create basic project structure

Deliverable:

```text
Blank interactive map
```

---

## Phase 2 — Static Data Model

### Goals

Create:

```text
project.json
plots.geojson
roads.geojson
amenities.geojson
```

Deliverable:

```text
Map loads project data
```

---

## Phase 3 — Plot Rendering

### Goals

* Render plot polygons
* Render plot boundaries
* Add status colors
* Add hover interaction
* Add selected state

Deliverable:

```text
Interactive plot map
```

---

## Phase 4 — Plot Details

### Goals

* Click plot
* Open information panel
* Display metadata
* Highlight selected plot

Deliverable:

```text
Interactive plot explorer
```

---

## Phase 5 — Filtering

### Goals

Add:

* Status filtering
* Area filtering
* Price filtering
* Zone filtering

Deliverable:

```text
Searchable plot inventory
```

---

## Phase 6 — URL State

### Goals

Support:

```text
?plot=A103
?status=available
?zone=A
```

Deliverable:

```text
Shareable project and plot links
```

---

## Phase 7 — Project Information

### Goals

Add:

* Project description
* Gallery
* Videos
* Amenities
* Location
* Directions

Deliverable:

```text
Complete project landing page
```

---

## Phase 8 — Data Validation

### Goals

Implement:

* Zod validation
* GeoJSON validation
* Duplicate ID detection
* Invalid status detection

Deliverable:

```text
Reliable build-time data validation
```

---

## Phase 9 — Performance Optimization

### Goals

Optimize:

* Large GeoJSON files
* Map rendering
* Image loading
* Code splitting

Deliverable:

```text
Production-ready static application
```

---

# 25. Future Enhancements

These should not be part of the initial implementation.

Possible future additions:

### Multiple projects

```text
/projects
    │
    ├── Project A
    ├── Project B
    └── Project C
```

### 3D visualization

Possible technologies:

```text
Three.js
CesiumJS
MapLibre terrain
```

### Interactive plot comparison

```text
Plot A101
vs
Plot A102
```

### Directions

Integration with Google Maps.

### Satellite mode

Switch between:

```text
Standard
Satellite
Terrain
```

### Layer toggles

```text
Plots
Roads
Amenities
Zones
```

### Static site editor

A browser-based utility that generates:

```text
plots.geojson
```

without manually editing JSON.

---

# 26. Explicit Non-Goals

The following should intentionally be excluded from V1:

```text
Backend APIs
Database
Authentication
User accounts
User analytics
CRM
Lead tracking
Payments
Real-time updates
Kafka
Redis
Microservices
Admin dashboard
```

These features add complexity without contributing directly to the primary objective.

---

# 27. Final Architecture

```text
                         USER
                           │
                           ▼
                ┌─────────────────────┐
                │     Next.js App     │
                │                     │
                │  React + TypeScript │
                │                     │
                │    Tailwind CSS     │
                └──────────┬──────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │    MapLibre GL   │
                 │                  │
                 │ Interactive Map  │
                 └─────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      GeoJSON          JSON Config      Media CDN
          │                │                │
          ▼                ▼                ▼
       Plots            Project Info      Images
       Roads            Metadata          Videos
       Zones                              Documents
```

---

# 28. Guiding Principles

The project should follow these principles:

### 1. Static First

Avoid backend infrastructure unless there is a real requirement.

### 2. Data-Driven

The UI should render based on configuration rather than hardcoded project-specific logic.

### 3. Geographic Data is Canonical

Plot polygons should be represented using proper geometry formats such as GeoJSON.

### 4. UI and Data Should Be Independent

Plot data should not contain UI-specific properties.

### 5. Validate at Build Time

Since there is no backend validation, invalid configuration should fail the build.

### 6. URL is State

Selected plots and filters should be representable through URLs.

### 7. Map Engine Handles Geometry

Avoid rendering hundreds of plot polygons as independent React components.

### 8. Keep V1 Simple

Do not introduce infrastructure simply because it may be useful in the future.

---

# Final Recommendation

The initial implementation should focus on one core experience:

```text
Open Website
     │
     ▼
Explore Project Map
     │
     ▼
Hover Over Plot
     │
     ▼
Click Plot
     │
     ▼
View Details
     │
     ▼
Share Direct Link
```

Everything else is secondary.

The ideal V1 stack is:

```text
Next.js
TypeScript
Tailwind
MapLibre GL
GeoJSON
Zod
Vercel
CDN for media
```

The architecture should remain intentionally simple:

> **Static configuration → Map rendering engine → Interactive user interface**

This approach minimizes infrastructure, deployment complexity, operational cost, and maintenance while still allowing the application to provide a sophisticated interactive real estate experience.
