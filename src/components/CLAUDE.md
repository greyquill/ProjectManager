# components/ - Reusable UI Components

## Purpose
This directory contains small, reusable UI components that are used across multiple pages.

## Component Categories

### Layout Components
- **Header** - Navigation header with branding
- **Footer** - Page footer
- **Container** - Content wrapper with max-width

### UI Elements

#### Button Components
- Variants: primary, secondary, outline, ghost
- Sizes: sm, md, lg
- Loading states
- Icon support

#### Form Components
- Input fields
- Text areas
- Select dropdowns
- Checkbox and radio buttons
- Form labels and error messages

#### Card Components
- Basic card container
- Project card
- Epic card
- Story card

#### Badge Components
- Status badges (todo, in progress, done, etc.)
- Priority badges (low, medium, high, critical)

#### Typography Components
- Heading components (H1-H6)
- Text components with variants

## Design System Integration
- Components use Tailwind CSS for styling
- Consistent color palette from theme tokens
- Responsive design patterns
- Accessibility considerations (ARIA labels, keyboard navigation)

## Usage Pattern
```typescript
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

export function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Click Me</Button>
    </Card>
  )
}
```

## Component Guidelines
1. **Single Responsibility**: Each component should do one thing well
2. **Composability**: Components should be composable and reusable
3. **Props Interface**: Use TypeScript interfaces for props
4. **Variants**: Use variants for different styles
5. **Accessibility**: Include ARIA labels and keyboard support

