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

---

## #002 — 2026-09-17 — Backend: the `/evaluate` endpoint

> I need to start developing the backend. My idea is to have an `/evaluate` endpoint, a POST
> method that receives an `expression` parameter: the mathematical expression the frontend
> sends as a string. It must return its response code, the error with its message when it
> fails, and the result.
>
> In the controller layer, validate the string with a regular expression to prevent injections
> (the frontend sends the string using operator symbols — define them and store them in the
> context files, keeping in mind they cover addition, subtraction, multiplication, division,
> exponentiation, square root and percentage), checking whatever is needed to confirm that the
> string is a mathematical operation: the operators plus the numbers.
>
> Once validated, pass it to the service layer, where I want you to rely on a library to parse
> and evaluate the operation. You can use the Expr library, which I found while researching,
> but if you know a better one I would like to hear about it.
>
> The library requires words for certain expressions (`pow`, `sqrt`), so those need to be
> mapped, and that mapping is part of the business logic. Once mapped and the string parsed
> into what the evaluator needs, evaluate the operation and return the result; if it does not
> pass some validation, return the corresponding error.
>
> Do a general analysis of the implementation. Ask me anything you are unsure about, and if
> everything is clear, switch to plan mode and start the specific analysis of the
> functionality to be implemented.

---

## #003 — 2026-09-17 — Comment policy

> Another detail and decision to record in general is about comments: only write a comment
> when you consider that it adds value to the code, and make sure the declared variables are
> self-expressive in line with clean code. When a method, a variable or a fragment of code is
> not understandable at first glance, then go ahead and write well structured, clear comments —
> but only if they are required.

---

## #004 — 2026-09-17 — Frontend: mocking the calculator UI

> I need you to review the application context; now I need us to focus on the frontend. I need
> you to help me mock a calculator UI using Tailwind to optimise the styles, TanStack (React
> Query) to handle the requests and cache, plus Mantine as the component library so the visual
> result is attractive.
>
> I need the calculator page to be responsive. You can implement a simple calculator in the
> centre of the screen, in a dark theme that is easy on the eyes, using greys or dark blues.
>
> You can take mobile phone calculators as a reference; the idea is that you can click the
> calculator buttons to write, or use the computer's normal keyboard. The expression being
> written must be shown at the top, and the result is only shown when the "equals" (=) button
> is clicked.
>
> Remember to use React design patterns where they are needed, follow the proposed structure of
> the application, and also remember not to use effects (`useEffect`) unless strictly
> necessary, fulfilling their reason for being (effects are for connecting the app to the
> outside world). Nor do you need to overuse memoization — neither `useMemo` nor `useCallback` —
> in the first instance; remember this is a simple single-page application.
>
> Try to do a general analysis of the implementation first and gather any doubts; if you need
> to clarify them, let me know. Once you have all the context clear and ready, you can switch
> to plan mode to start the specific analysis and the planning of the implementation.

Scope agreed after the analysis: this iteration covered only the UI mock and the dependency
setup. Integration, tests, validation, documentation and commits were deferred to #006.

---

## #005 — 2026-09-17 — Formatting, and part two of the frontend

> Now run Prettier to format all the code. Once you have run it, go ahead with the planning of
> part 2 of the implementation, which would be the integration with the backend, validation,
> implementation of unit tests and updating the documentation.

---

## #007 — 2026-09-17 — Rules for what can be typed next

> Something additional is that the calculator, when you click several times or try to write
> several symbols in a row, should not allow it unless certain conditions hold. That is, you
> should not be able to put several `*` (multiplications) because they would throw an error,
> but it should let me use `-` (negative) to indicate a negative number, or play with the
> parentheses: you should not be able to open several parentheses one after another, but you
> should be able to close one as long as there is one opened before.
