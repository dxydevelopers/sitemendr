# Full Visual Editor Architecture Plan

## Overview
Build a complete Shopify-like Visual Editor for the client dashboard that supports:
- Multiple page types (Home, Products, Collections, Blog, Cart, Custom Pages)
- Drag-and-drop sections/components
- Theme settings (colors, fonts, spacing)
- Media library
- Preview modes
- Publishing workflow

---

## 1. Database Schema

### New Models

```prisma
// Page types enum
enum PageType {
  HOME
  PRODUCT
  COLLECTION
  BLOG
  CART
  CUSTOM
}

// Page model - represents a single page
model Page {
  id             String     @id @default(uuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  type           PageType   @default(CUSTOM)
  slug           String     // e.g., "/", "/products", "/about"
  title          String
  isPublished    Boolean    @default(false)
  isHome         Boolean    @default(false)  // Only one home page per site
  sections       PageSection[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  
  @@unique([subscriptionId, slug])
}

// Section placement within a page
model PageSection {
  id          String   @id @default(uuid())
  pageId      String
  page        Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  sectionId   String
  section     SectionTemplate @relation(fields: [sectionId], references: [id])
  order       Int      // Position in the page (0, 1, 2, ...)
  settings    Json     // Section-specific settings (overrides defaults)
  
  @@unique([pageId, order])
}

// Pre-built section templates
model SectionTemplate {
  id          String   @id @default(uuid())
  name        String   // e.g., "Hero Banner", "Product Grid"
  category    String   // e.g., "header", "hero", "product", "footer"
  icon        String?  // Icon name for UI
  defaultSettings Json // Default values for section settings
  schema      Json     // Settings schema (what fields are editable)
  html        String?  // Custom HTML override
  css         String?  // Custom CSS override
  isBuiltIn   Boolean  @default(true)  // true = system section, false = custom
  createdAt   DateTime @default(now())
}

// Theme settings per subscription
model ThemeSettings {
  id             String   @id @default(uuid())
  subscriptionId String   @unique
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  
  // Colors
  primaryColor   String   @default("#3B82F6")
  secondaryColor String   @default("#1E293B")
  accentColor   String   @default("#10B981")
  backgroundColor String @default("#FFFFFF")
  textColor     String   @default("#1F2937")
  
  // Fonts
  headingFont    String   @default("Inter")
  bodyFont       String   @default("Inter")
  
  // Spacing
  borderRadius   String   @default("8px")
  containerWidth String   @default("1280px")
  
  // Button styles
  buttonStyle    String   @default("rounded") // rounded, square, pill
  buttonSize     String   @default("medium") // small, medium, large
  
  // Custom CSS
  customCss      String?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 2. API Endpoints

### Pages API
- `GET /api/pages` - List all pages for subscription
- `GET /api/pages/:id` - Get single page with sections
- `POST /api/pages` - Create new page
- `PUT /api/pages/:id` - Update page (title, slug, type)
- `DELETE /api/pages/:id` - Delete page
- `POST /api/pages/:id/publish` - Publish page
- `POST /api/pages/:id/unpublish` - Unpublish page

### Sections API
- `GET /api/sections` - List all available section templates
- `GET /api/sections/:id` - Get section details with schema
- `POST /api/pages/:id/sections` - Add section to page
- `PUT /api/pages/:pageId/sections/:sectionId` - Update section settings
- `DELETE /api/pages/:pageId/sections/:sectionId` - Remove section from page
- `PUT /api/pages/:pageId/sections/reorder` - Reorder sections

### Theme API
- `GET /api/theme` - Get theme settings
- `PUT /api/theme` - Update theme settings
- `POST /api/theme/preview` - Preview theme changes (without saving)

### Media API (extend existing)
- `GET /api/media` - List media files
- `POST /api/media/upload` - Upload new media
- `DELETE /api/media/:id` - Delete media

---

## 3. Frontend Architecture

### Components Structure

```
components/
├── editor/
│   ├── PageEditor.tsx          # Main editor container
│   ├── PageSelector.tsx        # Sidebar to switch between pages
│   ├── SectionLibrary.tsx     # Panel to browse/select sections
│   ├── SectionRenderer.tsx    # Renders a section in editor
│   ├── SectionSettings.tsx   # Panel to edit section settings
│   ├── DragDropCanvas.tsx     # Main canvas with drag-drop
│   ├── ThemeEditor.tsx        # Theme settings panel
│   ├── MediaPicker.tsx        # Media library picker modal
│   ├── PreviewToolbar.tsx    # Desktop/tablet/mobile preview
│   └── PublishingControls.tsx # Save draft/Publish buttons
│
├── sections/                   # Pre-built section components
│   ├── HeroSection.tsx
│   ├── HeaderSection.tsx
│   ├── FooterSection.tsx
│   ├── ProductGridSection.tsx
│   ├── FeaturedProductsSection.tsx
│   ├── BlogGridSection.tsx
│   ├── TestimonialsSection.tsx
│   ├── NewsletterSection.tsx
│   ├── ImageGallerySection.tsx
│   ├── VideoSection.tsx
│   ├── TextBlockSection.tsx
│   ├── CTASection.tsx
│   └── CustomHTMLSection.tsx
│
└── dashboard/
    └── VisualContentEditor.tsx  # REPLACE with new PageEditor
