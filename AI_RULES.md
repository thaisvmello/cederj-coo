# AI Development Rules - Acervo CEDERJ

## Tech Stack
- **Framework**: React 18 with Vite for fast development and optimized builds.
- **Language**: TypeScript for type safety and better developer experience.
- **Styling**: Tailwind CSS for utility-first, responsive styling.
- **Backend/Database**: Supabase (PostgreSQL) for real-time data and relational storage.
- **Authentication**: Supabase Auth for secure email/password and Google OAuth.
- **File Storage**: Supabase Storage for hosting academic materials (PDFs, docs).
- **Icons**: Lucide React for a consistent and lightweight icon set.
- **State Management**: React Context API for global state (e.g., Auth).

## Library Usage Rules
- **Styling**: Always use Tailwind CSS classes. Avoid writing custom CSS files unless absolutely necessary.
- **Icons**: Exclusively use `lucide-react`. Do not install other icon libraries.
- **Components**: Use Shadcn/UI components for complex UI elements (modals, tables, inputs) to maintain consistency.
- **Data Fetching**: Use the Supabase client (`src/lib/supabase.ts`) for all database and storage interactions.
- **Routing**: Keep all route definitions in `src/App.tsx` using React Router.
- **Types**: Define all data models in `src/lib/types.ts` and reuse them across the application.
- **File Naming**: 
  - Components: PascalCase (e.g., `FileBrowser.tsx`)
  - Hooks/Utils/Lib: camelCase (e.g., `useAuth.ts`, `supabase.ts`)
- **Structure**: 
  - `src/components/`: Reusable UI components.
  - `src/pages/`: Main page views.
  - `src/contexts/`: React Context providers.
  - `src/lib/`: Configuration and type definitions.

## Development Principles
- **Simplicity**: Prioritize clean, readable code over complex abstractions.
- **Responsiveness**: Every UI element must be mobile-friendly.
- **Error Handling**: Let errors bubble up to the UI or use toasts for user feedback; avoid silent failures.
- **Modularity**: Keep components under 100 lines. Refactor into smaller sub-components when they grow too large.