# Components Documentation

This directory contains all reusable UI components and layout components for the Saudi Mais Inventory System.

## UI Components (`/ui`)

### Button
A versatile button component with multiple variants and sizes.

**Variants:** `primary`, `secondary`, `success`, `danger`, `ghost`, `outline`  
**Sizes:** `sm`, `md`, `lg`  
**Features:** Loading state, disabled state, full accessibility

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md" onClick={handleClick}>
  Save
</Button>
```

### Input
Form input component with label, error, and helper text support.

```tsx
import { Input } from "@/components/ui";

<Input
  label="Email"
  type="email"
  error={errors.email}
  required
/>
```

### Select
Dropdown select component with label and error support.

```tsx
import { Select } from "@/components/ui";

<Select
  label="Destination"
  options={[
    { value: "MAIS", label: "MAIS" },
    { value: "FOZAN", label: "FOZAN" }
  ]}
/>
```

### Textarea
Multi-line text input with character counter support.

```tsx
import { Textarea } from "@/components/ui";

<Textarea
  label="Notes"
  maxLength={500}
  showCharCount
/>
```

### Modal
Dialog/modal component with customizable size and close behavior.

**Sizes:** `sm`, `md`, `lg`, `xl`

```tsx
import { Modal } from "@/components/ui";

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure?</p>
</Modal>
```

### Toast
Toast notification system using react-hot-toast.

```tsx
import { toast } from "react-hot-toast";

toast.success("Item saved successfully!");
toast.error("Failed to save item");
```

### Loading Components
Spinner and skeleton loading components.

```tsx
import { LoadingSpinner, Skeleton } from "@/components/ui";

<LoadingSpinner size="md" />
<Skeleton className="h-4 w-full" />
```

### Badge & Tag
Badge for status indicators and Tag for removable items.

```tsx
import { Badge, Tag } from "@/components/ui";

<Badge variant="success">Active</Badge>
<Tag variant="primary" onRemove={handleRemove}>Category</Tag>
```

### Theme Components
Theme provider and toggle for dark/light mode.

```tsx
import { ThemeProvider, ThemeToggle } from "@/components/ui";

// In layout
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>

// In header
<ThemeToggle />
```

## Layout Components (`/layout`)

### AppLayout
Main application layout wrapper with sidebar, header, and footer.

```tsx
import { AppLayout } from "@/components/layout";

<AppLayout user={session.user}>
  {children}
</AppLayout>
```

### Header
Top navigation bar with user menu, notifications, and theme toggle.

### Sidebar
Collapsible sidebar navigation with role-based menu items.

### Breadcrumb
Breadcrumb navigation component.

```tsx
import { Breadcrumb } from "@/components/layout";

<Breadcrumb items={[
  { label: "Dashboard", href: "/dashboard" },
  { label: "Data Entry" }
]} />
```

### Footer
Application footer with links and copyright.

## Styling

All components use:
- TailwindCSS for styling
- Dark mode support via `next-themes`
- Saudi Mais brand colors (primary, secondary, success, warning, danger)
- Responsive design (mobile-first)
- Accessibility features (ARIA labels, keyboard navigation)

## Theme System

The theme system supports:
- Light mode
- Dark mode
- System preference detection
- Persistent theme selection (localStorage)
- Smooth transitions between themes

Theme colors are defined in `tailwind.config.js` and CSS variables in `globals.css`.
