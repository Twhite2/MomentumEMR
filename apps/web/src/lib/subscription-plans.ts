// Single source of truth for subscription plans
// In a production app, you'd store these in a database table
export let subscriptionPlans = [
  {
    id: 1,
    name: 'Basic',
    price: 50000,
    interval: 'monthly' as const,
    features: [
      'Up to 100 patients',
      'Basic EMR features',
      'Email support',
      '5 staff accounts',
      'Basic analytics',
    ],
    active: true,
  },
  {
    id: 2,
    name: 'Standard',
    price: 120000,
    interval: 'monthly' as const,
    features: [
      'Up to 500 patients',
      'Full EMR features',
      'Priority email support',
      '20 staff accounts',
      'Advanced analytics',
      'Lab integration',
      'Pharmacy management',
    ],
    active: true,
  },
  {
    id: 3,
    name: 'Premium',
    price: 250000,
    interval: 'monthly' as const,
    features: [
      'Unlimited patients',
      'All features included',
      '24/7 phone & email support',
      'Unlimited staff accounts',
      'Custom analytics',
      'Full integrations',
      'API access',
      'White-label option',
      'Dedicated account manager',
    ],
    active: true,
  },
];
