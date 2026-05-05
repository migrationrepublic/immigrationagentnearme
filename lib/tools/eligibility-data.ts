import { ToolData } from './types';

export const eligibilityData: ToolData = {
  id: 'eligibility-checker',
  title: 'Eligibility Checker',
  description: 'Find out if you meet the basic requirements to migrate to Australia.',
  steps: [
    {
      id: 'passport',
      question: 'Do you hold a valid passport?',
      type: 'radio',
      options: [
        { label: 'Yes, and it has more than 6 months validity', value: 'yes-valid' },
        { label: 'Yes, but it expires soon', value: 'yes-expiring' },
        { label: 'No, I need to apply for one', value: 'no' },
      ],
    },
    {
      id: 'age_limit',
      question: 'Are you under 45 years of age?',
      description: 'Most skilled migration visas have an age limit of 45.',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    {
      id: 'english_test',
      question: 'Have you taken an English test (IELTS, PTE, etc.)?',
      type: 'radio',
      options: [
        { label: 'Yes, and I have my results', value: 'yes-results' },
        { label: 'No, but I am planning to', value: 'no-planned' },
        { label: 'No, and I don\'t think I need to', value: 'no' },
      ],
    },
    {
      id: 'skills_assessment',
      question: 'Do you have a qualification in a skilled occupation?',
      description: 'Example: Engineering, IT, Nursing, Trades, etc.',
      type: 'radio',
      options: [
        { label: 'Yes, in my home country', value: 'yes-home' },
        { label: 'Yes, from Australia', value: 'yes-au' },
        { label: 'No formal qualification', value: 'no' },
      ],
    },
    {
      id: 'character',
      question: 'Do you have a clean criminal record?',
      type: 'radio',
      options: [
        { label: 'Yes, I have no convictions', value: 'yes' },
        { label: 'I have some minor traffic offenses', value: 'minor' },
        { label: 'No, I have a criminal record', value: 'no' },
      ],
    },
  ],
};
