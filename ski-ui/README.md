# SKI Management System UI

A comprehensive expenditure tracking system with integrated user management and role-based access controls.

## Environment Setup

The application uses different environment configurations for development, testing, and production. Environment variables are managed through `.env` files:

- `.env.development` - Development environment settings
- `.env.test` - Test environment settings
- `.env.production` - Production environment settings
- `.env.example` - Example configuration with documentation

### Required Environment Variables

```bash
# API Configuration
VITE_API_URL           # Backend API URL
VITE_API_TIMEOUT       # API request timeout in milliseconds

# Application Settings
VITE_APP_TITLE        # Application title
VITE_APP_VERSION      # Semantic version number
VITE_DEBUG_MODE       # Enable debug features

# Feature Flags
VITE_ENABLE_ANALYTICS      # Enable analytics tracking
VITE_ENABLE_NOTIFICATIONS  # Enable notifications
```

### Environment Setup Steps

1. Copy the example environment file:
   ```bash
   cp .env.example .env.development
   ```

2. Update the variables in your new `.env.development` file

3. Validate your environment configuration:
   ```bash
   npm run validate:env
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:staging` - Build for staging
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:env` - Run environment configuration tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run validate:env` - Validate environment configuration

## Development Workflow

1. Set up your environment variables following the steps above
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Run tests to verify everything is working: `npm test`

## Environment-Specific Builds

- Development: `npm run dev`
- Staging: `npm run build:staging`
- Production: `npm run build`

Each build uses its corresponding environment file (`.env.development`, `.env.staging`, `.env.production`).

## Testing

The project includes comprehensive tests for environment configuration validation. Run them with:

```bash
npm run test:env
```

For full test coverage:

```bash
npm run test:coverage
```

## Error Handling

The environment validation system will:
- Exit with code 1 if required variables are missing or invalid
- Display warnings for optional variables that are missing or misconfigured
- Print the current environment status

## Contributing

1. Create a feature branch
2. Set up your environment using `.env.development`
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Security Notes

- Never commit `.env` files to version control
- Keep API keys and sensitive data in environment variables
- Use appropriate environment files for different deployment stages
- Enable security features in production environment
