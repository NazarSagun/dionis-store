# apps/api — Backend Rules

This file extends the root `CLAUDE.md`. It holds rules specific to the NestJS backend in `apps/api`.

## Module shape

Each domain area is a feature module under `src/features/<name>`, such as `games`, `users`, or `auth`. A feature module has a controller, a service, and a `dto/` folder with one class per file. Code shared across features lives in `src/common`:

- `prisma/` holds the Prisma service.
- `guards/` holds the auth guards.
- `decorators/` holds the role decorator.
- `errors/` holds the error helpers.
- `filters/` holds the global exception filter.

## Database access

Inject `PrismaService` into a provider. Do not call `new PrismaClient()` inside a Nest provider. The scripts in `src/db-seed` are the one exception. They run as plain scripts outside Nest's dependency injection, not as part of the running app.

## Error handling

A service throws a `CustomError` with a message and a status code. A controller catches it and rethrows it through `toHttpException`. A controller must never construct an `HttpException` directly. The global `AllExceptionsFilter` is a last-resort catch for an error that did not go through this path. Do not rely on it for an error you can predict and throw yourself.

## Input validation

A DTO with `class-validator` decorators validates every `@Body()` and every `@Query()` input. A field that only accepts a fixed set of string values needs `@IsIn` against an exported const array. A platform field and a sort-order field are two examples. Do not use a bare `@IsString` for a field like this. `games-query.dto.ts` shows this pattern.

A path parameter, such as `page` or `gameId`, is validated by hand in the controller today. If the value fails validation, the controller throws a `CustomError`. There is no shared pipe for this yet. If you add a new path parameter, follow the same manual pattern. This keeps one style instead of two.

## Auth guards

Apply `JwtAuthGuard` before `RolesGuard` in the same `@UseGuards(...)` call. `RolesGuard` reads the role set by `@RequireRole(...)` and needs the user that `JwtAuthGuard` attaches first. Both guards are applied per route or per controller, not globally. Do not assume a route is protected. Make sure that its decorators show this.

## Tests

Put a unit test next to its source file, named `*.spec.ts`. Do not put it in a `__tests__` folder. This differs from `apps/web` on purpose. Match whichever pattern the file you are in already uses.

## Known gaps

`apps/api/tsconfig.json` sets `strictNullChecks` but leaves `noImplicitAny` off. This makes the API less strict than the web app. Do not assume a variable's type is validated as tightly here as it is in `apps/web`.

The root CI workflow does not run `pnpm test --filter api`. Run it yourself before you call a change done.

```sh
pnpm test --filter api
```
