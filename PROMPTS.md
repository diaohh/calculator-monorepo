# Prompt Log

Chronological record of every prompt given to the AI assistant on this project, written in
English. Entries are append-only: a new prompt is added at the end; previous entries are
never edited or rewritten.

---

## #001 — 2026-09-17 — Project bootstrap: context files, architecture decisions, README and Docker

> I am building a web Calculator application. The stack is a React (Vite.js) frontend and a Go
> backend, all inside a monorepo that must run with Docker. Everything in the project code,
> comments, documentation and tests, must be written in English.
>
> The calculator must support these operations: addition, subtraction, multiplication,
> division, exponentiation, square root and percentage.
>
> I already initialized both the `frontend` and the `backend` projects. I need you to set up
> the context files that define the good practices, the clean code principles (YAGNI, DRY and
> KISS) and the software architecture decisions, recorded as ADRs that state the context, the
> decision taken and its consequences, covering at least the monorepo layout, where the
> calculation logic lives, the backend layering, the API surface, the choice of the Go standard
> library over a web framework, the separation between domain errors and HTTP status codes, the
> frontend structure, Docker as the only way to run the project, and the testing strategy.
>
> For the backend I want a simplified clean architecture with a Model layer holding the data
> models and the request and response types. Controller layer that maps the HTTP request in
> order to call the service. Logic layer holding the service and its implementation.
>
> For the frontend I want a simple modular structure with services, components (`common` for
> reusable ones and the rest for the domain), utils (regex, functions and constants) and hooks.
>
> As an initial phase, define the corresponding context files for structuring the application
> and create the Docker Compose setup used to manage and run it.
>
> Also write a README that documents how to start the project, gives a brief context of what it
> is, links to the ADRs, shows an example of the API, and lists the stack in use.
>
> Keep in mind that each end (frontend and backend) must ship its corresponding unit tests
> and coverage as part of the definition of done.
>
> Finally, create a `.md` file where you keep an orderly record of every prompt I give you.
