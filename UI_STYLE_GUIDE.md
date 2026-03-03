# CFA Quiz - UI Style Guide

> **Design System**: Logify-inspired modern minimal UI  
> **Last Updated**: February 2026

---

## Overview

CFA Quiz follows a modern, clean design language inspired by the Logify UI Kit. The design emphasizes:
- **Minimalism**: Clean layouts with ample white space
- **Clarity**: Clear visual hierarchy and readable typography
- **Consistency**: Unified color palette and component styling
- **Motion**: Subtle Framer Motion animations for polish

---

## Color Palette

### Primary Colors (Emerald)
```css
--emerald-50:  #ecfdf5    /* Light backgrounds, badges */
--emerald-100: #d1fae5    /* Hover states, icons bg */
--emerald-500: #10b981    /* Primary buttons, accents */
--emerald-600: #059669    /* Primary hover, links */
--emerald-700: #047857    /* Dark accents */
```

### Neutral Colors (Slate)
```css
--slate-50:  #f8fafc     /* Page backgrounds */
--slate-100: #f1f5f9     /* Card borders, dividers */
--slate-200: #e2e8f0     /* Input borders */
--slate-400: #94a3b8     /* Placeholder text, icons */
--slate-500: #64748b     /* Secondary text */
--slate-600: #475569     /* Body text */
--slate-900: #0f172a     /* Headlines, primary text */
```

### Semantic Colors
```css
--red-500:    #ef4444    /* Errors, alerts */
--amber-500:  #f59e0b    /* Warnings, moderate states */
--blue-500:   #3b82f6    /* Info, links */
--orange-500: #f97316    /* Streak indicators */
--teal-500:   #14b8a6    /* Gradients accent */
```

---

## Typography

### Font Family
- **Primary**: System font stack (`font-sans`)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Heading Sizes
```css
h1: text-2xl lg:text-3xl font-bold     /* Page titles */
h2: text-xl lg:text-2xl font-bold      /* Section headers */
h3: text-lg font-semibold              /* Card titles */
h4: text-base font-medium              /* Subsections */
```

### Body Text
```css
body: text-sm text-slate-600           /* Default body */
small: text-xs text-slate-500          /* Captions, hints */
```

---

## Spacing

Use consistent spacing scale:
```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem  (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem    (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem  (24px)
--space-8: 2rem    (32px)
```

### Page Layout
- Container max-width: `max-w-7xl`
- Page padding: `p-4 lg:p-6`
- Section gap: `space-y-6`

---

## Border Radius

```css
--radius-lg:  0.75rem (12px)  /* Buttons, inputs */
--radius-xl:  1rem    (16px)  /* Small cards */
--radius-2xl: 1.25rem (20px)  /* Large cards */
--radius-full: 9999px         /* Avatars, badges */
```

---

## Components

### Cards
```jsx
<div className="bg-white rounded-2xl border border-slate-100 p-6">
  {/* Card content */}
</div>
```

### Buttons

**Primary Button**
```jsx
<button className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
  Button Text
</button>
```

**Secondary Button**
```jsx
<button className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
  Button Text
</button>
```

**Ghost Button**
```jsx
<button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
  Link Text
</button>
```

### Inputs
```jsx
<input
  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
  placeholder="Placeholder text"
/>
```

**With Icon**
```jsx
<div className="relative">
  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input className="... pl-12" />
</div>
```

### Badges
```jsx
/* Success */
<span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">
  Success
</span>

/* Warning */
<span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
  Warning
</span>

/* Error */
<span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
  Error
</span>
```

### Icon Containers
```jsx
/* Large (Stats) */
<div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
  <Icon className="w-5 h-5 text-emerald-500" />
</div>

/* Small (Lists) */
<div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
  <Icon className="w-4 h-4 text-slate-500" />
</div>
```

---

## Framer Motion Animations

### Page Transitions
```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

### Button Interactions
```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Button
</motion.button>
```

### List Items
```jsx
<motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  whileHover={{ x: 4 }}
>
  List Item
</motion.div>
```

### Modal/Sidebar
```jsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Overlay
    </motion.div>
  )}
</AnimatePresence>
```

---

## Layout Patterns

### Split Layout (Login/Auth)
- Left panel: Gradient background with branding
- Right panel: White form area
- Mobile: Full-width form only

### Dashboard Layout
- Fixed sidebar (desktop) / Slide-out (mobile)
- Sticky header with search
- Main content area with card grid

### Card Grid
```jsx
/* Stats Row */
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

/* Main Content */
<div className="grid lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">Main</div>
  <div>Sidebar</div>
</div>
```

---

## Gradients

### Primary CTA Gradient
```css
bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600
```

### Login Panel Gradient
```css
bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500
```

### Background Pattern (Grid)
```css
bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:2rem_2rem]
```

---

## Icons

Use **Lucide React** icons throughout:
```bash
npm install lucide-react
```

Common icons:
- Navigation: `LayoutDashboard`, `BookOpen`, `BarChart3`, `History`, `Settings`
- Actions: `Play`, `ArrowRight`, `ChevronRight`, `Plus`
- Status: `CheckCircle2`, `AlertCircle`, `Clock`, `Target`
- UI: `Menu`, `X`, `Search`, `Bell`, `Eye`, `EyeOff`
- CFA: `Award`, `Flame`, `TrendingUp`, `Sparkles`

---

## Responsive Breakpoints

```css
sm: 640px    /* Mobile landscape */
md: 768px    /* Tablet */
lg: 1024px   /* Desktop */
xl: 1280px   /* Large desktop */
```

### Mobile-First Approach
```jsx
/* Example */
<div className="p-4 lg:p-6">           /* Padding */
<div className="grid lg:grid-cols-3">   /* Grid */
<div className="hidden lg:flex">        /* Show/hide */
```

---

## Do's and Don'ts

### ✅ Do
- Use the emerald color palette consistently
- Apply subtle animations with Framer Motion
- Maintain generous white space
- Use rounded corners (`rounded-xl`, `rounded-2xl`)
- Keep text hierarchy clear

### ❌ Don't
- Mix different color palettes
- Use harsh shadows (prefer `shadow-sm` or `border`)
- Overcrowd layouts
- Use sharp corners on interactive elements
- Skip transition effects on hover states

---

## File Structure

```
components/
├── landing/           # Landing page components
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── FAQ.tsx
│   └── ...
├── layout/
│   ├── DashboardLayout.tsx
│   └── AdminLayout.tsx
└── ui/                # Reusable UI primitives
    ├── button.tsx
    ├── input.tsx
    └── card.tsx

app/
├── page.tsx           # Landing page
├── login/page.tsx     # Auth pages
├── dashboard/page.tsx # Main app pages
└── ...
```

---

## Dependencies

```json
{
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^4.x",
  "clsx": "^2.x",
  "tailwind-merge": "^3.x"
}
```

---

*This style guide should be referenced when creating new components or pages to ensure visual consistency across the CFA Quiz application.*
