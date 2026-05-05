import { ToolData } from './types';

export const visaQuizData: ToolData = {
  id: 'visa-quiz',
  title: 'Visa Suggestion Quiz',
  description: 'Tell us about your goals, and we\'ll suggest the most suitable visa subclasses.',
  steps: [
    {
      id: 'primary_goal',
      question: 'What is your primary goal for moving to Australia?',
      type: 'radio',
      options: [
        { label: 'To live and work permanently', value: 'permanent' },
        { label: 'To study at an Australian institution', value: 'study' },
        { label: 'To join my partner/spouse', value: 'partner' },
        { label: 'To start or invest in a business', value: 'business' },
        { label: 'Just for a holiday or short visit', value: 'visitor' },
      ],
    },
    {
      id: 'occupation',
      question: 'Do you have a skilled profession or trade?',
      description: 'Doctors, Engineers, IT Professionals, Electricians, etc.',
      type: 'radio',
      options: [
        { label: 'Yes, I am a highly skilled professional', value: 'skilled' },
        { label: 'I have some trade skills/experience', value: 'trade' },
        { label: 'I am currently a student', value: 'student' },
        { label: 'No specific skilled background', value: 'none' },
      ],
    },
    {
      id: 'funds',
      question: 'Do you have sufficient funds for your move?',
      description: 'Tuition fees, living expenses, or investment capital.',
      type: 'radio',
      options: [
        { label: 'Yes, I have significant savings/capital', value: 'high' },
        { label: 'I have enough for basic settlement', value: 'medium' },
        { label: 'I would need to work immediately', value: 'low' },
      ],
    },
    {
      id: 'partner_au',
      question: 'Do you have a partner who is an AU citizen or PR?',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  ],
};
