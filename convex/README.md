# Convex Backend Architecture

This document outlines the refactored backend structure for better maintainability.

## File Structure

```
convex/
├── lib/                    # Shared utilities and helpers
│   ├── auth.ts            # Authentication utilities
│   ├── constants.ts       # Application constants
│   ├── email.ts           # Email service utilities
│   ├── errors.ts          # Custom error classes
│   └── validation.ts      # Validation schemas and functions
├── auth.ts                # Core authentication (locked file)
├── dreams.ts              # Dream entry CRUD operations
├── emailVerification.ts   # Email verification functionality
├── accountLinking.ts      # Account linking functionality
├── schema.ts              # Database schema
└── http.ts                # HTTP handlers (locked file)
```

## Key Improvements

### 1. **Separation of Concerns**
- Authentication logic is centralized in `lib/auth.ts`
- Email functionality is isolated in `lib/email.ts` and `emailVerification.ts`
- Dream-related operations are in `dreams.ts`
- Account linking is in its own module

### 2. **Constants Management**
- All magic numbers and strings are defined in `lib/constants.ts`
- Easy to modify configuration values
- Type-safe constant definitions

### 3. **Error Handling**
- Custom error classes in `lib/errors.ts`
- Consistent error types across the application
- Better error messages and debugging

### 4. **Validation**
- Centralized validation logic in `lib/validation.ts`
- Reusable validation functions
- Business logic validation separated from schema validation

### 5. **Code Reusability**
- Common authentication patterns extracted to utilities
- Email service class for better organization
- Shared validation functions

## Usage Guidelines

### Authentication
```typescript
import { requireAuth, getOptionalAuth } from "./lib/auth";

// For operations requiring authentication
const userId = await requireAuth(ctx);

// For optional authentication
const userId = await getOptionalAuth(ctx);
```

### Error Handling
```typescript
import { ValidationError, NotFoundError } from "./lib/errors";

throw new ValidationError("Invalid input");
throw new NotFoundError("Dream entry");
```

### Constants
```typescript
import { SLEEP_QUALITY_RANGE, ALLOWED_MOODS } from "./lib/constants";

if (sleepQuality < SLEEP_QUALITY_RANGE.MIN) {
  // Handle error
}
```

## Migration Notes

- Removed duplicate files: `authCustom.ts` (functionality moved to appropriate modules)
- Consolidated email verification logic
- Updated internal function references
- Maintained backward compatibility for existing API calls

## Future Enhancements

1. **Caching Layer**: Add caching for frequently accessed data
2. **Rate Limiting**: Implement rate limiting for sensitive operations
3. **Audit Logging**: Add audit trails for important operations
4. **Data Validation**: Enhanced validation with custom validators
5. **Performance Monitoring**: Add performance metrics and monitoring
