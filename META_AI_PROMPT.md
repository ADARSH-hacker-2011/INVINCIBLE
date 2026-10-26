# Production Prompt for Meta AI (Llama 3.3 / Meta AI)

Copy everything below the line and paste it directly into Meta AI:

---

Role: Principal Creative Director & Design Systems Architect for World-Class Robotics.
Task: Transform our FRC Team website from a "bulky, congested simulation tool" into a "luxurious, spacious, championship-grade robotics portal".

Context:
Our website for FRC Team 12364 (The Titanium Titans) currently feels too heavy and congested because telemetry sliders and simulation panels take up too much visual weight. We want the public page to feel open, spacious, and prestigious—like an Apple Keynote or the SpaceX Starship vehicle page.

Design Directives:
1. Spacing & Breathing Room:
   - Double the vertical padding between sections (use py-20 and py-28 instead of cramped py-10).
   - Constrain content to max-w-6xl with mx-auto and generous horizontal margins (px-6 md:px-14).
   - Use an asymmetric 2-column hero: Left side has bold typography and key metrics; Right side has a floating, 3D interactive robot model.
2. Typography Hierarchy:
   - Hero title: Ultra-large font-black tracking-tight text (text-5xl sm:text-7xl lg:text-8xl) with high-contrast gradient text overlays (e.g. from-cyan-400 via-indigo-300 to-pink-400).
   - Micro-labels: Use uppercase font-mono tracking-widest text-[10px] with subtle pill badges.
3. Dark Glassmorphism & Atmospheric Depth:
   - Soft ambient radial glows in the background using blur-[160px] with opacity-15 to create depth without visual noise.
   - Luxury cards: Use radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.25) 100%) with 1px border border-white/10 and rounded-3xl corners.
4. "Inventory / Engineering Access" UX:
   - How should the gateway look to feel intentional and prestigious?
   - Suggest the exact card styling, switch animation, and badge layout for unlocking the heavy engineering tools.
5. Output the recommended Tailwind CSS utility class combinations and design rules to make the website look world-class.
