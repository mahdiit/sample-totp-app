# AI Rules - Project Guidelines

## Tech Stack

- **React** - Core UI framework for building component-based interfaces
- **TypeScript** - Type-safe JavaScript for better developer experience and fewer runtime errors
- **React Router** - Client-side routing library (all routes defined in `src/App.tsx`)
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development and consistent styling
- **shadcn/ui** - Pre-built, accessible component library (do not edit these components directly)
- **Radix UI** - Unstyled, accessible primitive components that power shadcn/ui
- **lucide-react** - Icon library for consistent, lightweight SVG icons
- **Vite** - Build tool and dev server for fast development
- **Node.js** - Runtime environment for development and build processes

## File Structure Rules

- All source code goes in the `src/` folder
- Pages go in `src/pages/` directory
- Reusable components go in `src/components/` directory
- The main landing page is `src/pages/Index.tsx`
- All routes must be defined in `src/App.tsx`

## Component & Styling Rules

- **Always use shadcn/ui components** when available instead of building from scratch
- **Never edit shadcn/ui component files** - create new components that extend or wrap them instead
- **Use Tailwind CSS for all styling** - leverage utility classes for layout, spacing, colors, and responsive design
- **Use lucide-react for icons** - maintain consistency across the application
- **Update the main page** (`src/pages/Index.tsx`) when creating new components so users can see them in the preview

## Development Best Practices

- Keep components small and focused on a single responsibility
- Use TypeScript for type safety - avoid `any` types
- Follow existing code patterns and conventions in the project
- Test components in the live preview after making changes
- Prioritize simplicity and maintainability over complex abstractions
