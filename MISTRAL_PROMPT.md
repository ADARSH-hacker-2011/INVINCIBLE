# Production Prompt for Mistral (Codestral / Mistral Large)

Copy everything below the line and paste it directly into Mistral:

---

Role: Senior Frontend & Robotics UI Engineer for FRC Team 12364 (The Titanium Titans).
Task: Write a clean, production-ready, single-file React 19 + TypeScript component:
File: src/components/TeamShowcasePortal.tsx

Context:
You are building the official championship website for FRC Team 12364. It must look sleek, vibrant, classy, and spacious (inspired by Apple, SpaceX, and Argos robotics platforms). It must NOT look like a cluttered engineering dashboard. The heavy simulation and tools are hidden behind an interactive "Team Inventory" toggle.

Design Tokens & CSS Variables to use:
- Backgrounds: var(--bg), var(--bg-elevated), var(--panel)
- Borders: var(--border), var(--border-bright)
- Text: var(--text), var(--muted), var(--faint)
- Accents: var(--accent), var(--accent-lite), var(--accent-glow)
- Status: var(--success), var(--warning), var(--danger)

Requirements (Pure TypeScript, Zero Stubs):
1. Top Navigation Bar:
   - Team 12364 emblem with subtle pulsing status light
   - Nav links: "ROBOT 2027", "SUBSYSTEMS", "INVENTORY", "PARTNERS"
   - Quick Theme switcher pill (Argos, Midnight, Ocean, Ember)
   - Action Button: "📦 ACCESS INVENTORY & LAB" with an arrow icon
2. Hero Section:
   - Headline: "Championship Robotics, Engineered for Dominance."
   - Subtitle: "Official web portal of FRC Team 12364. Designed with 200Hz deterministic swerve kinematics, real-time WPILib telemetry, and precision autonomous navigation."
   - 4 Live Metric Cards: "4.8 m/s (Kraken X60 FOC)", "200 Hz (Deterministic)", "50 Hz (WPILib Loop)", "13 Tools (Native Exes)"
   - Embed the 3D robot canvas: <RobotModelCanvas alliance={alliance} teamNumber="12364" />
3. Subsystem Spotlight Cards (Spacious, 2-column grid):
   - SDS MK4i L3 Swerve (4x Kraken X60, CANcoder 14-bit absolute, μ=1.15 carpet friction)
   - Cascading Rigged Elevator (Dual-stage continuous, dynamic CoM restitution)
   - Precision Flywheel Shooter (Twin 4" wheels, RK4 aerodynamic predictor, Magnus effect)
   - Quad AprilTag 3D Vision (PhotonVision, solvePnP, 20ms timestamp latency queue)
4. The "Team Inventory & Simulation Lab" Gateway Card:
   - High-security aerospace styling with a clickable toggle checkbox:
     [ ] "Enable Engineering Inventory & Simulation Mode"
   - Ticking it or clicking the lock icon triggers `onEnterInventory()` to unveil the full simulation backend.
   - List tags of available tools: Glass.exe, AdvantageScope, Shuffleboard, SysId, Monte Carlo 100Hz, Wokwi CANdle.
5. Footer:
   - Clean footer attributing FIRST Robotics Competition and technology partners.

Props Interface:
export interface TeamShowcasePortalProps {
  onEnterInventory: () => void;
  teamNumber?: string;
  teamName?: string;
}

Strict Rules:
- Pure TypeScript, 0 unused imports from 'lucide-react', zero placeholders or TODO comments.
- Export: export function TeamShowcasePortal(props: TeamShowcasePortalProps)
