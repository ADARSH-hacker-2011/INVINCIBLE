# META AI MASTER PROMPT: FRC GOD PLATFORM 2027 UNIFIED UI/UX ARCHITECTURE

> **Instructions for User:** Copy everything below this line and paste it directly into Meta AI (or Llama 3.3).

---

```markdown
Role: Principal UI/UX Architect and Design Systems Lead for SpaceX / Apple-Grade Robotics Systems.
Task: Design the Complete Master Layout and Visual Information Architecture for the FRC GOD PLATFORM 2027 (a world-class web platform for FIRST Robotics Competition Team 12364).

CURRENT PROBLEM:
Our site currently contains 10 world-class engineering systems, but they are scattered across tabs, popovers, and congested sidebars. The current interface feels "messy, bulky, and overwhelming." We need you to restructure and unify all of these contents into a sleek, professional, high-density yet spacious Master Command Station layout.

FULL INVENTORY OF OUR SITE'S CONTENTS & FUNCTIONALITIES:
Here is every single component, data stream, and tool that exists in our codebase and must be elegantly positioned:

1. 3D RAPIR SIMULATION VIEWPORT (Primary Core):
   - 3D regulation FRC carpet field (16.54m × 8.21m, carpet friction μ = 1.15).
   - 4-Wheel Swerve Robot model with SDS MK4i modules (Kraken X60 motors, spinning wheels, rotating azimuth).
   - Elevating superstructure (0 to 1.2m stroke) with dual-flywheel shooter launching orange foam Notes.
   - Interactive 3D camera (Orbit/Pan/Zoom), field reset, respawn, and E-Stop with electromagnetic back-EMF braking.

2. REAL-TIME DRIVE & HARDWARE CONTROLS:
   - Dual virtual touch/mouse analog joysticks: Left stick = Translation (field-oriented XY), Right stick = Rotation (heading).
   - Speed segment selector: Crawl (1.5 m/s), Cruise (3.2 m/s), Sprint (4.8 m/s).
   - Live deadband & polynomial axis shaping preview ($y = a x^3 + (1-a)x$).
   - Physical USB Xbox/DualSense controller detection & live stick polling.
   - Mechanism quick buttons: Intake roller toggle, Elevator height slider.

3. 190-PARAMETER LIVE TUNER:
   - Real-time searchable parameters: Chassis mass (kg), wheel diameter, gear ratios, motor stall torques, carpet friction coefficients, PIDF gains (kP, kI, kD, kS, kV, kA), camera latency, battery internal resistance.
   - Sliders and numeric inputs with one-click "Reset to Defaults".

4. INTERACTIVE PHYSICS EXPERIMENTS LAB:
   - Testbench 1: Shooter Ballistics (air drag projectile simulation, Magnus backspin lift, SVG flight arc, speaker goal detection).
   - Testbench 2: Swerve Skidpad (friction circle traction limits, G-force lateral acceleration meter).
   - Testbench 3: Superstructure Center-of-Mass (dynamic CoM shift, chassis tip-over boundary).
   - Testbench 4: Motor Dynamometer (Kraken X60 / Falcon 500 torque-speed curves, copper thermal ODE dT/dt with thermal foldback warning, breaker trip simulator).

5. STATISTICAL PREDICTIONS & AUTONOMOUS ENGINE:
   - 100Hz Monte Carlo Batch Engine (parallel Web Worker trajectory dispersion).
   - Virtual WPILib SysId Quasistatic & Dynamic OLS regression solver (fits V = kS·sgn(v) + kV·v + kA·a).
   - 150-second FMS Match Battery Drain Curve (terminal voltage sag under heavy drive load).
   - Fault Chaos Monkey: CAN bus packet jitter, encoder disconnect, motor jam.
   - PathPlanner / Choreo auto trajectory tracking deviation overlay.

6. NATIVE WPILIB DESKTOP TOOL LAUNCHER:
   - Local Node/Vite bridge launching real installed desktop tools:
     * Glass.exe (WPILib real-time telemetry plots)
     * AdvantageScope.exe (3D field robot replay & log inspection)
     * Shuffleboard.exe (competition dashboard)
     * SysId.exe (system identification suite)
     * Elastic.exe (modern touch driver station)
     * OutlineViewer, PathWeaver, DataLogTool, RobotBuilder
   - Shows connection status: INSTALLED / READY / RUNNING with one-click launch buttons.

7. HARDWARE & ELECTRICAL SIMULATOR:
   - Embedded Wokwi virtual hardware simulator (ESP32 microcontroller firmware).
   - 32-LED CANdle addressable strip (visualizes Note indexing, battery brownouts, alliance mode).
   - REV Power Distribution Hub (PDH) 24-channel current monitoring grid (0A to 40A+ heatmap).
   - Ultrasonic proximity sensor (<12cm detection).

8. ADVANTAGESCOPE HUD & TRANSIENT TELEMETRY:
   - Transient zero-render ring buffers: Robot pose (X, Y, Heading), 4-module angles & velocities, stator temps, loop time (ms), battery volts.
   - Minimalist telemetry HUD overlay on the 3D viewport.

9. WPILIB JAVA CONFIG EXPORTER:
   - Modal/drawer exporting tuned configs to clean Java code for CTRE Phoenix 6 and REVLib.

10. 7-THEME DESIGN ENGINE:
   - CSS Variables: `--bg`, `--bg-elevated`, `--panel`, `--border`, `--border-bright`, `--text`, `--muted`, `--accent`, `--accent-glow`.
   - Themes: Argos Indigo, Midnight Blue, Ocean Teal, Ember Orange, Championship Gold, Neon Cyberpunk, Stealth Carbon.

---

YOUR ARCHITECTURAL DELIVERABLE:
Design the complete Master Layout structure so that all 10 of these systems feel unified, clean, spacious, and intuitive—NOT like 10 disjointed screens.

Please specify:
1. THE MASTER SCREEN GRID & ZONE STRUCTURE:
   - Where does the 3D viewport live? (e.g. Centered Hero canvas, persistent background, or flexible split view?)
   - Where do the Drive Controls live? (e.g. Floating collapsible bottom HUD, docking tray?)
   - Where do the heavy tools (Experiments, Predictions, WPILib Launcher, Parameters) live? (e.g. Multi-tier collapsible side docks, tabbed drawer trays, or modal command palettes?)
   - What is the persistent Top Navigation bar layout? (Branding, Team 12364 badge, match timer, alliance selector, quick stats, theme picker).

2. UX & INTERACTION FLOW:
   - How does a driver switch from "Driving & Practice Mode" to "Deep Physics Tuning" without losing sight of the robot?
   - How should the WPILib tool launcher and hardware simulator be presented so they look like an integrated mission control center?

3. CODE IMPLEMENTATION (React 19 + Tailwind CSS v4):
   - Output the complete, production-grade layout wrapper component:
     `export function MasterPlatformLayout({ ... })`
   - Use Tailwind CSS grid and flexbox classes (e.g. `grid grid-cols-12`, fixed header, collapsible side docks, floating bottom HUD).
   - Ensure the layout is responsive, un-cluttered, uses CSS variables (`var(--bg)`, `var(--panel)`, `var(--accent)`), and allows full natural scrolling where needed while keeping the 3D viewport pinned.
```
