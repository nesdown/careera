export const questions = [
  {
    id: 1,
    question: "What's your current career stage?",
    type: "radio",
    options: [
      "Early Career (0-3 years)",
      "Mid-Level (4-8 years)",
      "Senior (9-15 years)",
      "Executive (15+ years)",
    ],
  },
  {
    id: 2,
    question: "What's your primary career goal?",
    type: "radio",
    options: [
      "Get promoted",
      "Switch industry/role",
      "Start own business",
      "Improve skills",
      "Increase income",
    ],
  },
  {
    id: 3,
    question: "Biggest challenge holding you back?",
    type: "textarea",
    placeholder: "Describe your main obstacle...",
  },
  {
    id: 4,
    question: "Career satisfaction (1-10)?",
    type: "radio",
    options: [
      "1-2 (Very Unsatisfied)",
      "3-4",
      "5-6 (Neutral)",
      "7-8",
      "9-10 (Very Satisfied)",
    ],
  },
  {
    id: 5,
    question: "Ideal career in 2-3 years?",
    type: "textarea",
    placeholder: "Paint your dream scenario...",
  },
  {
    id: 6,
    question: "Preferred learning style?",
    type: "radio",
    options: [
      "1-on-1 mentoring",
      "Group coaching",
      "Self-paced online",
      "Mix of all",
    ],
  },
  {
    id: 7,
    question: "Current industry or field?",
    type: "textarea",
    placeholder: "What industry are you in?",
  },
  {
    id: 8,
    question: "Key skills you want to develop?",
    type: "textarea",
    placeholder: "List 3-5 skills...",
  },
  {
    id: 9,
    question: "Timeline for career change?",
    type: "radio",
    options: [
      "Within 3 months",
      "3-6 months",
      "6-12 months",
      "1+ years",
    ],
  },
  {
    id: 10,
    question: "What motivates you most?",
    type: "radio",
    options: [
      "Money & stability",
      "Impact & purpose",
      "Recognition & status",
      "Freedom & flexibility",
    ],
  },
  {
    id: 11,
    question: "Biggest career win so far?",
    type: "textarea",
    placeholder: "Share your proudest moment...",
  },
  {
    id: 12,
    question: "What support do you need most?",
    type: "radio",
    options: [
      "Strategic guidance",
      "Skill development",
      "Network connections",
      "Confidence & mindset",
    ],
  },
];

export const roadmapPhases = [
  {
    id: 1,
    title: "Career Foundation Assessment",
    duration: "Week 1-2",
    description:
      "We'll conduct a comprehensive deep-dive into your professional profile. This isn't just another career assessment — it's a strategic audit that reveals your hidden strengths and untapped potential.",
    tasks: [
      "Complete detailed skills inventory across technical & soft skills",
      "Benchmark your market value against industry standards",
      "Map transferable skills to high-growth opportunities",
      "Craft your unique career brand positioning statement",
      "Identify your competitive advantages and differentiators",
      "Analyze gaps between current state and target role",
    ],
    outcomes: [
      "Clear understanding of your market value",
      "Documented skills portfolio",
      "Personal brand statement",
    ],
    unlocked: true,
  },
  {
    id: 2,
    title: "Strategic Goal Setting",
    duration: "Week 3-4",
    description:
      "Map out your exact career trajectory with measurable milestones and success metrics aligned with your aspirations.",
    tasks: [
      "Define 90-day objectives",
      "Set 6-month milestones",
      "Create accountability framework",
      "Establish KPIs for progress",
    ],
    unlocked: false,
  },
  {
    id: 3,
    title: "Skill Development Plan",
    duration: "Month 2-3",
    description:
      "Build the critical competencies needed to reach your next career level with a targeted learning roadmap.",
    tasks: [
      "Identify skill gaps",
      "Curate learning resources",
      "Schedule practice sessions",
      "Build portfolio projects",
    ],
    unlocked: false,
  },
  {
    id: 4,
    title: "Network Expansion Strategy",
    duration: "Month 3-4",
    description:
      "Connect with key industry players and build relationships that open doors to opportunities.",
    tasks: [
      "Map target connections",
      "Craft outreach templates",
      "Schedule networking calls",
      "Attend industry events",
    ],
    unlocked: false,
  },
  {
    id: 5,
    title: "Personal Brand Building",
    duration: "Month 4-5",
    description:
      "Establish your authority and visibility in your field through strategic content and positioning.",
    tasks: [
      "Optimize LinkedIn profile",
      "Create thought leadership content",
      "Build online presence",
      "Develop speaking opportunities",
    ],
    unlocked: false,
  },
  {
    id: 6,
    title: "Opportunity Execution",
    duration: "Month 5-6",
    description:
      "Put your plan into action with job applications, promotions, or business launches — fully supported.",
    tasks: [
      "Execute job search strategy",
      "Prepare for negotiations",
      "Practice interview skills",
      "Close on opportunities",
    ],
    unlocked: false,
  },
];
