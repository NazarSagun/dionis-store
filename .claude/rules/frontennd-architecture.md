# Scalable frontend architecture guide

1. Low coupling
2. High cohesion
3. Classic state management (zustand store + facade, no event bus)
4. Isolation > duplication
5. Application structure:

```md
src/
├── `__log__/` — task progress records
├── `__tests__/` — unit/integration test setup
├── `core/` — shell/bootstrap; wires app
├── `libs/` — generic non-app code
├── `modules/` — domain/feature slices
├── `(pages|routes)/` — framework routing (skip if no metaframework)
└── `shared/` — reusable domains; may hold server-client shared code
```

6. Modules structure `(modules|shared)/(name-of-domain)`:

```md
└── `{id}-{summary}.md` — template `templates/task-log.md`
`__tests__/` — unit/integration tests
└── `*.test.*`
`AGENTS.md` — module conventions + references via `templates/AGENTS.md`
`configuration/` — static config; no business logic, no state
├── `constraints.ts` — `FEATURE_NAME`, constants
└── `validation.ts` — form/error config (when needed)
`core/` — state + business logic; UI-agnostic
├── `actions/` — optional; reusable store mutations (dedupe facade logic)
│ └── `*.ts` — one action per cohesive store change
├── `facade.ts` — public triggers (call store actions) + state selectors
└── `store.ts` — zustand `create` (+ `persist`/`partialize` when persisted); state + actions + derived values
`domain/` — pure types; no UI, transport, or persistence
└── `models.ts` — branded ids, discriminated unions
└── `*.ts` — business logic
`integration/` — backend boundary; nothing else fetches
├── `mappers.ts` — DTO → domain mapping
└── `repository.ts` — external/persistence calls
└── `*.ts` — other integration related logic
`presentation/` — UI only; read state + call facade
├── `connector.ts` — optional; glues all providers
├── `context.*` — provides facade via context
├── `main.*` — public entry
├── `router.*` — state-driven view switch
└── `*.*` — view components
```
