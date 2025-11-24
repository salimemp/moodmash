/**
 * Support Resources Database
 * Crisis hotlines, therapy finders, self-help guides
 * Version: 9.0.0
 */

export interface SupportResource {
  id: string;
  type: 'crisis_hotline' | 'therapy_finder' | 'self_help_guide' | 'article' | 'video' | 'breathing_exercise' | 'emergency_contact' | 'community_group';
  title: string;
  description: string;
  url?: string;
  phone?: string;
  available?: string;
  country?: string;
  language?: string[];
  tags?: string[];
}

export const crisisHotlines: SupportResource[] = [
  // International
  {
    id: '988-us',
    type: 'crisis_hotline',
    title: '988 Suicide & Crisis Lifeline (USA)',
    description: '24/7 free and confidential support for people in distress',
    phone: '988',
    url: 'https://988lifeline.org/',
    available: '24/7',
    country: 'United States',
    language: ['English', 'Spanish'],
    tags: ['suicide', 'crisis', 'mental health']
  },
  {
    id: 'samaritans-uk',
    type: 'crisis_hotline',
    title: 'Samaritans (UK)',
    description: 'Emotional support to anyone in emotional distress',
    phone: '116 123',
    url: 'https://www.samaritans.org/',
    available: '24/7',
    country: 'United Kingdom',
    language: ['English'],
    tags: ['suicide', 'crisis', 'emotional support']
  },
  {
    id: 'lifeline-au',
    type: 'crisis_hotline',
    title: 'Lifeline (Australia)',
    description: '24-hour crisis support and suicide prevention',
    phone: '13 11 14',
    url: 'https://www.lifeline.org.au/',
    available: '24/7',
    country: 'Australia',
    language: ['English'],
    tags: ['suicide', 'crisis', 'mental health']
  },
  {
    id: 'crisis-services-canada',
    type: 'crisis_hotline',
    title: 'Crisis Services Canada',
    description: 'Nationwide crisis support and suicide prevention',
    phone: '1-833-456-4566',
    url: 'https://www.crisisservicescanada.ca/',
    available: '24/7',
    country: 'Canada',
    language: ['English', 'French'],
    tags: ['suicide', 'crisis', 'mental health']
  },
  {
    id: 'nami-helpline',
    type: 'crisis_hotline',
    title: 'NAMI HelpLine (USA)',
    description: 'Information, resource referrals and support',
    phone: '1-800-950-NAMI (6264)',
    url: 'https://www.nami.org/help',
    available: 'Mon-Fri 10am-10pm ET',
    country: 'United States',
    language: ['English'],
    tags: ['mental health', 'support', 'resources']
  },
  {
    id: 'crisis-text-line',
    type: 'crisis_hotline',
    title: 'Crisis Text Line',
    description: 'Text-based crisis support',
    phone: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org/',
    available: '24/7',
    country: 'United States',
    language: ['English'],
    tags: ['crisis', 'text support', 'mental health']
  }
];

export const therapyFinders: SupportResource[] = [
  {
    id: 'psychology-today',
    type: 'therapy_finder',
    title: 'Psychology Today Therapist Finder',
    description: 'Find therapists, psychiatrists, and treatment centers',
    url: 'https://www.psychologytoday.com/us/therapists',
    country: 'United States',
    language: ['English'],
    tags: ['therapy', 'counseling', 'psychiatry']
  },
  {
    id: 'betterhelp',
    type: 'therapy_finder',
    title: 'BetterHelp',
    description: 'Online counseling and therapy',
    url: 'https://www.betterhelp.com/',
    country: 'International',
    language: ['English', 'Spanish'],
    tags: ['online therapy', 'counseling', 'telehealth']
  },
  {
    id: 'talkspace',
    type: 'therapy_finder',
    title: 'Talkspace',
    description: 'Online therapy and psychiatry',
    url: 'https://www.talkspace.com/',
    country: 'United States',
    language: ['English'],
    tags: ['online therapy', 'psychiatry', 'telehealth']
  },
  {
    id: 'open-path',
    type: 'therapy_finder',
    title: 'Open Path Collective',
    description: 'Affordable therapy ($30-$80 per session)',
    url: 'https://openpathcollective.org/',
    country: 'United States',
    language: ['English'],
    tags: ['affordable therapy', 'low cost', 'counseling']
  }
];

