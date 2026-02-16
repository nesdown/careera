# Careesta 2.0

A modern career development and leadership coaching platform built with React, Vite, and Tailwind CSS.

## Features

- Interactive career assessment questionnaire
- Personalized roadmap preview
- Real-time activity feed
- Calendly integration for booking sessions
- Beautiful animations with Framer Motion
- Fully responsive design (mobile-optimized)

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Client-side routing
- **Lucide React** - Icons

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Digital Ocean

This project is configured to deploy to Digital Ocean App Platform.

### Prerequisites

1. Push your code to a GitHub repository
2. Have a Digital Ocean account

### Deploy Steps

1. **Connect GitHub Repository**
   - Go to Digital Ocean App Platform
   - Click "Create App"
   - Select your GitHub repository
   - Choose the branch (usually `main`)

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: `8080`

3. **Environment Variables**
   - PORT: `8080` (automatically set)

4. **Deploy**
   - Click "Next" and review settings
   - Click "Create Resources"

The app will automatically build and deploy. The `.do/app.yaml` file contains the configuration for Digital Ocean.

### Manual Configuration

If using the App Platform UI:

- **Environment**: Node.js
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: 8080

## Project Structure

```
careesta2.0/
├── src/
│   ├── components/       # React components
│   ├── data/            # Static data (questions, etc.)
│   ├── pages/           # Page components
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── .do/                 # Digital Ocean config
│   └── app.yaml         # App Platform spec
├── serve.json           # Serve configuration
└── package.json         # Dependencies and scripts
```

## Key Features Explained

### Assessment Flow
- 12-question interactive questionnaire
- Progress tracking
- Personalized results

### Mobile Optimization
- Responsive navbar with adaptive sizing
- Mobile-friendly cards and layouts
- Touch-optimized interactions
- Proper text truncation and spacing

### Animations
- Smooth page transitions
- Hover effects on interactive elements
- Live activity notifications
- Animated counters and progress bars

## Environment Variables

No environment variables are required for basic functionality. The Calendly integration uses a hardcoded URL which can be updated in `src/components/CalendlyModal.jsx`.

## Support

For questions or issues, please contact the development team.

## License

Private and confidential.
