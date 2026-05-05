import { ToolData } from './types';

export const prCalculatorData: ToolData = {
  id: 'pr-calculator',
  title: 'PR Score Calculator',
  description: 'Calculate your points for Australian Skilled Migration (189, 190, 491 visas).',
  steps: [
    {
      id: 'age',
      question: 'What is your age?',
      type: 'radio',
      options: [
        { label: '18 - 24 years', value: '18-24', points: 25 },
        { label: '25 - 32 years', value: '25-32', points: 30 },
        { label: '33 - 39 years', value: '33-39', points: 25 },
        { label: '40 - 44 years', value: '40-44', points: 15 },
        { label: '45 years or over', value: '45+', points: 0 },
      ],
    },
    {
      id: 'english',
      question: 'What is your English language proficiency?',
      description: 'Based on IELTS, PTE, or TOEFL results.',
      type: 'radio',
      options: [
        { label: 'Superior (IELTS 8+ / PTE 79+)', value: 'superior', points: 20 },
        { label: 'Proficient (IELTS 7+ / PTE 65+)', value: 'proficient', points: 10 },
        { label: 'Competent (IELTS 6+ / PTE 50+)', value: 'competent', points: 0 },
      ],
    },
    {
      id: 'employment_overseas',
      question: 'Skilled employment outside Australia (last 10 years)',
      type: 'radio',
      options: [
        { label: 'Less than 3 years', value: '0-3', points: 0 },
        { label: '3 - 4 years', value: '3-5', points: 5 },
        { label: '5 - 7 years', value: '5-8', points: 10 },
        { label: '8 - 10 years', value: '8-10', points: 15 },
      ],
    },
    {
      id: 'employment_au',
      question: 'Skilled employment in Australia (last 10 years)',
      type: 'radio',
      options: [
        { label: 'Less than 1 year', value: '0-1', points: 0 },
        { label: '1 - 2 years', value: '1-3', points: 5 },
        { label: '3 - 4 years', value: '3-5', points: 10 },
        { label: '5 - 7 years', value: '5-8', points: 15 },
        { label: '8 - 10 years', value: '8-10', points: 20 },
      ],
    },
    {
      id: 'education',
      question: 'What is your highest educational qualification?',
      type: 'radio',
      options: [
        { label: 'Doctorate (PhD)', value: 'phd', points: 20 },
        { label: "Bachelor's or Master's Degree", value: 'degree', points: 15 },
        { label: 'Diploma or Trade Qualification', value: 'diploma', points: 10 },
        { label: 'Other', value: 'other', points: 0 },
      ],
    },
    {
      id: 'study_au',
      question: 'Did you meet the Australian Study Requirement?',
      description: 'At least 2 academic years of study in Australia.',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes', points: 5 },
        { label: 'No', value: 'no', points: 0 },
      ],
    },
    {
      id: 'partner',
      question: 'What is your partner status?',
      type: 'radio',
      options: [
        { label: 'Single or Partner is AU Citizen/PR', value: 'single', points: 10 },
        { label: 'Partner has Skills Assessment & Competent English', value: 'skilled', points: 10 },
        { label: 'Partner has Competent English only', value: 'english', points: 5 },
        { label: 'None of the above', value: 'none', points: 0 },
      ],
    },
  ],
};
