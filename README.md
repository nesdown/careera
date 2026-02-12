# Careera - Career Development Platform

An exact copy of the Careera career development SaaS application with all features and functionality.

## Features

✅ **Landing Page**
- Hero section with embedded questionnaire widget
- Social proof statistics (5,000+ transformations, 500+ mentors, 94% success rate)
- 3-step journey visualization
- Results metrics with animated progress bars
- Methodology section with 4 key differentiators
- Multiple CTAs throughout
- Professional footer

✅ **12-Question Career Assessment**
- 8 radio button questions (multiple choice)
- 4 textarea questions (long-form responses)
- Progress tracking with animated bar
- Smooth question transitions
- Answer validation
- Back/forward navigation

✅ **Completion & Roadmap**
- Thank you page with next steps
- 6-month personalized roadmap preview
- Phase 1 unlocked (preview)
- Phases 2-6 locked with blur effect
- Paywall modal for full roadmap unlock

✅ **Calendly Integration**
- $29.99 career boost call booking
- Inline Calendly widget modal
- 30-minute strategy session

✅ **Design System**
- Dark theme (#0a0a0a background)
- Zinc grayscale palette
- Smooth Framer Motion animations
- Responsive design (mobile-first)
- Professional UI components

## Tech Stack

- **Framework:** React 18 with Vite
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS v3
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Build Tool:** Vite 7

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` (or next available port)

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Fixed navigation bar with progress
│   ├── QuestionnaireWidget.jsx # Embedded preview widget
│   ├── CompletionPage.jsx      # Thank you + roadmap preview
│   └── CalendlyModal.jsx       # Booking modal
├── pages/
│   ├── Home.jsx                # Landing page
│   └── Questionnaire.jsx       # Full questionnaire flow
├── data/
│   └── questions.js            # All 12 questions + roadmap data
├── App.jsx                     # Router setup
├── main.jsx                    # React entry point
└── index.css                   # Tailwind + global styles
```

## Key Pages

### Landing Page (`/`)
The main marketing page with:
- Hero with questionnaire preview
- Social proof stats
- 3-step process
- Results metrics
- Methodology
- Final CTA

### Questionnaire (`/Questionnaire`)
Full 12-question assessment with:
- Progress tracking
- Smooth transitions
- Answer validation
- Completion flow

## Configuration Files

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `vite.config.js` - Vite build configuration

## Features in Detail

### Questionnaire Questions
1. Career stage (radio - 4 options)
2. Primary goal (radio - 5 options)
3. Biggest challenge (textarea)
4. Career satisfaction (radio - 5 options)
5. Ideal career vision (textarea)
6. Learning style (radio - 4 options)
7. Current industry (textarea)
8. Skills to develop (textarea)
9. Timeline (radio - 4 options)
10. Motivation (radio - 4 options)
11. Career win (textarea)
12. Support needed (radio - 4 options)

### Roadmap Phases
1. **Career Foundation Assessment** (Week 1-2) - Unlocked preview
2. **Strategic Goal Setting** (Week 3-4) - Locked
3. **Skill Development Plan** (Month 2-3) - Locked
4. **Network Expansion Strategy** (Month 3-4) - Locked
5. **Personal Brand Building** (Month 4-5) - Locked
6. **Opportunity Execution** (Month 5-6) - Locked

### Animations
- Fade in on scroll (Framer Motion)
- Stagger children animations
- Hover effects on cards
- Progress bar fills
- Smooth page transitions

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Stacked layouts on mobile
- Grid layouts on desktop

## Color Palette

- **Background:** `#0a0a0a` (near black)
- **Zinc 900:** `#18181b` (cards)
- **Zinc 800:** `#27272a` (borders)
- **Zinc 700:** `#3f3f46` (hover states)
- **Zinc 400:** `#a1a1aa` (secondary text)
- **White:** `#ffffff` (primary text & CTAs)
- **Green 500:** `#22c55e` (success indicators)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- This is an exact replica of the original Careera application
- All content, features, and design match the source
- Calendly URL can be updated in `CalendlyModal.jsx`
- Questions data can be modified in `src/data/questions.js`

## License

Private project - All rights reserved
