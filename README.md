# Saudi Mais Medical Inventory System

A comprehensive web-based inventory management system for Saudi Mais Co. for Medical Products.

## Features

- 🔐 Role-based authentication and authorization
- 📊 Real-time analytics with AI-powered insights (Gemini AI)
- 🌍 Bilingual support (English/Arabic) with RTL layout
- 📝 Comprehensive audit logging
- 💾 Automated backup and recovery
- 📱 Mobile-responsive design
- ♿ Accessibility compliant (WCAG 2.1 AA)
- 🎨 Dark mode support

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth v5
- **AI:** Google Gemini AI
- **Charts:** Recharts
- **Internationalization:** next-intl

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and configure your environment variables:

```bash
cp .env.example .env.local
```

4. Set up the database:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── forms/       # Form components
│   ├── tables/      # Table components
│   ├── charts/      # Chart components
│   ├── filters/     # Filter components
│   ├── modals/      # Modal components
│   └── layout/      # Layout components
├── services/        # Service layer (Prisma, Auth, AI)
├── db/              # Database schema and seeds
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for required environment variables.

## License

Private - Saudi Mais Co. for Medical Products
