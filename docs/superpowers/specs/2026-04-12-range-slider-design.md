# Range Slider Component Design

## Overview

A dual-handle range slider component for filtering numeric ranges (e.g., price filtering, quantity filtering) in admin and public pages.

## Design Decision

**Chosen Approach**: Pure CSS dual `<input type="range">` stacked

**Why**:
- Zero dependency addition
- Native accessibility support (keyboard navigation, screen reader)
- Full DaisyUI theme integration
- Lightweight implementation

**Alternatives rejected**:
- `daisyui` built-in slider: does not support dual handles
- Third-party library (e.g., `react-slider`): adds bundle size

## Component Spec

### File Location
`src/components/ui/RangeSlider.tsx`

### Props Interface

```typescript
interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  formatLabel?: (value: number) => string
  disabled?: boolean
  className?: string
}
```

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `min` | `number` | Yes | - | Minimum value |
| `max` | `number` | Yes | - | Maximum value |
| `step` | `number` | No | `1` | Step increment |
| `value` | `[number, number]` | Yes | - | Current [min, max] range |
| `onChange` | `(value) => void` | Yes | - | Callback with new range |
| `formatLabel` | `(value) => string` | No | `(v) => v` | Format display label |
| `disabled` | `boolean` | No | `false` | Disable interaction |
| `className` | `string` | No | `''` | Additional CSS classes |

### Visual Design

**Track**:
- Full-width horizontal track
- Unselected portion: `bg-base-300`
- Selected portion: `bg-primary`
- Height: `h-2` (DaisyUI default)

**Handles (sliders)**:
- Dual handles positioned on the track
- DaisyUI `range` input styling with `primary` color
- Size: default browser/system

**Labels**:
- Min/max labels displayed below track
- Current selected values shown above track
- Labels update in real-time during drag (Option A)

### Implementation Details

**Dual-slider CSS technique**:
1. Stack two `<input type="range">` elements absolutely positioned
2. Use CSS `pointer-events: none` on tracks to let clicks pass through
3. Use CSS custom properties or clip-path to show selected range
4. Handle z-index for proper handle stacking

**Value constraints**:
- Minimum gap between min and max enforced by `min` prop of second slider
- Values clamped to `[min, max]` range

### File Structure

```
src/components/ui/
  RangeSlider.tsx    # Component implementation

src/types/ui.ts      # Add RangeSliderProps type export (or inline)
```

### Testing Checklist

- [ ] Drag handles updates value in real-time
- [ ] Selected range track is visually highlighted
- [ ] Keyboard navigation works (Tab + Arrow keys)
- [ ] Disabled state prevents interaction
- [ ] Value formatting works via `formatLabel`
- [ ] Works in both light and dark themes (DaisyUI)
- [ ] Min/max constraints prevent invalid ranges
