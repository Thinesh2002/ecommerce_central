export const menuSections = [
  {
    title: "eBay Operations",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        subLinks: [
          { to: "/dashboard", label: "Main Dashboard" },
          { to: "/ebay-accounts", label: "Account Overview" },
        ],
      },
      {
        to: "/traffic-report-analysis",
        label: "Traffic Analysis",
        subLinks: [
          { to: "/traffic-report-analysis", label: "Report Panel" },
          { to: "/performance-tracker", label: "Performance Tracker" },
          { to: "/traffic-report-compare", label: "Traffic Compare" },
        ],
      },

      {
        to: "/ebay-template",
        label: "Template Generator",
        subLinks: [{ to: "/ebay-template", label: "HTML Generator" }],
      },
    ],
  },
  {
    title: "Research Center",
    items: [
      {
        to: "/keyword-analysis",
        label: "Keyword Analysis",
        subLinks: [
          { to: "/keyword-analysis", label: "Keyword Dashboard" },
          { to: "/advanced-keyword-research", label: "Advanced Research" },
          { to: "/seller-analysis", label: "Seller Research" },
        ],
      },
    ],
  },
  {
    title: "Registry & Access",
    items: [
      {
        to: "/ebay-accounts",
        label: "Channel Accounts",
        subLinks: [{ to: "/ebay-accounts", label: "Manage Accounts" }],
      },
      {
        to: "/team-dashboard",
        label: "Staff Profiles",
        subLinks: [
          { to: "/team-dashboard", label: "eBay Team Roster" },
          { to: "/register", label: "Create User Access" },
          { to: "/user-dashboard", label: "User Access List" },
        ],
      },
      {
        to: "/task-dashboard",
        label: "Task Dashboard",
        subLinks: [
          { to: "/task-dashboard", label: "Task Overview" },
          { to: "/create-task", label: "Create / Assign Task" },
        ],
      },
      {
        to: "/access-control",
        label: "Access Control",
        subLinks: [{ to: "/access-control", label: "Access Control" }],
      },
    ],
  },

];