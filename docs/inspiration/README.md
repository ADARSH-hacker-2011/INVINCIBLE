# FRC Simulator Project

## Overview
This folder contains the master records, plans, architecture notes, and progress for the **FRC 3D Robotics Simulator & Remote Control Hub** targeting the FRC 2027 season.

## Project Details
- **Conversation Name:** `frc simulator`
- **Conversation ID:** `78763da3-cce6-42b0-bc08-d11d08972e06`
- **Active Codebase Location:** `D:\frc-sim`
- **Tech Stack:**
  - Frontend: Next.js / Vite + React + TypeScript + Tailwind CSS
  - 3D Engine: Three.js (`@react-three/fiber`, `@react-three/drei`)
  - Physics Engine: Rapier WASM (`@react-three/rapier`)
  - State Management: Zustand
  - Telemetry & UI Style: Inspired by `D:\air-batch-platform`
  - Computer Vision Reference: `D:\argos v8` (Strictly read-only)

- **Master Hub Overview:** [`Frc-Sim-Lab-Overview.html`](file:///D:/FRC/Frc-Sim-Lab-Overview.html) (*"BHAI ISS SAAL TOH FRC JEETUNGA!!"*)
- **Diagnostic Audit:** [`diagnostic_report.md`](file:///C:/Users/adarsh/.gemini/antigravity/brain/78763da3-cce6-42b0-bc08-d11d08972e06/diagnostic_report.md)
- **Active Codebase Location:** `D:\frc-sim`
- **Tech Stack:**
  - Frontend: Vite + React 19 + TypeScript + Tailwind CSS
  - 3D Engine: Three.js (`@react-three/fiber`, `@react-three/drei`)
  - Physics Engine: Rapier WASM (`@react-three/rapier`)
  - State Management: Zustand
  - Telemetry & UI Style: Inspired by `D:\air-batch-platform` (Strictly read-only)
  - Computer Vision Reference: `D:\argos v8` (Strictly read-only)

## The 7-Step Championship Roadmap
1. **Milestone 1 — Stable Physics & Swerve Robot:** Solid 1.0m CCD floor, regulation FRC arena, procedural 4-pod swerve robot, continuous collision detection, AdvantageScope vector telemetry.
2. **Milestone 2 — Extended What-If Physics:** Air drag, battery sag model, surface density, tilted ramps and charging station elements.
3. **Milestone 3 — Record / Replay & Auto:** Path-following autonomous trajectory generator with timeline scrubber and ghost robot overlay.
4. **Milestone 4 — AI Strategy & Tuning Assistant:** Auto-tune PID and drive curves, analyze match telemetry, explain failure points.
5. **Milestone 5 — OpenCV Vision Service:** AprilTag detection, target pose estimation, camera feed streaming (inspired by `D:\argos v8`).
6. **Milestone 6 — Wireless Control Bridge:** NetworkTables 4 over WebSocket / Gamepad API for low-latency wireless robot control.
## Multi-AI Synergy Protocol (Inculcating the Best of All Tools)
We actively leverage the distinct strengths of top external AI engines throughout every milestone:
- **Meta AI**: Ideal for rapid standalone single-file modules, self-contained web widgets, and fast comparative architectural evaluations.
- **DeepSeek (R1 / V3)**: Best for deep mathematical derivations, swerve inverse kinematics, PID loop tuning algorithms, and high-performance physics math.
- **Claude (Sonnet / Opus)**: Best for extensive codebase architectural refactoring, comprehensive documentation, and system analysis.
- **Antigravity (Here)**: Active live pair programming, multi-file code integration, real-time environment testing, physics debugging, and project execution.
*Note: I will proactively flag and prompt you whenever a subsystem or calculation can be spun off to Meta AI or DeepSeek for maximum speed and quality!*
