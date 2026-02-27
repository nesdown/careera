// Questionnaire A: Deep Diagnostic Version
export const questionsA = [
  {
    id: 1,
    question: "What changed in your responsibilities when you became a manager — and what didn't change in how you operate?",
    type: "radio",
    options: [
      "I took on new responsibilities but still work mostly the same way I did as an individual contributor",
      "I manage people now, but I still do a lot of the technical/hands-on work myself",
      "I've shifted to planning and coordinating, but struggle to let go of execution details",
      "I've fundamentally changed how I spend my time - coaching, strategizing, and enabling others",
      "I'm not sure - it still feels blurry to me",
    ],
  },
  {
    id: 2,
    question: "When something goes wrong on your team, what is your first internal reaction?",
    type: "radio",
    options: [
      "I immediately think about how to fix it myself",
      "I wonder who dropped the ball and why they didn't catch it",
      "I ask myself what system or process failed",
      "I think about how to coach the person through solving it",
      "I assess the severity and decide whether to step in or let them handle it",
    ],
  },
  {
    id: 3,
    question: "What kind of feedback do you avoid giving?",
    type: "radio",
    options: [
      "Negative feedback - I worry about demotivating people or damaging relationships",
      "Feedback on soft skills, behavior, or emotional intelligence",
      "Feedback to high performers - they're doing great, why risk it?",
      "Feedback to senior or more experienced team members",
      "I don't avoid feedback - I address issues directly",
      "I avoid most feedback unless absolutely necessary",
    ],
  },
  {
    id: 4,
    question: "If you disappeared for 30 days, what would break?",
    type: "radio",
    options: [
      "Almost everything - I'm central to most decisions and workflows",
      "Key stakeholder relationships and strategic direction",
      "Some operational processes, but my team would mostly manage",
      "Very little - systems and people are set up to run independently",
      "Honestly, I'm not sure - I haven't thought about it this way",
    ],
  },
  {
    id: 5,
    question: "What do your 1:1s focus on most?",
    type: "radio",
    options: [
      "Task updates, blockers, and project status",
      "Performance feedback and what needs to improve",
      "Career development, goals, and growth opportunities",
      "A balanced mix depending on what the person needs that week",
      "Honestly, my 1:1s are inconsistent or feel unfocused",
    ],
  },
  {
    id: 6,
    question: "How often do you proactively redesign systems instead of optimizing tasks?",
    type: "radio",
    options: [
      "Rarely - I'm mostly focused on day-to-day execution",
      "Sometimes - when something breaks badly enough",
      "Regularly - I look for patterns and build processes to prevent recurring issues",
      "Constantly - I'm always thinking about how to scale and improve our operating model",
      "I'm not sure what you mean by 'redesigning systems'",
    ],
  },
  {
    id: 7,
    question: "Can you clearly articulate how your team's work connects to company-level strategy?",
    type: "radio",
    options: [
      "Not really - I focus on our team's goals, not the bigger picture",
      "Somewhat - I understand the connection but struggle to explain it clearly",
      "Yes - I can explain it to my team when asked",
      "Absolutely - I regularly connect our work to company strategy in team conversations",
      "I understand it personally but haven't made it explicit for my team",
    ],
  },
  {
    id: 8,
    question: "When prioritizing, what framework do you use?",
    type: "radio",
    options: [
      "I mostly go with my gut based on urgency and who's asking",
      "I use deadlines and stakeholder pressure as my guide",
      "I try to balance impact, effort, and strategic importance",
      "I have a clear framework (e.g., OKRs, impact/effort matrix, ICE scoring) that I consistently apply",
      "I struggle with prioritization - everything feels important",
    ],
  },
  {
    id: 9,
    question: "Who are your 3 most important stakeholders — and how do you intentionally manage those relationships?",
    type: "radio",
    options: [
      "I respond to whoever reaches out, but I don't proactively manage relationships",
      "I know who they are, but I mostly engage when there's a need",
      "I check in regularly and keep them updated on progress",
      "I have a deliberate strategy for each relationship - I know what they care about and manage expectations proactively",
      "I'm not sure who my most important stakeholders actually are",
    ],
  },
  {
    id: 10,
    question: "Who on your team is ready for more responsibility — and why?",
    type: "radio",
    options: [
      "I'm not sure - I haven't really assessed this",
      "I have a sense, but it's based on gut feel, not clear criteria",
      "I can name 1-2 people and describe what they've demonstrated",
      "I have a clear development plan for multiple people and know exactly what would prove they're ready",
      "Everyone on my team is performing at their current level - no one is ready for more yet",
    ],
  },
  {
    id: 11,
    question: "What is the biggest behavior you currently tolerate that you shouldn't?",
    type: "radio",
    options: [
      "Missed deadlines or inconsistent quality",
      "Poor communication or lack of collaboration",
      "Negative attitude, complaining, or low morale",
      "Someone not pulling their weight or creating extra work for others",
      "Honestly, I'm probably too lenient across the board",
      "I don't tolerate anything I shouldn't - I address issues quickly",
    ],
  },
  {
    id: 12,
    question: "What do you believe is the real reason you haven't reached the next leadership level yet?",
    type: "radio",
    options: [
      "I don't have enough experience or time in my current role",
      "I'm not sure what the next level requires or how to demonstrate readiness",
      "I need to develop specific skills (strategy, communication, influence, etc.)",
      "I haven't made my impact visible enough to the right people",
      "I'm already operating at the next level - I'm ready for promotion",
      "There are organizational constraints (budget, headcount, structure) beyond my control",
      "Honestly, I'm not sure - that's what I'm here to figure out",
    ],
  },
];

