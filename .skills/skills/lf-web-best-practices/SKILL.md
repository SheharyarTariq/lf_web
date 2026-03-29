---
name: lf-web-best-practices
description: >
  Defines the coding standards and best practices for the lf-web project, extracted
  directly from the reference codebase. Use this skill whenever you are writing any
  new code in lf-web — components, forms, pages, utilities, or anything else.
  Trigger on requests like "add a form", "create a component", "build a page",
  "add a field", "write a feature", or any coding task. This skill is the source of
  truth for how code should be written in lf-web and must be consulted before
  writing any component, form, or utility.
---

# lf-web Coding Best Practices

These practices are extracted directly from the reference codebase (`lf_frontend`) and must be followed in all new code written for `lf-web`.

---

## 1. Tailwind CSS — Always Use It for Styling

All visual styling is done with Tailwind utility classes. Never use inline `style={{}}` for anything that Tailwind can handle, and never write custom CSS unless it is a genuinely one-off animation or something Tailwind cannot express.

**The `cn` utility is always used to compose class names** — never concatenate class strings manually. Import it from `@/utils/cn`:

```typescript
import { cn } from '@/utils/cn';

// Good — conditional classes composed safely
<div className={cn('base-class', isActive && 'active-class', className)} />

// Bad — string concatenation
<div className={'base-class ' + (isActive ? 'active-class' : '')} />
```

**`cn` is implemented with `clsx` + `tailwind-merge`** so conflicting utilities resolve correctly (e.g. `px-4` later overrides `px-2`).

### Tailwind patterns used in this codebase

```typescript
// Responsive prefixes
'py-3 md:py-4 px-4 md:px-6'       // mobile-first, then md breakpoint

// State variants
'hover:bg-neutral-700'
'disabled:opacity-30 disabled:cursor-not-allowed'
'focus:outline-none'

// Flexbox layout
'flex items-center justify-center gap-2'
'flex flex-col space-y-5'

// Positioning
'absolute left-4 top-1/2 -translate-y-1/2'
'relative w-full'

// Typography
'text-[14px] font-[500] text-black'
'placeholder:font-[400] placeholder:text-[#C1C1C1]'

// Borders & radius
'border border-muted rounded-[8px]'
'border-red-500'   // error state

// Transitions
'transition-colors duration-200'
```

---

## 2. Yup — Always Use It for Form Validation

Every form has a corresponding `schema.ts` file in the same feature folder. Schemas are defined with `yup.object()` and imported by the component.

### Schema file pattern (`schema.ts`)

```typescript
import * as yup from 'yup';

// Simple field
export const signInSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// With custom test (cross-field or regex)
export const slotSchema = yup.object({
  startTime: yup
    .string()
    .required('Start time is required')
    .matches(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format (e.g. 10:00)'),
  endTime: yup
    .string()
    .required('End time is required')
    .test('is-after-start', 'End time must be after start time', function (endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
});
```

### Validation helper — `validateAndSetErrors`

Never call `schema.validate()` directly in components. Use the helper from `@/utils/validation`:

```typescript
import { validateAndSetErrors } from '@/utils/validation';
import { mySchema } from '../schema';

const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async () => {
  // Returns false and populates errors if invalid, returns true if valid
  if (!(await validateAndSetErrors(mySchema, { email, password }, setErrors))) return;

  // Proceed with API call...
};
```

### Clearing field errors on change

When the user edits a field, clear its specific error immediately — do not wait for re-submission:

```typescript
<Input
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
  }}
  error={errors.email}
/>
```

---

## 3. Common Components — Extract Anything Used More Than Once

If a UI element appears in more than one place, it must be a shared component living in `src/components/common/`. Never duplicate markup.

### Existing common components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Button` | `common/Button` | All buttons — supports `primary`, `secondary`, `outline`, `disabled` variants + `isLoading` |
| `Input` | `common/Input` | Text inputs — supports `error`, `startIcon`, `search` props |
| `Select` | `common/Select` | Dropdowns — supports `searchable`, `fullWidth`, `error`, `startIcon` |
| `SearchInput` | `common/SearchInput` | Debounced search with live API calls |
| `GenericTable` | `common/GenericTable` | Typed, paginated, sortable table |
| `Loader` | `common/Loader` | Animated dot loader |
| `Card` | `common/Card` | Content card wrapper |
| `BackArrow` | `common/BackArrow` | Navigation back button |
| `FormDialog` | `common/form-dialog` | Modal dialog for forms and confirmations |

