# DECISIONS.md

## About the Project
SmashCity is a responsive, single-page web application for a premium urban burger shop. Built with React (Vite) and Tailwind CSS, the site is designed to deliver an immediate "wow" factor through a dark, cinematic aesthetic, heavy retro typography, and a vibrant neon palette. Per the challenge constraints, the site relies entirely on honest copywriting—no fake testimonials, no fabricated user metrics, just descriptive, appetite-inducing copy.

## 1. Architecture Strategy: Static Data over a Dynamic Backend
*Note: As this is a submission for Part 2 (Frontend), I am addressing data architecture instead of scraping ingestion.*

I chose a static, client-side data approach (structured JS arrays for menu items and locations) instead of the obvious alternative—standing up a headless CMS or a database backend like Supabase. I rejected the dynamic backend because a single-location burger shop's menu rarely changes, making the operational overhead of a database unnecessary. More importantly, serving content statically guarantees near-instant load times. The brief asks for a "wow" reaction in the first 3 seconds—every extra network round-trip for database queries risks losing that crucial window.

## 2. Trade-offs Under the Time Limit
To ship quickly and cleanly, I heavily leveraged Tailwind's built-in utility classes and CSS transitions (`group-hover:scale-105`, `duration-500`) for all micro-interactions rather than integrating a heavy animation library like Framer Motion or GSAP. While this kept the build fast and the bundle size small, the trade-off is a lack of complex, scroll-linked animations.

With a real week, my next investment would be adding a custom WebGL or cursor-tracking 3D hero element for the burger. That would be the single highest-leverage upgrade to the "wow" moment.

## 3. AI Usage & Verification
I used AI tools as an intelligent scaffolding assistant to bootstrap the Vite project, generate the baseline React component structure, and draft the initial block of Tailwind layouts. However, I did not blindly accept the output. Here is what I personally verified and reworked:

- **Component Refactoring:** The AI's initial pass produced highly duplicated JSX for the menu and showcase sections. I personally refactored `Menu.jsx`, `BurgerShowcase.jsx`, and `Footer.jsx` to be DRY, extracting reusable `MenuItemCard` and `BurgerCard` components and mapping over data arrays to ensure the code was scalable and easy to maintain.
- **Typography Optimization:** The AI originally attempted to load a chunky custom font via local `.ttf` files and complex `@font-face` rules. I ripped this out to simplify the architecture, replacing it with a robust Google Fonts import (`Bangers` and `Montserrat`) that guarantees cross-browser consistency and significantly reduces code complexity.
- **Honest Copywriting:** The AI initially defaulted to generic, exaggerated marketing speak. I completely rewrote the product copy to strictly satisfy the challenge's "no-fake-numbers" constraint, grounding every claim in specific product details (ingredients, cooking methods) instead of fabricated social proof.

## Note on the "Wow" Requirement
The brief frames the target reaction as *"wow, I want an account"*—which is SaaS-specific language. For a food brand, the equivalent conversion signal isn't a signup, it's appetite. I optimized the hero section for *"wow, I want this burger right now."* The CTAs are "See the Menu" and "Get One Now," because that is the honest, high-intent action a hungry visitor actually wants to take.
