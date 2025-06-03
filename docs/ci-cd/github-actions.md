# GitHub Actions Workflow

This guide explains the Continuous Integration (CI) workflow using GitHub Actions in the JK project.

## Overview

The JK project uses GitHub Actions for continuous integration to ensure code quality and prevent regressions. The CI workflow runs automatically on every push to the `main` branch and on every pull request targeting the `main` branch.

## Workflow Configuration

The CI workflow is defined in the `.github/workflows/ci.yml` file. This file specifies:

- When the workflow should run
- What jobs should be executed
- The steps for each job
- The environment for running the jobs

## Workflow Triggers

The workflow is triggered on:

```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

This means the workflow runs when:
- Code is pushed directly to the `main` branch
- A pull request is opened, updated, or reopened that targets the `main` branch

## Jobs

The workflow consists of two main jobs:

### 1. Lint

The lint job checks the code for style and quality issues:

```yaml
lint:
  name: Lint
  runs-on: ubuntu-latest

  steps:
  - name: Checkout code
    uses: actions/checkout@v3

  - name: Set up Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '18'
      cache: 'npm'

  - name: Install dependencies
    run: npm ci

  - name: Run linter
    run: npm run lint
```

This job:
1. Checks out the code
2. Sets up Node.js v18
3. Installs dependencies using `npm ci` (which is faster and more reliable than `npm install` for CI environments)
4. Runs the linter using `npm run lint`

### 2. Test

The test job runs the test suite:

```yaml
test:
  name: Test
  runs-on: ubuntu-latest
  needs: lint

  steps:
  - name: Checkout code
    uses: actions/checkout@v3

  - name: Set up Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '18'
      cache: 'npm'

  - name: Install dependencies
    run: npm ci

  - name: Run tests
    run: npm test
```

This job:
1. Checks out the code
2. Sets up Node.js v18
3. Installs dependencies using `npm ci`
4. Runs the tests using `npm test`

Note that the test job depends on the lint job (`needs: lint`), which means it will only run if the lint job passes.

## Environment

Both jobs run on `ubuntu-latest`, which is a Ubuntu Linux environment provided by GitHub Actions. This environment includes:

- The latest stable version of Ubuntu
- Common development tools
- A Node.js runtime (which we explicitly set to version 18)

## Caching

The workflow uses caching to speed up the installation of dependencies:

```yaml
- name: Set up Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'
```

This caches the `node_modules` directory between runs, which can significantly reduce the time it takes to install dependencies.

## Workflow Status

The status of the workflow is displayed as a badge in the README.md file:

```markdown
[![CI](https://github.com/JensKlimke/jk/actions/workflows/ci.yml/badge.svg)](https://github.com/JensKlimke/jk/actions/workflows/ci.yml)
```

This badge shows whether the workflow is passing or failing on the `main` branch.

## Viewing Workflow Results

You can view the results of the workflow runs in the "Actions" tab of the GitHub repository. This shows:

- A list of all workflow runs
- The status of each run (success, failure, or in progress)
- Detailed logs for each job and step

## Troubleshooting

If the workflow fails, you can:

1. Click on the failing workflow run in the "Actions" tab
2. Click on the failing job
3. Expand the failing step to see the error message
4. Fix the issue in your code and push the changes

Common issues include:

- Linting errors: Fix the code style issues identified by ESLint
- Test failures: Fix the failing tests or update the tests if the code changes were intentional
- Dependency issues: Make sure all dependencies are correctly specified in the package.json files

## Future Enhancements

Potential enhancements to the CI workflow could include:

- Adding a build job to verify that the project builds correctly
- Adding a deployment job to automatically deploy the application
- Adding code coverage reporting
- Adding performance testing
- Adding security scanning

## Next Steps

- Learn about [Docker setup and usage](../docker/setup.md)
- Return to the [main documentation](../README.md)