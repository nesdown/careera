export const questions = [
  {
    id: 1,
    question: "What best describes your current management situation?",
    type: "radio",
    options: [
      "I was recently promoted to manager without management training",
      "I'm an IC (Individual Contributor) aspiring to become a manager",
      "I manage a small team and want to scale to bigger responsibilities",
      "I'm a mid-level manager seeking senior leadership roles",
      "I'm transitioning from technical lead to people manager",
    ],
  },
  {
    id: 2,
    question: "What's your biggest management challenge right now?",
    type: "radio",
    options: [
      "I don't know how to effectively lead and motivate my team",
      "Struggling with delegation and time management",
      "Difficult conversations and performance management",
      "Lack of executive presence and strategic thinking",
      "Balancing hands-on work with management duties",
    ],
  },
  {
    id: 3,
    question: "How many people do you currently manage (or aspire to)?",
    type: "radio",
    options: [
      "0 - I'm aspiring to become a manager",
      "1-3 direct reports",
      "4-8 direct reports",
      "9-15 direct reports",
      "15+ or multiple teams",
    ],
  },
  {
    id: 4,
    question: "What's your primary management goal?",
    type: "radio",
    options: [
      "Get my first management role",
      "Become a confident, effective people leader",
      "Scale from managing individuals to managing managers",
      "Move into senior management (Director/VP level)",
      "Build and lead high-performing teams",
    ],
  },
  {
    id: 5,
    question: "How long have you been in a management role?",
    type: "radio",
    options: [
      "Not yet - aspiring manager",
      "Less than 6 months",
      "6 months - 2 years",
      "2-5 years",
      "5+ years",
    ],
  },
  {
    id: 6,
    question: "What's holding you back from advancing in management?",
    type: "radio",
    options: [
      "Lack of formal management training or experience",
      "No clear path or roadmap for progression",
      "Imposter syndrome and lack of confidence",
      "Don't know how to demonstrate leadership impact",
      "Limited networking with senior leaders",
    ],
  },
  {
    id: 7,
    question: "How would you rate your current management skills?",
    type: "radio",
    options: [
      "Beginner - learning the basics",
      "Developing - have some experience but need guidance",
      "Competent - comfortable with core responsibilities",
      "Proficient - looking to scale to next level",
      "Expert - ready for executive leadership",
    ],
  },
  {
    id: 8,
    question: "What type of management position interests you most?",
    type: "radio",
    options: [
      "First-time manager / Team Lead",
      "Engineering Manager / Product Manager",
      "Senior Manager / Manager of Managers",
      "Director / Head of Department",
      "VP / Executive Leadership",
    ],
  },
  {
    id: 9,
    question: "What management skill do you most want to develop?",
    type: "radio",
    options: [
      "Strategic thinking and decision-making",
      "Team building and talent development",
      "Stakeholder management and influence",
      "Performance management and feedback",
      "Change management and organizational leadership",
    ],
  },
  {
    id: 10,
    question: "How much time can you dedicate to management development?",
    type: "radio",
    options: [
      "1-2 hours per week",
      "3-5 hours per week",
      "5-10 hours per week",
      "10+ hours per week - this is a priority",
      "Whatever it takes to succeed",
    ],
  },
  {
    id: 11,
    question: "What's your timeline for your next management milestone?",
    type: "radio",
    options: [
      "Within 3 months",
      "Within 6 months",
      "Within 1 year",
      "Within 2 years",
      "I'm exploring and not in a rush",
    ],
  },
  {
    id: 12,
    question: "What does success look like for you as a manager?",
    type: "textarea",
    placeholder: "E.g., 'Leading a team of 10+ engineers, influencing product strategy, mentoring future leaders, earning $200K+...'",
  },
];

export const roadmapPhases = [
  {
    id: 1,
    title: "Career Boost Plan",
    duration: "Week 1",
    description:
      "Based on your 5-minute assessment, we create a personalized career boost plan identifying exactly what you need to become a confident leader.",
    tasks: [
      "Complete leadership assessment questionnaire",
      "Analyze your management style and challenges",
      "Identify key gaps and growth opportunities",
      "Map your current state vs. leadership goals",
      "Create personalized career boost roadmap",
    ],
    outcomes: [
      "Clear roadmap to leadership",
      "Personalized action plan",
      "Understanding of your growth path",
    ],
    unlocked: true,
  },
  {
    id: 2,
    title: "Intro Call & Roadmap",
    duration: "Week 2",
    description:
      "1-on-1 session with your mentor to review your plan, discuss your specific situation, and map out your personalized leadership roadmap with clear milestones.",
    tasks: [
      "Review your career boost plan together",
      "Discuss your specific challenges and goals",
      "Map out 3-month roadmap with milestones",
      "Set up regular mentorship schedule",
    ],
    unlocked: false,
  },
  {
    id: 3,
    title: "Regular Mentorship",
    duration: "Ongoing (8-12 weeks)",
    description:
      "Weekly or bi-weekly 1-on-1 calls with your leadership mentor. We guide you through real challenges, build critical skills, hold you accountable, and help you achieve your goals.",
    tasks: [
      "Master delegation and feedback",
      "Navigate difficult conversations",
      "Build executive presence and influence",
      "Develop strategic thinking",
      "Position for promotion/bigger role",
    ],
    unlocked: false,
  },
];
