# UWCCSC Ceremony Message Board

🌐 [English](README.md) | [简体中文](README.zh-CN.md)

![Preview](./demo.png)

A real-time message display system for ceremonies. Participants submit messages via QR code, which are displayed on a central screen. Includes fallback messages and testing utilities.

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
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

- ## Deployment
- Configure your web server to point to the project root.
- Set up database.
- Initialize the message table.
- Populate `planb.txt` with default fallback messages.
- **Note**: The database solution was hosted outside of China mainland, so you will need to bypass the China internet wall to submit a message.


## Customization

### Background Image
- Replace `/background.jpg` with your image (recommended 16:9 aspect ratio, 1920×1080 px or higher).

### Fallback Messages
- Edit `planb.txt` with one message per line (max 140 characters, UTF-8 encoding).

## Testing Utilities

### Fake Submission
- Access `submit_fake.html` directly to simulate successful submissions without writing to the real database.

### QR Code Generation
- Open `qr_export.html` and adjust parameters:
  - Size: 100–4000 px  
  - Export as PNG 

## Troubleshooting

### Messages not displaying
- Verify database connection  
- Check message table structure  
- Ensure the Start button was clicked

### QR code issues
- Confirm server accessibility  
- Test URL manually

### Submission errors
- Check PHP error logs  
- Validate form field requirements

## Contributing
- Fork the repository  
- Create a feature branch: `git checkout -b feature/awesome-improvement`  
- Commit your changes: `git commit -m "Add awesome improvement"`  
- Push to the branch: `git push origin feature/awesome-improvement`  
- Open a Pull Request describing your changes  

## License
This project is licensed under the MIT License.  
See [LICENSE](./LICENSE) for the original English version.  
See [LICENSE.zh-CN.md](./LICENSE.zh-CN.md) for a Simplified Chinese translation.