```

### Page Types Supported

| Page Type | Default Sections | Editable |
|-----------|------------------|----------|
| HOME | Header, Hero, Featured Products, Newsletter, Footer | Yes |
| PRODUCT | Header, Product Details, Related Products, Footer | Yes |
| COLLECTION | Header, Product Grid, Pagination, Footer | Yes |
| BLOG | Header, Blog Grid, Single Post, Footer | Yes |
| CART | Header, Cart Items, Checkout CTA, Footer | Yes |
| CUSTOM | Header, Custom Sections, Footer | Yes |

---

## 4. Section Library

### Categories

1. **Header**
   - Logo + Navigation
   - Search bar
   - Cart icon
   - Mobile menu

2. **Hero**
   - Full-width banner
   - Split layout (image + text)
   - Video background
   - CTA buttons

3. **Content**
   - Rich text / HTML
   - Image + text block
   - Image gallery
   - Video player
   - Accordion/FAQ

4. **Products**
   - Featured products (grid)
   - Product carousel
   - New arrivals
   - Best sellers

5. **Social**
   - Testimonials
   - Reviews
   - Instagram feed

6. **Marketing**
   - Newsletter signup
   - Promo banner
   - Countdown timer

7. **Footer**
   - Multi-column footer
   - Social links
   - Copyright

---

## 5. Editor Features

### Drag & Drop
- Drag sections from library to canvas
- Reorder sections within canvas
- Remove sections with delete key or button

### Section Settings (per section type)
Each section has editable properties defined in schema:

```
{
  "title": { "type": "text", "default": "Welcome" },
  "subtitle": { "type": "text", "default": "" },
  "backgroundColor": { "type": "color", "default": "#ffffff" },
  "textColor": { "type": "color", "default": "#000000" },
  "padding": { "type": "select", "options": ["none", "small", "medium", "large"], "default": "medium" },
  "products": { "type": "productSelect", "multiple": true },
  "link": { "type": "url" },
  "image": { "type": "media" }
}
```

### Theme Settings Panel
- Color picker for all theme colors
- Font selector (Google Fonts integration)
- Slider for border radius, spacing
- Toggle for button styles
- Custom CSS textarea

### Preview Modes
- Desktop (1280px+)
- Tablet (768px - 1279px)
- Mobile (320px - 767px)

### Publishing
- Save as Draft
- Publish Immediately
- Schedule (future date)
- Rollback to previous version

---

## 6. Implementation Phases

## Implementation Phase Decision

**User Decision:** Keep both systems - add section-based system as primary, keep raw HTML/CSS/JS as advanced mode.

- Section-based editor = Primary (default)
- Raw HTML/CSS/JS = Advanced mode (for power users)

### Phase 1: Foundation
- [ ] Update database schema
- [ ] Create API endpoints
- [ ] Build PageEditor container
- [ ] Implement page switching

### Phase 2: Section System
- [ ] Create SectionTemplate seeds
- [ ] Build SectionRenderer
- [ ] Implement drag-drop canvas
- [ ] Create SectionSettings panel

### Phase 3: Theme System
- [ ] Add ThemeSettings model
- [ ] Build ThemeEditor panel
- [ ] Apply theme to all sections

### Phase 4: Media Integration
- [ ] Enhance Media model
- [ ] Build MediaPicker component
- [ ] Integrate with section settings

### Phase 5: Publishing
- [ ] Implement draft/publish workflow
- [ ] Add version history
- [ ] Connect to deployment system

---

## 7. Integration Points

### Existing Systems
- **Subscription** - Link pages/sections to subscription
- **Products** - Product sections reference existing Product model
- **Media** - Extend existing Media model
- **Deployment** - Generate static files from published pages

### Generated Output
Each published page will generate:
- `index.html` - Full rendered HTML with embedded CSS
- Sections rendered as HTML components
- Theme settings applied as CSS variables
- JavaScript for interactivity

---

## Questions for User

1. Should we keep the old HTML/CSS/JS template system or fully replace with sections?
2. Do you want pre-built sections or should they be fully custom?
3. How should the deployment work - generate static files or SSR?
4. Any specific sections you want built first?
