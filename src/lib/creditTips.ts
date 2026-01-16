export interface CreditTip {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: 'payment' | 'utilization' | 'history' | 'mix' | 'inquiry' | 'monitor';
}

export function getCreditTips(score: number): CreditTip[] {
  if (score >= 800) {
    // Excellent
    return [
      {
        title: 'Maintain Your Excellent Score',
        description: 'Continue making on-time payments and keeping your credit utilization low.',
        priority: 'low',
        icon: 'payment',
      },
      {
        title: 'Monitor for Fraud',
        description: 'With excellent credit, you\'re a target for identity theft. Consider a credit monitoring service.',
        priority: 'medium',
        icon: 'monitor',
      },
      {
        title: 'Keep Old Accounts Open',
        description: 'Your long credit history is valuable. Avoid closing your oldest accounts.',
        priority: 'low',
        icon: 'history',
      },
    ];
  } else if (score >= 750) {
    // Very Good
    return [
      {
        title: 'You\'re Almost There',
        description: 'A few more months of consistent behavior could push you into the excellent range.',
        priority: 'low',
        icon: 'payment',
      },
      {
        title: 'Optimize Credit Utilization',
        description: 'Try to keep your credit utilization below 10% for maximum score impact.',
        priority: 'medium',
        icon: 'utilization',
      },
      {
        title: 'Avoid New Credit Applications',
        description: 'Each hard inquiry can temporarily lower your score. Only apply when necessary.',
        priority: 'low',
        icon: 'inquiry',
      },
    ];
  } else if (score >= 670) {
    // Good
    return [
      {
        title: 'Pay Bills on Time',
        description: 'Payment history is the most important factor. Set up autopay to never miss a due date.',
        priority: 'high',
        icon: 'payment',
      },
      {
        title: 'Reduce Credit Card Balances',
        description: 'Aim to use less than 30% of your available credit across all cards.',
        priority: 'high',
        icon: 'utilization',
      },
      {
        title: 'Build Credit History',
        description: 'Keep your oldest accounts open and active to strengthen your credit age.',
        priority: 'medium',
        icon: 'history',
      },
      {
        title: 'Consider Credit Mix',
        description: 'Having different types of credit (cards, loans) can help your score.',
        priority: 'low',
        icon: 'mix',
      },
    ];
  } else if (score >= 580) {
    // Fair
    return [
      {
        title: 'Make Every Payment on Time',
        description: 'Even one missed payment can significantly hurt your score. Set up reminders or autopay.',
        priority: 'high',
        icon: 'payment',
      },
      {
        title: 'Pay Down High Balances',
        description: 'High credit utilization is likely hurting your score. Focus on paying down balances.',
        priority: 'high',
        icon: 'utilization',
      },
      {
        title: 'Check Your Credit Report',
        description: 'Review your report for errors. Disputing inaccuracies can improve your score.',
        priority: 'high',
        icon: 'monitor',
      },
      {
        title: 'Avoid New Credit Applications',
        description: 'Focus on improving your current accounts before applying for new credit.',
        priority: 'medium',
        icon: 'inquiry',
      },
    ];
  } else {
    // Poor
    return [
      {
        title: 'Prioritize On-Time Payments',
        description: 'Start rebuilding by making all payments on time. This is the #1 factor in your score.',
        priority: 'high',
        icon: 'payment',
      },
      {
        title: 'Address Past-Due Accounts',
        description: 'Contact creditors to set up payment plans for any accounts in collections.',
        priority: 'high',
        icon: 'payment',
      },
      {
        title: 'Reduce Debt Aggressively',
        description: 'Focus on paying down balances. Consider the debt avalanche or snowball method.',
        priority: 'high',
        icon: 'utilization',
      },
      {
        title: 'Consider a Secured Credit Card',
        description: 'A secured card can help rebuild credit when used responsibly.',
        priority: 'medium',
        icon: 'mix',
      },
      {
        title: 'Dispute Credit Report Errors',
        description: 'Get your free annual credit report and dispute any inaccurate information.',
        priority: 'high',
        icon: 'monitor',
      },
    ];
  }
}

export function getScoreRating(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 800) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-500' };
  if (score >= 750) return { label: 'Very Good', color: 'text-green-500', bgColor: 'bg-green-400' };
  if (score >= 670) return { label: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500' };
  if (score >= 580) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
  return { label: 'Poor', color: 'text-red-500', bgColor: 'bg-red-500' };
}
