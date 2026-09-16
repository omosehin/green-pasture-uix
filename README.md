# Organic E-commerce Store

A modern, responsive e-commerce application built with Next.js for selling organic products. This application features a clean, user-friendly interface with cart functionality, product browsing, and a complete checkout process.

## Features

### 🛍️ Product Catalog

-  Browse organic fruits, vegetables, grains, and pantry items
-  Product search functionality
-  Category-based filtering
-  Product ratings and reviews
-  Detailed product information with high-quality images

### 🛒 Shopping Cart

-  Add/remove items from cart
-  Update quantities
-  Persistent cart using Redux Persist
-  Real-time cart total calculations
-  Free shipping threshold (#150000)

### 🔍 User Experience

-  Responsive design for all device sizes
-  Clean, modern interface with green organic theme
-  Product availability indicators
-  Organic certification badges
-  Sale/discount indicators

### 💳 Checkout Process

-  Multi-step checkout form
-  Customer information collection
-  Shipping and billing address forms
-  Form validation with Zod
-  Order summary with tax and shipping calculations
-  Order confirmation

### 🏗️ Technical Features

-  Server-side rendering with Next.js
-  State management with Redux Toolkit
-  Persistent cart data with Redux Persist
-  Form handling with React Hook Form
-  TypeScript for type safety
-  Tailwind CSS for styling
-  Lucide React for icons

## Tech Stack

-  **Framework**: Next.js 14
-  **Language**: TypeScript
-  **Styling**: Tailwind CSS
-  **State Management**: Redux Toolkit + Redux Persist
-  **Forms**: React Hook Form + Zod validation
-  **Icons**: Lucide React
-  **Package Manager**: npm/yarn

## Getting Started

### Prerequisites

-  Node.js 16+
-  npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd organic-ecommerce
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Project Structure

```
organic-ecommerce/
├── components/           # Reusable UI components
│   ├── Layout.tsx       # Main layout with header/footer
│   └── ProductCard.tsx  # Product display component
├── pages/               # Next.js pages
│   ├── _app.tsx        # App wrapper with providers
│   ├── index.tsx       # Home page
│   ├── products.tsx    # Products listing page
│   ├── cart.tsx        # Shopping cart page
│   └── checkout.tsx    # Checkout process page
├── store/               # Redux store configuration
│   ├── index.ts        # Store setup with persistence
│   ├── cartSlice.ts    # Cart state management
│   └── productsSlice.ts # Products state management
├── types/               # TypeScript type definitions
│   └── index.ts        # Product, Cart, Order types
├── lib/                 # Utility functions
│   └── validations.ts  # Zod schemas for forms
└── styles/              # Global styles
    └── globals.css     # Tailwind imports and custom styles
```

## Key Components

### State Management

-  **Cart Slice**: Manages cart items, quantities, and totals
-  **Products Slice**: Handles product catalog, categories, and search
-  **Redux Persist**: Maintains cart state across browser sessions

### Form Validation

-  Zod schemas for checkout form validation
-  React Hook Form integration for smooth user experience
-  Real-time validation feedback

### Responsive Design

-  Mobile-first approach with Tailwind CSS
-  Responsive grid layouts
-  Touch-friendly interface elements

## Available Scripts

-  `npm run dev` - Start development server
-  `npm run build` - Build for production
-  `npm run start` - Start production server
-  `npm run lint` - Run ESLint

## Features in Detail

### Product Features

-  Organic certification indicators
-  Stock availability tracking
-  Rating system with reviews count
-  Category-based organization
-  Search functionality across names and descriptions

### Cart Features

-  Persistent cart across sessions
-  Quantity controls with validation
-  Remove individual items or clear entire cart
-  Dynamic pricing calculations
-  Free shipping threshold indicators

### Checkout Features

-  Multi-step form with validation
-  Separate billing/shipping addresses
-  Order summary with itemized costs
-  Loading states and success confirmation
-  Form error handling and user feedback

## Customization

### Adding New Products

Products are currently stored in the `productsSlice.ts` file. To add new products, modify the `mockProducts` array with the required product structure.

### Styling

The application uses Tailwind CSS with a custom green theme. Colors and styling can be modified in `tailwind.config.js` and component files.

### Business Logic

Tax rates, shipping costs, and free shipping thresholds can be adjusted in the cart and checkout components.

## Browser Compatibility

-  Chrome 80+
-  Firefox 75+
-  Safari 13+
-  Edge 80+

## Performance Considerations

-  Next.js automatic code splitting
-  Image optimization for product photos
-  Redux state normalization
-  Memoized selectors for cart calculations

## License

This project is private and for demonstration purposes.

## Contributing

This is a demonstration project. For production use, consider implementing:

-  User authentication system
-  Backend API integration
-  Payment processing
-  Order management system
-  Inventory management
-  Admin dashboard
-  Email notifications
-  Advanced search and filtering
-  Product reviews system
-  Wishlist functionality
