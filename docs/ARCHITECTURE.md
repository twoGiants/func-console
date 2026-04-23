# Architecture — func-console

## Stack

React + TypeScript + PatternFly 6 + OCP Dynamic Plugin SDK

## Layered Architecture

```mermaid
flowchart TB
    TYPES[Types] ---|cross-cutting| UTILS[Utils]
    SERVICES[Services] ---|cross-cutting| UTILS
    COMPONENTS[Components] ---|cross-cutting| UTILS
    VIEWS[Views] --> COMPONENTS[Components]
    VIEWS --> HOOKS[Hooks]
    COMPONENTS --> HOOKS
    COMPONENTS --> TYPES
    HOOKS --> SERVICES[Services]
    HOOKS --> TYPES
    SERVICES --> TYPES[Types]
```

Arrows mean "imports / depends on."

| Layer | Maps to | Depends on |
|-------|---------|------------|
| **Types** | `services/types.ts` | nothing |
| **Services** | `services/*/Service.ts` + implementations | Types, Utils |
| **Hooks** | `services/*/use*.ts` — wiring layer | Services, Types, Utils |
| **Components** | `components/` — FunctionTable, CreateForm, etc. | Hooks, Types, Utils |
| **Views** | `views/` — page-level components | Components, Hooks, Utils |
| **Utils** | `utils/` — constants, helpers | nothing (cross-cutting) |

### Dependency Rules

- Unidirectional: Types <- Services <- Hooks <- Components <- Views
- Utils can be imported by any layer
- Views never import Services directly (always through Hooks)
- Services never import Components or Views
- No circular dependencies

## React

### Page / Component / Hook Rules

**Components are simple by default** — they receive data via props, render it, and call callbacks. No logic at the top of a component.

**A component may own its own data and state when it encapsulates a self-contained capability that is not specific to any one page** (e.g., forge connection, auth flows, notification subscriptions). The component becomes the single owner of that concern. Pages consume it without orchestrating its internals.

**Pages are smart for page-specific data** — they use central hooks (e.g. `useClusterService`, `useSourceControl`) to fetch, prepare, and transform all data needed for downstream components.

**Extract logic into hooks** — if a page or component has any logic (state management, data transformation, side effects), extract it into a custom hook. If the hook is reused by multiple components, put it in a separate file: `useFunctionTable.ts`. If the hook is only used by one component, keep it in the same file, do not export it. If there is no logic, no hook is needed.

**File ordering** — within a file, put the exported component at the top, then its hook below, then helper functions at the bottom. Readers see the main thing first and can drill down.

### Performance

- **No speculative memoization**: Do not wrap every function in `useCallback` or every value in `useMemo` as a habit. Use them when there is a concrete reason: a `React.memo` child that depends on a stable reference, or a known re-render path (e.g., a sibling component re-rendering on every keystroke). Plain functions and derived values are the default.

## Architectural Guidance

- PatternFly components preferred over custom HTML
- Error handling through ErrorProvider/addError pattern
- Shared utilities in `utils/`, not hand-rolled per component
- Services consumed through hooks, never imported directly
