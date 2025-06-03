# Installation

This guide will help you set up the JK project on your local machine for development and testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or later)
- **npm** (usually comes with Node.js)

## Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/JensKlimke/jk.git
cd jk
```

## Install Dependencies

Install all dependencies for all packages in the monorepo:

```bash
npm install
```

This command will:
1. Install all dependencies defined in the root `package.json`
2. Install all dependencies for each package in the workspace
3. Set up the necessary symlinks between packages

## Verify Installation

To verify that everything is installed correctly, you can run the linting command:

```bash
npm run lint
```

If this command completes without errors, your installation is successful.

## Next Steps

Now that you have installed the JK project, you can:

- [Build the packages](building.md)
- [Run the applications](running.md)