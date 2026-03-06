## Packages
recharts | Dashboard analytics and data visualization
react-markdown | Rendering smart insights from the AI
date-fns | Date formatting and manipulation

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}

Amounts are stored in cents in the database. The frontend handles converting to and from decimal values for display and user input.
