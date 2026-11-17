# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Start project

**Change 'NODE_ENV' variable inside package.json script by using 'cross-env' module:**

'NODE_ENV=development_docker' - uses '.env.development.docker' for using Docker env. variables.

'NODE_ENV=development_locally' - uses '.env.development.locally' for using local env. variables.

'NODE_ENV=production' - uses '.env.production' for using production env. variables.

'NODE_ENV=test' - uses '.env.test' for jest tests

### Docker

`docker compose up`

### Locally

`npm install --global --force yarn`
`corepack enable`
`yarn set version 1.22.22`
`yarn run docker`
`yarn global add nodemon`
`yarn install`
`yarn run dev`

## Folder structre

```text
service-api/
├── src/
│   ├── configs/        # Fastify logger configuration options and application settings
│   ├── entities/       # TypeORM entities that define database structure and relationships
│   ├── plugins/        # Fastify plugins automatically loaded during server startup
│   ├── locales/        # Internationalization files for translation strings
│   ├── manual/         # Fastify plugins loaded manually (excluded from autoload)
│   ├── migrations/     # Database migration scripts for schema changes
│   ├── routes/         # API route definitions (folder names become URL paths)
│   ├── services/       # Reusable business logic services for plugins and routes
│   ├── sharedSchema/   # Common validation schemas for request/response data
│   └── templates/      # User-facing templates (e.g., email templates)
└── dist/
```

## Testing setup

jest.setup.ts - overrided .env values for tests (add new if override is need, do not change if global project settins are ok for testing);

globalSetup.ts contains scripts that to build , tear down app and create test useds.

jest.global-setup.js - runs once before all test and creates test user (pretestSetup.js)

utils/testData.ts - contains predefined data for test. E.g. Test user. New entites can be added on demant

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