// Questionnaire B: Structured Qualification Version
export const questionsB = [
  {
    id: 1,
    question: "What best describes your current management situation?",
    type: "radio",
    options: [
      "I'm a new manager (less than 6 months in role)",
      "I'm an experienced manager looking to level up (6 months - 2 years)",
      "I'm a senior manager preparing for leadership roles (2+ years)",
      "I'm aspiring to become a manager soon",
      "I'm a manager returning after a break or career change",
    ],
  },
  {
    id: 2,
    question: "How many people do you currently manage (or aspire to)?",
    type: "radio",
    options: [
      "1-3 people",
      "4-7 people",
      "8-15 people",
      "16+ people",
      "None yet (aspiring manager)",
    ],
  },
  {
    id: 3,
    question: "What's your primary management goal?",
    type: "radio",
    options: [
      "Build confidence and foundational management skills",
      "Improve team performance and accountability",
      "Develop strategic thinking and influence beyond my team",
      "Prepare for promotion to senior leadership",
      "Fix a specific challenge I'm struggling with",
      "Transition from technical expert to effective people leader",
    ],
  },
  {
    id: 4,
    question: "When something goes wrong on your team, what is your first internal reaction?",
    type: "radio",
    options: [
      "I immediately think about how to fix it myself",
      "I wonder who dropped the ball and why they didn't catch it",
      "I ask myself what system or process failed",
      "I think about how to coach the person through solving it",
      "I assess the severity and decide whether to step in or let them handle it",
    ],
  },
  {
    id: 5,
    question: "What kind of feedback do you avoid giving (or worry about giving)?",
    type: "radio",
    options: [
      "Negative feedback - I worry about demotivating people or damaging relationships",
      "Feedback on soft skills, behavior, or emotional intelligence",
      "Feedback to high performers - they're doing great, why risk it?",
      "Feedback to senior or more experienced team members",
      "I don't avoid feedback - I address issues directly",
      "I avoid most feedback unless absolutely necessary",
    ],
  },
  {
    id: 6,
    question: "If you disappeared for 30 days, what would break?",
    type: "radio",
    options: [
      "Almost everything - I'm central to most decisions and workflows",
      "Key stakeholder relationships and strategic direction",
      "Some operational processes, but my team would mostly manage",
      "Very little - systems and people are set up to run independently",
      "Honestly, I'm not sure - I haven't thought about it this way",
    ],
  },
  {
    id: 7,
    question: "What do your 1:1s focus on most?",
    type: "radio",
    options: [
      "Task updates, blockers, and project status",
      "Performance feedback and what needs to improve",
      "Career development, goals, and growth opportunities",
      "A balanced mix depending on what the person needs that week",
      "Honestly, my 1:1s are inconsistent or feel unfocused",
      "I don't have 1:1s yet (aspiring manager)",
    ],
  },
  {
    id: 8,
    question: "Can you clearly articulate how your team's work connects to company-level strategy?",
    type: "radio",
    options: [
      "Not really - I focus on our team's goals, not the bigger picture",
      "Somewhat - I understand the connection but struggle to explain it clearly",
      "Yes - I can explain it to my team when asked",
      "Absolutely - I regularly connect our work to company strategy in team conversations",
      "I understand it personally but haven't made it explicit for my team",
      "Not applicable yet (aspiring manager)",
    ],
  },
  {
    id: 9,
    question: "When prioritizing work, what guides your decisions?",
    type: "radio",
    options: [
      "Urgency and whoever is asking loudest",
      "Deadlines and stakeholder pressure",
      "I try to balance impact, effort, and strategic importance",
      "I have a clear framework (e.g., OKRs, impact/effort matrix) that I consistently apply",
      "I struggle with prioritization - everything feels important",
    ],
  },
  {
    id: 10,
    question: "Who on your team is ready for more responsibility — and why?",
    type: "radio",
    options: [
      "I'm not sure - I haven't really assessed this",
      "I have a sense, but it's based on gut feel, not clear criteria",
      "I can name 1-2 people and describe what they've demonstrated",
      "I have a clear development plan for multiple people and know exactly what would prove they're ready",
      "Everyone is performing at their current level - no one is ready for more yet",
      "Not applicable yet (aspiring manager)",
    ],
  },
  {
    id: 11,
    question: "What's holding you back from advancing in management?",
    type: "radio",
    options: [
      "Lack of confidence or imposter syndrome",
      "Missing specific skills (delegation, feedback, strategy, etc.)",
      "Not enough time or too overwhelmed with current responsibilities",
      "Unclear path or no one guiding my development",
      "Organizational constraints (no promotion opportunities, budget, etc.)",
      "I'm not sure - that's what I'm trying to figure out",
    ],
  },
  {
    id: 12,
    question: "How much time can you realistically dedicate to management development each week?",
    type: "radio",
    options: [
      "30 minutes or less (I'm extremely busy)",
      "1-2 hours (I can carve out focused time)",
      "3-4 hours (This is a priority for me)",
      "5+ hours (I'm all-in on my development)",
      "I'm flexible - depends on what's needed",
    ],
  },
];

// Function to randomly select a questionnaire variant (50/50 split)
export function getQuestionnaireVariant() {
  // Variant A is the deep diagnostic — default for all users
  // Keeping session storage for analytics continuity
  sessionStorage.setItem('questionnaireVariant', 'A');
  return 'A';
}

// Get the active questions based on variant
export function getActiveQuestions() {
  const variant = getQuestionnaireVariant();
  return variant === 'A' ? questionsA : questionsB;
}

// Legacy export for backward compatibility
export const questions = questionsA;

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
