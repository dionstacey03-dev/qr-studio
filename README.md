# QR Studio

A modern, customizable QR code generator with an Apple-inspired Liquid Glass interface.

QR Studio makes it easy to create, customize, scan, and download QR codes through a clean, responsive interface designed for mobile and desktop.

## ✨ Features

### QR Code Generation
- Generate QR codes for URLs, text, email, phone numbers, SMS, Wi-Fi, and contact information.
- Customize QR code colors, size, and appearance.
- Add a custom logo to the center of your QR code.
- Preview changes in real time.

### Customization & Templates
- Explore a collection of professionally designed QR templates.
- Choose from styles such as Minimal Black, Neon Glow, Premium Gold, and Midnight Glass.
- Customize template colors and save your own designs.
- Create QR codes that match your personal or business branding.

### Liquid Glass Interface
- Modern, Apple-inspired Liquid Glass effects.
- Frosted glass surfaces, subtle blur, and smooth animations.
- Light mode, dark mode, and system theme support.
- Responsive design for mobile and desktop.

### QR Code Scanner
- Scan QR codes using your device's camera.
- Upload images to scan saved QR codes.
- Copy scanned content and open supported URLs.

### Download & History
- Download QR codes as PNG or SVG.
- Export high-resolution QR codes.
- Copy and share generated QR codes.
- Save recently generated QR codes and access them later.
- Store history and preferences locally in your browser.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development server and build tool |
| JavaScript | Application logic |
| CSS | Styling and Liquid Glass effects |
| QR Code Libraries | QR generation and scanning |
| Local Storage | History and preference persistence |

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/dionstacey03-dev/qr-studio.git
```

Navigate to the project directory:

```bash
cd qr-studio
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## 📦 Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The production files will be generated in the `dist` directory.

## 🌐 Deployment

QR Studio can be deployed using Vercel.

1. Import the GitHub repository into Vercel.
2. Select Vite as the framework preset.
3. Use `npm run build` as the build command.
4. Set `dist` as the output directory.
5. Deploy the application.

Vercel can automatically deploy new changes whenever the connected GitHub repository is updated.

## 📱 Mobile Support

QR Studio is designed to work across mobile phones, tablets, and desktop browsers.

Camera-based QR scanning requires browser camera permission and a secure HTTPS connection.

## 🔒 Privacy

QR Studio is designed to keep generated QR codes and saved history in the user's browser.

The application does not require an account to generate QR codes. Camera access is requested only when scanning is started.

## 👨‍💻 Author

**Dion Stacey Sellar**

- GitHub: [@dionstacey03-dev](https://github.com/dionstacey03-dev)
- Portfolio: [View Portfolio](https://dion-portfolio-sigma.vercel.app)

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

Built with ❤️ using React and Vite.
