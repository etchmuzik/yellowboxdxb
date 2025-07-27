# Yellow Box Coding Standards

## TypeScript Guidelines
- Always use TypeScript for new files
- Define proper interfaces for all data structures
- Use strict type checking
- Avoid `any` type - use proper typing or `unknown`
- Export types from `/src/types/index.ts`

## React Component Standards
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization when needed
- Follow the component structure:
  ```tsx
  // Imports
  import React from 'react';
  import { ComponentProps } from './types';
  
  // Component
  export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
    // Hooks
    // Event handlers
    // Render
    return (
      <div>
        {/* JSX */}
      </div>
    );
  };
  ```

## Firebase Integration
- Use the service layer pattern for Firebase operations
- Implement proper error handling for all Firebase calls
- Use Firebase security rules for data protection
- Follow the existing patterns in `/src/services/`

## UI/UX Standards
- Use Shadcn/ui components consistently
- Follow Tailwind CSS utility-first approach
- Implement responsive design (mobile-first)
- Use proper loading states and error messages
- Follow accessibility guidelines (ARIA labels, keyboard navigation)

## State Management
- Use React Query for server state
- Use React hooks (useState, useReducer) for local state
- Implement proper loading and error states
- Cache data appropriately with React Query

## File Organization
- Group related components in feature folders
- Use index.ts files for clean imports
- Keep components small and focused
- Separate business logic into custom hooks or services

## Error Handling
- Implement try-catch blocks for async operations
- Use proper error boundaries for React components
- Log errors appropriately for debugging
- Show user-friendly error messages

## Testing Considerations
- Write testable code with clear separation of concerns
- Mock Firebase services in tests
- Test user interactions and edge cases
- Use proper TypeScript types in tests