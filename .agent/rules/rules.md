---
trigger: always_on
---

# HoloBridge AI Coding Rules

This document defines coding standards and rules that AI assistants (and developers) must follow when contributing to this codebase. The goal is to ensure consistency, type safety, and maintainability.

---

## 1. TypeScript Fundamentals

### 1.1. No `any` Type
- ❌ **Never** use `any` unless absolutely unavoidable.
- ✅ Use `unknown` and narrow with type guards.
- ✅ Define explicit interfaces for all data structures.

```typescript
// ❌ Bad
function process(data: any) { ... }

// ✅ Good
function process(data: unknown) {
    if (typeof data === 'object' && data !== null && 'id' in data) { ... }
}
```

### 1.2. Explicit Return Types
- Always declare explicit return types for functions.

```typescript
// ❌ Bad
function getUser(id: string) { return db.find(id); }

// ✅ Good
function getUser(id: string): Promise<User | null> { return db.find(id); }
```

### 1.3. Use `readonly` Where Possible
- Mark properties and arrays as `readonly` when they shouldn't be mutated.

---

## 2. Error Handling

### 2.1. Never Swallow Errors
- ❌ Empty `catch` blocks are forbidden.
- ✅ Log or rethrow errors.

```typescript
// ❌ Bad
try { riskyOperation(); } catch (e) {}

// ✅ Good
try { riskyOperation(); } catch (e) {
    logger.error('Operation failed', e);
    throw e;
}
```

### 2.2. Async/Await Best Practices
- Always wrap `await` in `try/catch` or use `.catch()`.
- Use `Promise.allSettled()` when parallel operations can partially fail.

---

## 3. API Routes

### 3.1. Validate All Input
- Use Zod schemas to validate `req.body`, `req.params`, and `req.query`.
- Return 400 with a clear error message on validation failure.

### 3.2. Standardized Responses
- All API responses must follow this shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "...", "code": "ERROR_CODE" }
```

### 3.3. No Business Logic in Route Handlers
- Routes should only:
  1. Validate input
  2. Call a service
  3. Return the result
- All logic belongs in `src/discord/services/`.

---

## 4. Discord.js Specifics

### 4.1. Use Serializers
- Never return raw Discord.js objects (e.g., `Guild`, `Message`) directly.
- Always use the serializer functions in `src/discord/serializers.ts`.

### 4.2. Check Permissions Before Actions
- Before kicking, banning, or modifying, verify the bot has the required permissions.

### 4.3. Handle Partial Data
- Discord.js can return partial objects. Always check `.partial` and fetch if needed.

---

## 5. Plugins

### 5.1. Return Event Subscriptions
- The `events` hook must return an array of subscriptions for automatic cleanup.

### 5.2. Namespace Custom Events
- Prefix custom events with the plugin name: `my-plugin:event-name`.

---

## 6. Code Style

### 6.1. Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Variables, Functions | camelCase | `getUserById` |
| Classes, Interfaces, Types | PascalCase | `GuildService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Files | kebab-case | `guild-service.ts` |

### 6.2. Imports
- Group imports: Node.js builtins → External packages → Internal modules.
- Use `type` imports for types only: `import type { User } from './types'`.

### 6.3. Comments
- Use JSDoc for all exported functions and classes.
- Inline comments should explain *why*, not *what*.

---

## 7. Security

### 7.1. Never Log Secrets
- Do not log API keys, tokens, or passwords.

### 7.2. Sanitize User Input
- Assume all input (API body, Discord message content) is malicious.

### 7.3. Use Rate Limiting
- All public endpoints must be rate-limited.

---

## 8. Performance

### 8.1. Avoid Blocking the Event Loop
- Use `setImmediate()` or worker threads for CPU-intensive tasks.

### 8.2. Cache Discord Data
- Use Discord.js cache (`.cache`) instead of fetching repeatedly.

---

## Enforcement

These rules are enforced by:
1. **ESLint** - Static analysis for TypeScript issues.
2. **Prettier** - Automatic code formatting.
3. **Husky** - Pre-commit hooks prevent bad code from being committed.
4. **Code Review** - All PRs must be reviewed.