export const selfHelpGuides: SupportResource[] = [
  {
    id: 'nhs-mental-health',
    type: 'self_help_guide',
    title: 'NHS Mental Health Resources',
    description: 'Self-help guides for anxiety, depression, and more',
    url: 'https://www.nhs.uk/mental-health/self-help/',
    country: 'United Kingdom',
    language: ['English'],
    tags: ['self-help', 'anxiety', 'depression', 'guides']
  },
  {
    id: 'mindful',
    type: 'self_help_guide',
    title: 'Mindful.org Meditation Guides',
    description: 'Free meditation and mindfulness resources',
    url: 'https://www.mindful.org/meditation/',
    country: 'International',
    language: ['English'],
    tags: ['meditation', 'mindfulness', 'self-help']
  },
  {
    id: 'headspace-meditation',
    type: 'self_help_guide',
    title: 'Headspace Free Resources',
    description: 'Meditation exercises and mental health articles',
    url: 'https://www.headspace.com/meditation',
    country: 'International',
    language: ['English'],
    tags: ['meditation', 'mental health', 'mindfulness']
  }
];

export const breathingExercises: SupportResource[] = [
  {
    id: '4-7-8-breathing',
    type: 'breathing_exercise',
    title: '4-7-8 Breathing Technique',
    description: 'Breathe in for 4, hold for 7, exhale for 8. Reduces anxiety quickly.',
    tags: ['breathing', 'anxiety', 'relaxation', 'quick relief']
  },
  {
    id: 'box-breathing',
    type: 'breathing_exercise',
    title: 'Box Breathing',
    description: 'Breathe in 4, hold 4, out 4, hold 4. Used by Navy SEALs for stress.',
    tags: ['breathing', 'stress', 'focus', 'calm']
  },
  {
    id: 'belly-breathing',
    type: 'breathing_exercise',
    title: 'Diaphragmatic (Belly) Breathing',
    description: 'Deep breathing from the diaphragm to activate relaxation response.',
    tags: ['breathing', 'relaxation', 'deep breathing']
  }
];

export const communityGroups: SupportResource[] = [
  {
    id: 'depression-support-group',
    type: 'community_group',
    title: 'Depression and Bipolar Support Alliance',
    description: 'Peer support groups across the United States',
    url: 'https://www.dbsalliance.org/',
    country: 'United States',
    language: ['English'],
    tags: ['depression', 'bipolar', 'peer support', 'community']
  },
  {
    id: 'anxiety-online-support',
    type: 'community_group',
    title: 'Anxiety and Depression Association of America',
    description: 'Online support groups and resources',
    url: 'https://adaa.org/finding-help/getting-support',
    country: 'United States',
    language: ['English'],
    tags: ['anxiety', 'depression', 'online support', 'community']
  },
  {
    id: '7-cups',
    type: 'community_group',
    title: '7 Cups',
    description: 'Free emotional support through trained listeners',
    url: 'https://www.7cups.com/',
    country: 'International',
    language: ['English', 'Spanish', 'French', 'German'],
    tags: ['peer support', 'emotional support', 'online', 'free']
  }
];

export const mentalHealthArticles: SupportResource[] = [
  {
    id: 'understanding-depression',
    type: 'article',
    title: 'Understanding Depression',
    description: 'Comprehensive guide to recognizing and managing depression',
    url: 'https://www.nimh.nih.gov/health/topics/depression',
    tags: ['depression', 'education', 'mental health']
  },
  {
    id: 'coping-with-anxiety',
    type: 'article',
    title: 'Coping with Anxiety',
    description: 'Evidence-based strategies for managing anxiety',
    url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
    tags: ['anxiety', 'coping', 'mental health']
  },
  {
    id: 'sleep-mental-health',
    type: 'article',
    title: 'Sleep and Mental Health',
    description: 'The connection between sleep quality and emotional wellbeing',
    url: 'https://www.sleepfoundation.org/mental-health',
    tags: ['sleep', 'mental health', 'wellbeing']
  }
];

export const allSupportResources = [
  ...crisisHotlines,
  ...therapyFinders,
  ...selfHelpGuides,
  ...breathingExercises,
  ...communityGroups,
  ...mentalHealthArticles
];

// Helper function to search resources
export function searchResources(query: string, resources: SupportResource[] = allSupportResources): SupportResource[] {
  const lowerQuery = query.toLowerCase();
  return resources.filter(resource => 
    resource.title.toLowerCase().includes(lowerQuery) ||
    resource.description.toLowerCase().includes(lowerQuery) ||
    resource.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Helper function to filter by type
export function filterByType(type: string, resources: SupportResource[] = allSupportResources): SupportResource[] {
  return resources.filter(resource => resource.type === type);
}

// Helper function to filter by country
export function filterByCountry(country: string, resources: SupportResource[] = allSupportResources): SupportResource[] {
  return resources.filter(resource => resource.country === country || resource.country === 'International');
}
