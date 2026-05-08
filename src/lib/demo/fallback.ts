export const demoVault = {
  id: "demo-vault",
  name: "Decision Neuroscience Vault",
  description: "Governed project context for neuroscience analysis plans, scripts, notes, and public summaries.",
  team: { name: "Smith Lab" },
  projects: [
    {
      id: "demo-adview",
      name: "AdView Gambling Ads",
      slug: "adview-gambling-ads",
      description: "fMRI study of neural responses to gambling-related advertising versus control advertising.",
      documents: [
        {
          id: "demo-prereg",
          title: "AdView Preregistration",
          documentType: "PREREGISTRATION",
          authorityStatus: "AUTHORITATIVE",
          visibility: "COLLABORATOR",
          isMcpExposed: true,
        },
        {
          id: "demo-plan",
          title: "Analysis Plan",
          documentType: "ANALYSIS_PLAN",
          authorityStatus: "AUTHORITATIVE",
          visibility: "ANALYST",
          isMcpExposed: true,
        },
        {
          id: "demo-readme",
          title: "FSL Model README",
          documentType: "README",
          authorityStatus: "SUPPORTING",
          visibility: "ANALYST",
          isMcpExposed: true,
        },
        {
          id: "demo-notes",
          title: "Lab Meeting Notes April 2026",
          documentType: "MEETING_NOTE",
          authorityStatus: "SUPPORTING",
          visibility: "PI_ONLY",
          isMcpExposed: false,
        },
        {
          id: "demo-public",
          title: "Public Summary",
          documentType: "PUBLIC_SUMMARY",
          authorityStatus: "AUTHORITATIVE",
          visibility: "PUBLIC",
          isMcpExposed: true,
        },
      ],
    },
  ],
};

export const demoRetrievalLogs = [
  {
    id: "demo-log-1",
    query: "Why did we use Welch's t-test?",
    project: { name: "AdView Gambling Ads" },
    createdAt: new Date(),
  },
  {
    id: "demo-log-2",
    query: "Give me the latest approved public-safe summary.",
    project: { name: "AdView Gambling Ads" },
    createdAt: new Date(),
  },
];
