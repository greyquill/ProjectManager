# theme/ - Theme Configuration

## Purpose
This directory contains theme configuration including color tokens, spacing, and other design system values.

## Files

### `tokens.ts`
Design tokens for:
- **Colors**: primary, secondary, accent, backgrounds, text colors
- **Spacing**: xs, sm, md, lg, xl, 2xl
- **Border Radius**: sm, md, lg, xl, full

### `index.ts`
Main theme export file

## Usage
```typescript
import { colors, spacing, borderRadius } from '@theme'

// Use in components
style={{ color: colors.primary, padding: spacing.md }}
```

## Color Palette
- **Primary**: #3D74B6 (Professional Blue)
- **Secondary**: #FBF5DE (Warm Cream)
- **Tertiary**: #EAC8A6 (Warm Beige)
- **Accent**: #DC3C22 (Vibrant Red)
- **Text Primary**: #111827 (Dark Gray)
- **Text Secondary**: #6B7280 (Medium Gray)

## Integration
Theme tokens are also configured in `tailwind.config.js` for use with Tailwind utility classes.

