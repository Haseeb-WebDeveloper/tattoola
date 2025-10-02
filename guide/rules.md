Tattoola App - Technical Specification for Cursor
Project Overview
Tattoola is a production-grade social media platform exclusively for tattoo enthusiasts. This application requires enterprise-level architecture comparable to Instagram and Facebook, with emphasis on scalability, security, and performance.
Core Requirements
Application Architecture

Performance: Implement optimization strategies including code splitting, lazy loading, memoization, and efficient rendering patterns
Security: Follow OWASP best practices, implement proper authentication/authorization, input sanitization, and secure data handling
Scalability: Design for horizontal scaling with clean separation of concerns, modular architecture, and efficient state management
Code Quality: Maintain clean, maintainable code following latest documentation standards and industry best practices

Key Features

Real-time messaging system
Social media feed with infinite scroll and optimized rendering
User profiles and authentication
Media upload and processing (tattoo images/videos)
Social interactions (likes, comments, shares, follows)
Content discovery and recommendations

Technical Standards
Styling Guidelines
CRITICAL: Always use NativeWind/Tailwind utility classes for styling

❌ NEVER use inline style prop
✅ ALWAYS use className with Tailwind utilities
Reference color schemes and class configurations from tailwind.config.js
Maintain consistent spacing, typography, and component patterns across the app

Code Standards

Follow TypeScript strict mode
Implement proper error boundaries and error handling
Use React best practices (hooks, composition, performance optimization)
Write self-documenting code with clear naming conventions
Add JSDoc comments for complex functions and components
Ensure all code is production-ready

Performance Requirements

Implement proper image optimization and lazy loading
Use virtualization for long lists (feed, messages)
Optimize bundle size with code splitting
Implement proper caching strategies
Monitor and optimize re-renders

Security Requirements

Validate all user inputs
Implement proper authentication flows
Secure API endpoints
Handle sensitive data appropriately
Follow mobile security best practices

Development Instructions for Cursor
When generating code:

Always check tailwind.config.js for available custom classes and colors
Prioritize NativeWind classes over style objects
Follow the project's existing patterns and architecture
Write scalable, maintainable code suitable for production
Include proper TypeScript types and interfaces
Implement error handling and loading states
Consider performance implications of every implementation
Follow React Native and Expo best practices
Ensure code is well-documented and follows the project's conventions