

# UWCCSC Ceremony Message Board

![Preview](./demo.jpg)

A real-time message display system for ceremonies. Participants submit messages via QR code, which are displayed on a central screen. Includes fallback messages and testing utilities.

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Customization](#customization)
- [Testing Utilities](#testing-utilities)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Functionality
- **QR Code Access**: Participants scan QR code to access message submission form
- **Message Queue System**: 
  - Start button-controlled display initiation
  - Automatic fallback to planb.txt when no messages available
- **Real-time Display**: Submitted messages appear instantly on index.html
- **High-Resolution Export**: QR code generator supports up to 4000×4000 px exports

### Admin Features
- Background customization via background.jpg replacement
- Fake submission testing system (submit_fake.html)
- Graceful failure handling (users always see success page)

## Requirements

### Development
- Modern web browser (Chrome/Firefox recommended)
- Basic text editor
- Git (optional)

### Production
- Web server (Apache/Nginx)
- MySQL/MariaDB database
- PHP 7.4+ with PDO extension

## Quick Start

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/uwccsc-message-board.git
