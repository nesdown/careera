# Careesta 2.0

A modern career development and leadership coaching platform built with React, Vite, and Tailwind CSS.

## Features

- Interactive career assessment questionnaire
- AI-powered personalized PDF career reports (using OpenAI GPT-4)
- Calendly integration with custom UI for booking sessions
- PDF download after Calendly booking
- Real-time activity feed
- Beautiful animations with Framer Motion
- Fully responsive design (mobile-optimized)

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Client-side routing
- **Lucide React** - Icons
- **Express** - Backend API server
- **OpenAI API** - AI-powered report generation
- **jsPDF** - PDF generation

## Local Development

```bash
# Install dependencies
npm install

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your-api-key-here" > .env
echo "PORT=3001" >> .env

# Run development servers (in separate terminals)
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
npm run dev:api

# Build for production
npm run build

# Preview production build (with API)
npm run start
```

## Deployment to Digital Ocean

This project is configured to deploy to Digital Ocean App Platform.

### Prerequisites

1. Push your code to a GitHub repository
2. Have a Digital Ocean account
3. Have an OpenAI API key

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

3. **Environment Variables** (IMPORTANT)
   - `PORT`: `8080` (automatically set)
   - `OPENAI_API_KEY`: Your OpenAI API key (add as a SECRET)
     - Go to your app's Settings → Environment Variables
     - Click "Edit"
     - Add `OPENAI_API_KEY` as the key
     - Paste your OpenAI API key as the value
     - Mark it as "Encrypt"
     - Click "Save"

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
- **Environment Variables**: 
  - `PORT`: 8080
  - `OPENAI_API_KEY`: (your secret key)

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
├── server.js            # Development API server
├── server-production.js # Production server (serves static + API)
├── .env                 # Local environment variables (not in git)
└── package.json         # Dependencies and scripts
```

## Key Features Explained

### Assessment Flow
- 12-question interactive questionnaire
- Progress tracking
- AI-generated personalized career report (PDF)
- Calendly booking integration
- PDF download after booking

### AI Report Generation
- Uses OpenAI GPT-4 to analyze assessment answers
- Generates personalized leadership development report
- Styled PDF with branding matching the app
- Includes: Executive Summary, Strengths, Development Areas, Action Items, Quick Wins, Roadmap, Resources

### Calendly Integration
- Custom UI wrapped around Calendly embed
- Seamless booking experience
- Automatic PDF download prompt after booking
- Mobile-optimized

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

- `OPENAI_API_KEY` (required): Your OpenAI API key for generating reports
- `PORT` (optional): Server port (defaults to 8080 in production, 3001 for dev API)

## Security Notes

- **NEVER commit `.env` file to git** (it's in `.gitignore`)
- API key is stored securely in Digital Ocean as an encrypted secret
- All API calls go through the backend server, not exposed to client

## Support

For questions or issues, please contact the development team.

## License

Private and confidential.
