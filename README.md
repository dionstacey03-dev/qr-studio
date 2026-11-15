# QR Studio

A modern, customizable QR code generator with an Apple-inspired Liquid Glass interface, built with React 19, TypeScript and Vite.

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

### Hosted Dynamic QR & Analytics
- Create hosted QR campaigns backed by Supabase PostgreSQL.
- Generate persistent redirect links that work across devices.
- Record server-side scan events and view campaign totals, scan timelines and coarse device/browser categories.
- Manage campaigns securely with Supabase Auth and row-level security.

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
| TypeScript | Application logic |
| Tailwind CSS 4 | Styling and Liquid Glass effects |
| QR Code Libraries | QR generation and scanning |
| Local Storage | Local history and preference persistence |
| Supabase Auth | Passwordless email sign-in |
| Supabase PostgreSQL | Hosted QR campaigns and scan analytics |
| Supabase Edge Functions | Public dynamic QR redirect gateway |

## 🚀 Getting Started

### Supabase setup (required for hosted dynamic QR)

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/migrations/202611150001_qr_studio_v2.sql`.
3. Deploy `supabase/functions/redirect` and configure it with `verify_jwt = false` (the public QR redirect endpoint must be reachable without a user session).
4. Set Edge Function secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` using Supabase. Never place the service-role key in Vite environment variables or commit it to Git.
5. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or the publishable key).
6. In Supabase Authentication URL Configuration, add local and deployed app URLs to the allowed redirect URLs.
7. Add the same two `VITE_` variables to Vercel Preview and Production environments, then redeploy.

Static QR generation remains available without Supabase credentials. Hosted campaigns require Supabase configuration and email sign-in.



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

## 🔒 Privacy & QR safety

Static QR generation and saved history are designed to work locally in your browser. QR codes are not automatically uploaded to a server when generated.

Camera access is requested only when scanning is started. Scanned web links should be reviewed before opening. Never enter credentials or payment details on a destination you do not trust.

Dynamic QR redirects and scan analytics use Supabase. The redirect function records coarse device/browser categories only; it does not store raw IP addresses. Static QR generation and local history remain browser-local.

## 👨‍💻 Author

**Dion Stacey Sellar**

- GitHub: [@dionstacey03-dev](https://github.com/dionstacey03-dev)
- Portfolio: [View Portfolio](https://dion-portfolio-sigma.vercel.app)

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

Built with ❤️ using React and Vite.
