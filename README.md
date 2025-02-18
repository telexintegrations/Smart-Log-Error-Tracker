# Smart-Log-Error-Tracker

A Telex integration specialized in monitoring and reporting Nginx error logs. This service analyzes Nginx error logs and reports them through Telex's webhook system, with planned support for remote Nginx instances.

## Features

Current Features:
- Local Nginx error log monitoring
- Intelligent error parsing and classification
- Configurable error thresholds
- Severity-based error categorization
- Real-time Nginx error detection
- Detailed error analysis and reporting

Upcoming Features:
- Remote Nginx instance monitoring
- Multi-instance support
- Dynamic log source configuration
- Real-time remote log streaming
- User authentication and access control
- Custom alert configurations per instance
- Dashboard for monitoring multiple Nginx servers

## Prerequisites

- Node.js v20.11.1 or higher
- npm v10.x or higher
- Access to Nginx error logs
- Telex webhook URL (for production)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd nginxLogErrorTracker
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
NGINX_LOG_PATH=C:\\nginx-1.27.4\\logs\\error.log  # Update with your Nginx log path
ERROR_THRESHOLD=1
TELEX_WEBHOOK_URL=https://telex.example.com/webhook
```

## Usage

### Development

```bash
npm run start
```

### Testing

```bash
npm test
```

### Manual Testing

```bash
npm run manual-test
```

## Error Classification

The system classifies Nginx errors into the following severity levels:

- 🔴 Emergency/Critical (emerg, alert, crit) - Severity 7-5
- 🔴 Error (error) - Severity 4
- 🟡 Warning (warn) - Severity 3
- 🟢 Notice (notice) - Severity 2
- ℹ️ Info (info) - Severity 1
- 🔍 Debug (debug) - Severity 0

## Project Structure

```
nginxLogErrorTracker/
├── src/
│   ├── index.js          # Express server setup
│   ├── config.js         # Configuration management
│   └── nginxParser.js    # Nginx log parsing logic
├── test/
│   ├── sample_logs/      # Test log files
│   ├── manual.test.js    # Manual testing script
│   └── nginxParser.test.js # Parser tests
└── package.json
```

## Roadmap

1. Remote Instance Support
   - Secure remote log access
   - Multiple instance management
   - Instance health monitoring

2. User Management
   - Authentication system
   - Role-based access control
   - Instance access permissions

3. Enhanced Monitoring
   - Real-time dashboard
   - Custom alert rules
   - Historical data analysis

4. Advanced Features
   - Log pattern learning
   - Predictive error detection
   - Custom reporting formats

## License

This project is licensed under the MIT License - see the LICENSE file for details
