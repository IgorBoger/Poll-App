# PollApp

PollApp is an Angular survey application built as a Developer Akademie project based on the provided Figma design. Visitors can create surveys, vote, and view live results without signing in.

## Features

- Ending-soon surveys above the general list, sorted by the earliest deadline. Up to three surveys ending within the next seven days are shown.
- Separate active and past survey tabs with category filtering and an "All surveys" reset.
- Survey creation in an overlay with required-field indicators and validation that rejects empty or whitespace-only text.
- Optional descriptions and deadlines, multiple questions, and two to six answer options per question.
- Single-choice and multiple-choice questions.
- Live result bars and percentages through Supabase Realtime; results appear beside the questions on desktop.
- Read-only voting controls for expired surveys, with an "Ended" deadline label.
- Browser-local storage of submitted selections to prevent another submission from the same browser storage.
- Responsive layouts, local fonts, keyboard-accessible controls, and reduced-motion styles.

After a successful vote, the survey view closes and the home screen is displayed. Existing selections remain visible when the survey is reopened in the same browser.

## Additional usability features

- Escape closes the survey creation overlay or survey detail view using the existing close actions. Native publication-dialog handling takes priority.
- An "Ended" label distinguishes expired surveys from upcoming deadlines in the detail view.

## Technology

- Angular 22 with standalone components, signals, and template-driven forms.
- TypeScript 6 and RxJS 7.
- SCSS with separate responsive stylesheets.
- Supabase PostgreSQL, database functions, and Realtime subscriptions.

## Local development

Use a Node.js version supported by the installed Angular CLI: `^22.22.3`, `^24.15.0`, or `>=26.0.0`. The project was checked with Node.js 24.18.0. The package manager declared in `package.json` is npm 11.16.0.

```bash
npm ci
npm start
```

`npm start` runs the Angular development server and opens the app at [localhost:4200](http://localhost:4200/). The app connects to the configured Supabase project, so loading surveys, publishing, voting, and live results require a network connection and a running backend.

## Supabase configuration

The project URL and publishable client key are configured in [supabase.ts](src/app/shared/services/supabase/supabase.ts). Database access is controlled by the configured grants, row-level security policies, and database functions.

The application uses these existing tables:

| Table                          | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `public.surveys`               | Titles, categories, descriptions, creation timestamps, and deadlines |
| `public.survey_questions`      | Ordered questions and their selection mode                           |
| `public.survey_answer_options` | Ordered answer options and vote counts                               |

The SQL files in [supabase/migrations](supabase/migrations) define survey creation, read policies for questions and answers, vote submission, and the Realtime publication for answer changes. Only apply migrations that have not already been applied, in filename order.

**The migrations assume the existing tables and their relationships are already present; they do not contain a complete initial database schema.** To use a different Supabase project, first provide that schema and the required read access to surveys, then apply the migrations and update the client configuration.

Survey creation uses `create_survey`. Voting uses `submit_survey_votes`, which validates answer ownership, selection limits, required questions, and the survey deadline before updating vote counts. Realtime listens for updates to `survey_answer_options` and reloads the corresponding results. Subscriptions are released when the survey view is closed or changed.

## Production build and deployment

```bash
npm run build
```

Upload the contents of `dist/poll-app/browser/` to the web server. The production configuration uses the base path `/angular-projects/pollapp/`, so the application should be hosted under that path.

For a different hosting path, supply the appropriate base href when building, for example for a domain root:

```bash
npm run build -- --base-href /
```

Use an HTML fallback to `index.html` if the hosting service requires one for client-side routing.

## Verification

The production build and targeted code checks were run during development. Core workflows were also manually checked in the browser:

1. Check ending-soon ordering and the active/past survey lists.
2. Filter by category in both tabs, test an empty category, and reset to all surveys.
3. Submit an empty creation form and whitespace-only fields; verify that publishing is blocked.
4. Create and reopen a survey with single-choice and multiple-choice questions.
5. Verify that unanswered questions prevent vote submission.
6. Open the same active survey in two browser windows, submit in one, and observe updated results in the other without reloading.
7. Open an expired survey and verify that its results remain visible while voting is disabled.
8. Check Tab, Enter, Space, and Escape handling and the publication confirmation.
9. Compare desktop and mobile layouts after deployment.

`npm test` is currently a placeholder script: no Angular test target or automated end-to-end suite is configured. The production build currently reports size-budget warnings for the initial bundle and some component stylesheets.

## Project structure

```text
src/app/pages/home/          Home screen, survey lists, creation form, and detail view
src/app/shared/components/   Shared application header
src/app/shared/services/     Supabase service and survey interfaces
src/app/responsive/          Responsive component styles
public/                     Images, favicon, and locally hosted fonts
supabase/migrations/        Database functions, policies, and Realtime setup
```

Font license files are included in the corresponding directories under `public/fonts/`. The local `private/` directory contains project references and is excluded from version control.
