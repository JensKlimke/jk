# Finance API

A RESTful API for managing financial data, including accounts, transactions, balances, and more.

## Features

- MongoDB database with Mongoose ODM
- Express.js REST API
- TypeScript for type safety
- Data conversion tool for importing financial data

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or remote)

## Installation

1. Clone the repository
2. Navigate to the project directory:
   ```
   cd apps/finance-api
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the project root with the following variables:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=finance
   ```

## Usage

### Development

To run the application in development mode:

```
npm run dev
```

### Production

To build and run the application in production mode:

```
npm run build
npm start
```

### Data Conversion

To import data from a dump file:

```
npm run convert -- path/to/dump/file.txt
```

If no file path is provided, it will use the default file at `data/2025-07-16_dump.txt`.

## API Endpoints

- `GET /`: Welcome message
- `GET /health`: Health check endpoint

## Data Models

The application uses the following data models:

- **Account**: Financial accounts
- **Transaction**: Financial transactions (deposits, expenses, orders, transfers)
- **Item**: Budget items or categories
- **Contract**: Recurring payment contracts
- **Balance**: Account balance snapshots
- **Stock**: Stock investments

## Development

### Project Structure

```
finance-api/
├── data/                  # Data files
├── dist/                  # Compiled JavaScript (generated)
├── docs/                  # Documentation
├── src/                   # Source code
│   ├── interface/         # TypeScript interfaces
│   ├── models/            # Mongoose models
│   ├── tools/             # Utility tools
│   └── index.ts           # Application entry point
├── .env                   # Environment variables (create this)
├── .gitignore             # Git ignore file
├── package.json           # Project dependencies and scripts
├── README.md              # Project documentation
└── tsconfig.json          # TypeScript configuration
```

### Testing

The project includes comprehensive tests for all models and functionality. The tests use Jest as the test runner and assertion library, and mongodb-memory-server to create an in-memory MongoDB instance for testing.

#### Test Structure

- `tests/models/` - Tests for Mongoose models
- `tests/tools/` - Tests for utility tools like the converter
- `tests/index.test.ts` - Tests for the main Express application

#### Running Tests

To run all tests:

```
npm test
```

To run tests with coverage report:

```
npm test -- --coverage
```

To run a specific test file:

```
npm test -- tests/models/account.model.test.ts
```

#### Test Coverage

The test suite aims to maintain at least 70% code coverage across the codebase. Coverage thresholds are configured in the Jest configuration file.

## License

ISC
