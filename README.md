# Medical Products Management System

A comprehensive full-stack web application for managing medical products company operations, integrating medical archive management, inventory control, sales tracking, customer relationship management, financial analytics, and AI-powered insights using Google's Gemini API.

## Features

- **Product Management**: Complete inventory tracking with expiry dates, batch numbers, and regulatory information
- **Customer Relationship Management**: Manage hospitals, clinics, pharmacies, and distributors
- **Order Management**: Full order lifecycle from quotation to delivery and payment
- **Inventory Control**: Real-time stock tracking, automated reorder alerts, and warehouse management
- **Medical Archive**: Patient records, medical documents, and AI-powered analysis
- **Financial Analytics**: Revenue tracking, profit analysis, and accounts receivable management
- **AI-Powered Insights**: Demand forecasting, pricing optimization, and business intelligence using Gemini AI
- **Universal Search**: Natural language search across all entities
- **Document Processing**: OCR for invoices, medical reports, and other documents

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: IndexedDB (via Dexie.js)
- **AI**: Google Gemini API
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Gemini API key:
     ```
     NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── dashboard/         # Dashboard components
│   ├── products/          # Product management
│   ├── customers/         # Customer management
│   ├── orders/            # Order management
│   └── ...
├── lib/                   # Utility functions and configurations
│   ├── db/               # Database schema and operations
│   ├── utils/            # Helper functions
│   ├── security/         # Security utilities
│   └── auth/             # Authentication
├── services/              # Business logic services
│   ├── gemini/           # AI services
│   ├── database/         # Database services
│   └── analytics/        # Analytics services
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── store/                 # Zustand state management
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features Implementation Status

This project follows a spec-driven development approach. See `.kiro/specs/medical-archive-system/` for:
- `requirements.md` - Detailed requirements
- `design.md` - System design and architecture
- `tasks.md` - Implementation task list

## License

ISC

## Author

Medical Products Management System Team