### Adding a new common component

When you need a UI element that will be used in 2+ places:

1. Create `src/components/common/MyComponent/index.tsx`
2. Define a typed props interface that extends the relevant HTML element attributes
3. Accept `className` and spread `...props` through to the underlying element
4. Use `cn()` to merge base styles with incoming `className`

```typescript
// Pattern for a new common form field component
import { cn } from '@/utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

function Textarea({ error, label, className = '', ...props }: TextareaProps) {
  const baseStyles =
    'py-3 px-4 placeholder:font-[400] placeholder:text-[#C1C1C1] text-black border-muted border border-[1px] focus:outline-none rounded-[8px] w-full resize-none';

  return (
    <div className="w-full">
      {label && <label className="text-black font-[400] text-[14px] mb-1 block">{label}</label>}
      <textarea
        className={cn(baseStyles, error ? 'border-red-500' : '', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default Textarea;
```

---

## 4. Form Field Components — Always Componentise Inputs

Every reusable form control (input, textarea, select, checkbox, radio, file upload) must be a standalone component in `common/`. Never write bare `<input>` or `<textarea>` tags inside feature components — always reach for the common component.

### The standard form field contract

Every form field component must support:

- **`error?: string`** — renders a red error message below the field when set
- **`className?: string`** — merged via `cn()` so callers can override spacing etc.
- **`...props`** — spreads all native HTML attributes through (value, onChange, disabled, placeholder, etc.)
- **Responsive sizing** — use `py-3 md:py-4 px-4 md:px-6` as the base padding pattern

### Error display pattern

Errors always appear as a `<p>` tag immediately below the field:

```tsx
{error && <p className="mt-1 text-xs text-red-500">{error}</p>}
```

And the field itself gets `border-red-500` when an error is present:

```tsx
className={cn(baseStyles, error ? 'border-red-500' : '', className)}
```

### Form layout pattern

Labels go above inputs, grouped in a `div` with `space-y-2`:

```tsx
<div className="space-y-2 text-left">
  <label className="text-black font-[400] text-[14px]" htmlFor="fieldId">
    Field Label
  </label>
  <Input
    id="fieldId"
    placeholder="Enter value"
    value={value}
    onChange={...}
    error={errors.fieldName}
  />
</div>
```

Multiple form fields are grouped in `<div className="space-y-5">`.

---

## 5. Button Component — Always Use It

Never write raw `<button>` tags in feature components (only in `common/` internals). Always use `<Button>` from `common/Button`.

```tsx
import Button from '@/components/common/Button';

// Primary action
<Button onClick={handleSubmit} isLoading={isLoading} className="w-full">
  Save
</Button>

// Destructive action
<Button variant="secondary" onClick={handleDelete}>
  Delete
</Button>

// Disabled state (use variant, not the disabled attribute alone)
<Button variant="disabled" disabled>
  Unavailable
</Button>
```

---

## 6. TypeScript — Always Type Everything

- All component props are defined as `interface`, not `type` (unless union/intersection is needed)
- API response shapes are always typed with an `interface` defined in the same file
- Extend native HTML element attributes when wrapping form fields: `React.InputHTMLAttributes<HTMLInputElement>`, `React.ButtonHTMLAttributes<HTMLButtonElement>`, etc.
- Never use `any` — use `unknown` or a specific interface

---

## 7. General Patterns

- **`'use client'`** at the top of any component that uses `useState`, `useEffect`, event handlers, or browser APIs
- **Server Components** (no directive) for data-fetching pages; they call `apiRequest` from `@/utils/api-request`
- **Client Components** for interactive UI; they call `apiCall` from `@/utils/api-call`
- **Icons** always come from `lucide-react` — not emoji, not custom SVG, not other icon libraries
- **Loading states** always use `<Loader />` from `common/Loader` — never custom spinners
- **Path alias** — always use `@/` not relative imports that climb more than one directory
