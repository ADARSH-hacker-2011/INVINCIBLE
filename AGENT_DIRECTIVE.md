# Persistent System Directive: FRC God Platform 2027 Architecture, Physics Integrity, and Free Multi-AI Execution Plan

> **SYSTEM INSTRUCTION FOR CODING AGENT (ANTIGRAVITY / CLAUDE / CURSOR):**
> Save this file as `CLAUDE.md` and `AGENT_DIRECTIVE.md` in the root of `D:\frc-sim`. You are the **Lead Systems, Physics & Full-Stack Robotics Engineer** for the **FRC GOD PLATFORM 2027** (`D:\frc-sim`, served at `http://localhost:5173/`). Treat every instruction in this document as a hard architectural requirement. Execute all pending fixes, dependency installations, physics upgrades, and multi-AI integrations systematically without leaving UI stubs or disconnected state.

## 1. Zero-Stub Engineering Mandate Eliminates Disconnected Simulation State

Every visual component, slider, button, and telemetry readout in `D:\frc-sim` must be backed by deterministic math, physical forces, or real wire-protocol bytes—never decorative mockups or unhooked state flags:

* **No Disconnected UI State**: Never add a Zustand boolean or parameter in `src/store.ts` or `src/stores/paramStore.ts` without wiring it into the active physics, electrical, or networking execution loop in the exact same commit.
* **No Non-Physical Velocity Teleports**: Never halt or move the robot by overwriting rigid-body velocities (`setLinvel(0)`) except during an explicit user `Respawn`. All motion and stopping must result from forces and torques applied to the Rapier 3D rigid body.
* **No Frame-Rate Dependent Physics**: Never use raw `useFrame((state, delta) => ...)` render deltas directly inside PID controllers, swerve azimuth slewing, or thermal differential equations. All control and physics integration must run on fixed deterministic timesteps.
* **No Isolated Hardware Mockups**: Every sensor and LED strip inside `src/components/HardwareSimulator.tsx` must react live to the 3D robot's state on the field.

## 2. Phase 0 Bootstrap Installs Required Packages and Multi-AI Environment Variables

Execute these setup steps immediately in `D:\frc-sim` before modifying application components:

1. **Install Core Binary Protocol, Worker, and Diagramming Dependencies**:
   ```bash
   cd D:\frc-sim
   npm install @msgpack/msgpack comlink @excalidraw/mermaid-to-excalidraw
   ```
   * `@msgpack/msgpack` enables authentic binary MessagePack framing for WPILib NetworkTables 4.
   * `comlink` provides clean RPC wrappers around background Web Workers for the 100Hz Monte Carlo engine and SysId solver.
   * `@excalidraw/mermaid-to-excalidraw` converts AI-generated Mermaid state-machine specs into interactive Excalidraw diagrams.

2. **Initialize `.env.local` for the Zero-Cost Multi-AI Router**:
   Create or update `D:\frc-sim\.env.local` with the following keys (leaving placeholders ready for free-tier keys):
   ```env
   VITE_GEMINI_API_KEY=your_google_ai_studio_free_key
   VITE_OPENROUTER_API_KEY=your_openrouter_free_key
   VITE_GROQ_API_KEY=your_groqcloud_free_key
   VITE_MISTRAL_API_KEY=your_mistral_studio_free_key
   ```

3. **Register Context-Packaging Scripts in `package.json`**:
   Add `"ask-argon": "node scripts/pack-argon.mjs"` and `"apply-argon": "node scripts/apply-argon.mjs"` to the `"scripts"` block in `D:\frc-sim\package.json`.

## 3. Phase 1 Critical Fixes Resolve Unfinished Working-Tree State and Render Bottlenecks

Complete these five core fixes first and commit the dirty working tree (`src/store.ts`, `src/App.tsx`, `src/components/SwerveRobot.tsx`) cleanly:

### Fix 1: Replace Instant E-Stop Freeze with Realistic Coast and Brake Mode Decay

In `src/store.ts` and `src/components/SwerveRobot.tsx`, replace the planned `setLinvel({x:0, y:0, z:0})` clamp with true electromagnetic coast/brake physics so an airborne or skidding robot obeys gravity and carpet friction ($\mu \approx 1.15$):

* **State Expansion (`src/store.ts`)**: Add `neutralMode: 'BRAKE' | 'COAST'` (default `'BRAKE'`) alongside `eStop: boolean`.
* **Physics Enforcement (`src/components/SwerveRobot.tsx`)**:
  ```typescript
  const { eStop, neutralMode } = useSim.getState();
  if (eStop) {
    // 1. Cut all active PWM/CAN motor voltage commands to 0V
    commandedVoltage = 0;
    // 2. Apply passive back-EMF regenerative damping in BRAKE mode, or carpet-only friction in COAST mode
    const linVel = bodyRef.current.linvel();
    const angVel = bodyRef.current.angvel();
    const brakeCoeff = neutralMode === 'BRAKE' ? 18.5 : 2.2; // N/(m/s) passive electromagnetic damping
    bodyRef.current.applyImpulse(
      { x: -linVel.x * brakeCoeff * fixedDt, y: 0, z: -linVel.z * brakeCoeff * fixedDt },
      true
    );
    bodyRef.current.applyTorqueImpulse(
      { x: 0, y: -angVel.y * (brakeCoeff * 0.4) * fixedDt, z: 0 },
      true
    );
    // Gravity (y-axis) and Rapier collider friction remain 100% active!
    return;
  }
  ```

### Fix 2: Decouple Control and Physics Loops from Display Refresh Rate

Replace variable-delta math inside `useFrame()` with a deterministic fixed-timestep accumulator that mirrors real WPILib and CTRE Phoenix 6 hardware timing:

* **High-Frequency Physics & Motor Thermal Sub-step**: $\Delta t_{\text{phys}} = 0.005\text{s}$ ($200\text{Hz}$) for 2nd-order swerve module azimuth lag, wheel scrub friction, battery sag, and thermal ODE integration.
* **Robot Control Loop Step**: $\Delta t_{\text{rio}} = 0.020\text{s}$ ($50\text{Hz}$) for inverse kinematics, PID/LQR evaluation, path following, and NetworkTables 4 publishing.
* **Implementation Pattern**:
  ```typescript
  const physAccumulator = useRef(0);
  const rioAccumulator = useRef(0);
  const PHYS_DT = 0.005; // 200Hz motor & thermal physics
  const RIO_DT = 0.020;  // 50Hz WPILib TimedRobot period

  useFrame((_, rawDelta) => {
    const clampedDelta = Math.min(rawDelta, 0.1); // Prevent spiral of death on tab switch
    physAccumulator.current += clampedDelta;
    rioAccumulator.current += clampedDelta;

    while (rioAccumulator.current >= RIO_DT) {
      stepRobotControlLoop(RIO_DT);
      rioAccumulator.current -= RIO_DT;
    }
    while (physAccumulator.current >= PHYS_DT) {
      stepMotorAndThermalPhysics(PHYS_DT);
      physAccumulator.current -= PHYS_DT;
    }
  });
  ```

### Fix 3: Eliminate 60Hz React Re-render Thrashing via Transient Telemetry Buffers

High-frequency telemetry must never trigger React virtual-DOM reconciliation across the entire app tree:

* Keep reactive Zustand hooks (`useSim(s => s.eStop)`) strictly for low-frequency UI controls.
* Create a non-reactive mutable `telemetryBuffer` object inside `src/store.ts` backed by pre-allocated `Float32Array` ring buffers for robot pose $(x, y, \theta)$, 4 module states (azimuth, speed, current, stator temp), 24 PDH channel currents, and battery terminal voltage.
* Update `src/components/AdvantageScopeHUD.tsx` to read directly from `useSim.getState().telemetryBuffer` inside its own `requestAnimationFrame` canvas/SVG loop.

### Fix 4: Move the 100Hz Monte Carlo Engine into a Parallel Web Worker Pool

Refactor `src/components/MonteCarloRunner.tsx` so randomized batch trials run inside `src/workers/monteCarlo.worker.ts` via Web Workers:

* Spawn `navigator.hardwareConcurrency || 4` workers to execute the 400-step ($100\text{Hz}$) numerical trajectory integration in parallel.
* Return results as zero-copy transferable `Float32Array` buffers (`postMessage(buffer, [buffer.buffer])`) so running 200 trials completes in under $150\text{ms}$ without dropping a single frame in the 3D viewport.

### Fix 5: Wire Bidirectional State Between the 3D Field and Wokwi Hardware Simulator

In `src/components/HardwareSimulator.tsx`, connect the embedded Wokwi simulator (ESP32 Simulation) to live simulation events:

* When the 3D robot intakes an orange foam note collider in `FRCField.tsx`, set `hasGamePiece: true` in `store.ts`, trigger the virtual ultrasonic proximity threshold ($<12\text{ cm}$), and automatically switch the 32-LED CANdle visualizer and Wokwi serial bridge to the **Note-Indexed Amber** signaling state.
* When battery voltage drops below $6.8\text{V}$ under heavy drive load, trigger the **Brownout Warning** strobe pattern across the LED strip and PDH telemetry panel.

## 4. Phase 2 Championship Engineering Upgrades Make the Simulator Competition-Ready

Implement the 8 roadmap milestones plus 5 essential FRC field-realism upgrades so software and driver training transfers directly to the physical robot:

| Subsystem / Milestone | Physical Equations & Algorithmic Specification | Target Files & FRC Standards |
|---|---|---|
| **M4: 2nd-Order Swerve Kinematics & Desaturation** | Model azimuth steering dynamics as a damped 2nd-order system or 1st-order lag ($\tau = 0.08\text{s}$, max slew $720^{\circ}/\text{s}$) with cosine velocity scaling ($v_{\text{cmd}} \cos(\theta_{\text{error}})$). Replicate WPILib's desaturateWheelSpeeds so any wheel command exceeding $v_{\max} = 4.8\text{ m/s}$ scales all four modules proportionally. | `src/components/SwerveRobot.tsx`, `src/physics/swerveKinematics.ts` |
| **M5: Binary NT4 Client & `.wpilog` Exporter** | Encode and decode authentic NetworkTables 4 binary MessagePack frames (`[topicId, timestampUs, typeId, value]`) using `@msgpack/msgpack`. Add a `.wpilog` binary log recorder so runs open directly in AdvantageScope 3D Field and AdvantageKit. | `src/components/DirectControlBridge.tsx`, `src/network/nt4Client.ts` |
| **M6: Coupled Motor Thermal ODE & Foldback** | Integrate $\frac{dT}{dt} = \frac{I^2 R_0 [1 + \alpha_{\text{Cu}}(T - 25)] - k_{\text{cool}}(T - T_{\text{amb}})}{C_{\text{thermal}}}$ where $\alpha_{\text{Cu}} = 0.00393\text{ K}^{-1}$ and $C_{\text{thermal}} = 180\text{ J/K}$ (Kraken X60) or $145\text{ J/K}$ (Falcon 500). Apply progressive current foldback scaling from $100\%$ at $100^{\circ}\text{C}$ to $20\%$ at $125^{\circ}\text{C}$. | `src/components/HardwareSimulator.tsx`, `src/physics/motorThermal.ts` |
| **M7: Gamepad Axis Matrix & Java Exporter** | Build `<GamepadProfileEditor />` with interactive SVG Xbox/DualSense sticks, axis deadbands ($0.00–0.25$), polynomial shaping ($y = a x^3 + (1-a)x$), and one-click export of `CommandXboxController` Java bindings alongside CTRE Phoenix 6 and REVLib configs. | `src/components/GamepadProfileEditor.tsx`, `src/components/JavaConfigExporter.tsx` |
| **M8: PathPlanner & Choreo Auto Workbench** | Build the **AUTO** tab to natively import and export PathPlanner (`.path`, `.auto`) and Choreo (`.traj`) JSON files. Include a $0.0\text{s}–15.0\text{s}$ timeline scrubber and a semi-transparent ghost robot showing reference pose vs. actual simulated pose. | `src/components/AutoPathWorkbench.tsx`, `src/physics/holonomicFollower.ts` |
| **M9 + Upgrade A: Noisy Odometry vs. AprilTag Fusion** | Separate **Ground-Truth Rapier Pose** from **Estimated Odometry Pose** (integrating wheel encoders + Pigeon 2.0 IMU drift + wheel slip). Fuse simulated PhotonVision MultiTag AprilTag camera rays with latency ($20\text{ms}$) and distance covariance ($\sigma_{xy} \propto d^2$). | `src/vision/aprilTagSim.ts`, `src/physics/poseEstimator.ts` |
| **M10 + Upgrade B: Virtual WPILib SysId Suite** | Implement automated WPILib System Identification (SysId) Quasistatic ($0.25\text{ V/s}$) and Dynamic ($7\text{V}$ step) tests. Fit ordinary least-squares regression to $V = kS\cdot\text{sgn}(v) + kV\cdot v + kA\cdot a$ and compute LQR optimal $kP, kD$ gains. | `src/components/AICopilotModal.tsx`, `src/control/sysIdRunner.ts` |
| **Upgrade C: Dynamic CoM & Maple-Sim Collisions** | Shift the Rapier 3D chassis center-of-mass vertically and longitudinally in real time as elevator height and arm angle change. Model bumper-to-bumper restitution and game-piece intake rollers after Maple-Sim. | `src/components/SwerveRobot.tsx`, `src/components/FRCField.tsx` |
| **Upgrade D: FMS Match Timer & Fault Chaos Monkey** | Add an official $150\text{s}$ FMS match state machine ($15\text{s}$ Auto $\rightarrow$ $2\text{s}$ Pause $\rightarrow$ $135\text{s}$ Teleop) plus a **Fault Injection Panel** to test code resilience against unplugged CANcoders, jammed REV SPARK MAX rollers, tripped PDH breakers, and $150\text{ms}$ packet jitter. | `src/components/FMSChaosPanel.tsx`, `src/store.ts` |
| **M11: Chromebook 60FPS Instancing & LOD Pass** | Convert field guardrails, carpet tiles, and foam notes to `<Instances>` in `@react-three/drei`, add dynamic `<Detailed>` LOD meshes, and auto-scale WebGL pixel ratio (`dpr={[0.75, 1.5]}`) when frame times exceed $18\text{ms}$. | `src/Sim.tsx`, `src/components/FRCField.tsx` |

## 5. Phase 3 Multi-AI Integration Unlocks Free APIs and Bridges Gemini 4 Argon

Because Gemini 4 Argon is gated behind the paid AI Ultra tier inside Antigravity, implement a two-pronged strategy: a **Zero-Cost Multi-AI Router** (`src/services/aiRouter.ts`) for live in-app intelligence, and an **Automated Argon Context Bridge** (`scripts/pack-argon.mjs`) for heavy architectural reasoning.

### 1. Free Multi-AI Tool Matrix and Task Routing

| External AI / Engineering Tool | Dedicated Engineering Responsibility in `D:\frc-sim` | Free API / Integration Route |
|---|---|---|
| **Gemini 4 Argon** | High-level 1M-token system architecture, robotics physical reasoning, and multi-file state machines | Run `npm run ask-argon` to generate a single-file context bundle for Argon Web/Mobile, then save its response to `src/specs/argon-output.md` |
| **Google AI Studio** | In-app `AICopilotModal.tsx` natural-language tuning across all 190 parameters and multimodal CAD/screenshot inspection | Direct REST calls to `gemini-3.8-flash` and `gemini-2.5-pro` using the Gemini Free Tier |
| **OpenRouter (:free)** | Zero-cost fallback router for DeepSeek R1, NVIDIA Nemotron, and Llama models via a single OpenAI-compatible SDK | Route requests to `https://openrouter.ai/api/v1/chat/completions` using `openrouter/free` or model IDs ending in `:free` |
| **GroqCloud Console** | Sub-$200\text{ms}$ real-time tactical match coaching, live PID suggestions, and Whisper voice commands during driver practice | Use the GroqCloud Quickstart API (`https://api.groq.com/openai/v1/chat/completions`) under free developer rate limits |
| **DeepSeek API / R1** | Symbolic derivation of 2nd-order swerve state-space matrices, LQR Riccati solvers, and coupled thermal ODE proofs | Query `deepseek/deepseek-r1:free` via OpenRouter or the DeepSeek Chat Completions API |
| **Mistral Studio** | Strict TypeScript type-safety review, WebSocket/rAF memory-leak checks, and FRC Game Manual PDF parsing via Document AI | Call `https://api.mistral.ai/v1/chat/completions` on the free Mistral Studio plan |
| **v0 by Vercel** | Rapid scaffolding of Tailwind CSS 4 + React 19 UI panels, SVG controller diagrams, and telemetry sparklines | Generate standalone React components in v0 and drop them into `src/components/` |
| **Hugging Face Inference** | Serverless vision/embedding tasks and hosting static cloud previews of `D:\frc-sim` on Hugging Face Spaces | Call models via the `@huggingface/inference` TypeScript package |
| **Wokwi Simulator** | Real-time ESP32, STM32, and RPi Pico firmware execution for CAN bus arbitration, ultrasonic sensors, and addressable LEDs | Embed Wokwi Supported Hardware projects and automate firmware checks with Wokwi CI |

### 2. Create the Unified Free Multi-AI Router (`src/services/aiRouter.ts`)

Write this file to `D:\frc-sim\src\services\aiRouter.ts` so `AICopilotModal.tsx` and the SysId auto-tuner can query multiple free AI providers with automatic failover:

```typescript
export type AITaskRole = 'FAST_TUNING' | 'DEEP_MATH' | 'CODE_AUDIT' | 'STRATEGY';

interface AIRequest {
  role: AITaskRole;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
}

const PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: import.meta.env.VITE_GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
  },
  openrouterReasoning: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: import.meta.env.VITE_OPENROUTER_API_KEY,
    model: 'deepseek/deepseek-r1:free',
  },
  openrouterAutoFree: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: import.meta.env.VITE_OPENROUTER_API_KEY,
    model: 'openrouter/free',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: import.meta.env.VITE_MISTRAL_API_KEY,
    model: 'mistral-small-latest',
  },
  geminiFlash: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    key: import.meta.env.VITE_GEMINI_API_KEY,
    model: 'gemini-3.8-flash',
  },
};

export async function queryMultiAI(req: AIRequest): Promise<string> {
  const priorityOrder =
    req.role === 'DEEP_MATH'
      ? [PROVIDERS.openrouterReasoning, PROVIDERS.geminiFlash, PROVIDERS.openrouterAutoFree]
      : req.role === 'CODE_AUDIT'
      ? [PROVIDERS.mistral, PROVIDERS.geminiFlash, PROVIDERS.openrouterAutoFree]
      : [PROVIDERS.groq, PROVIDERS.geminiFlash, PROVIDERS.openrouterAutoFree];

  const errors: string[] = [];

  for (const provider of priorityOrder) {
    if (!provider.key) continue;
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: req.userPrompt },
          ],
          temperature: req.role === 'DEEP_MATH' ? 0.1 : 0.3,
          ...(req.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!response.ok) {
        errors.push(`${provider.model}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err) {
      errors.push(`${provider.model}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`All configured free AI providers failed or lacked keys: ${errors.join(' | ')}`);
}
```

### 3. Create the Gemini 4 Argon Context Bridge (`scripts/pack-argon.mjs`)

Write this script to `D:\frc-sim\scripts\pack-argon.mjs` so that whenever a complex 1M-token architectural or physics task is needed from Gemini 4 Argon, running `npm run ask-argon -- "Task description"` packages the exact live TypeScript interfaces into `D:\frc-sim\src\specs\argon-prompt.md`:

```javascript
import fs from 'node:fs';
import path from 'node:path';

const taskDescription = process.argv.slice(2).join(' ') || 'Design the next milestone module with strict TypeScript types and zero stubs.';
const rootDir = process.cwd();

const coreFiles = [
  'src/store.ts',
  'src/stores/paramStore.ts',
  'src/Sim.tsx',
  'src/components/SwerveRobot.tsx',
];

let bundle = `# GEMINI 4 ARGON ARCHITECTURAL DISPATCH — FRC GOD PLATFORM 2027\n\n`;
bundle += `## Assigned Engineering Task\n${taskDescription}\n\n`;
bundle += `## Strict Output Contract\n`;
bundle += `1. Output complete, production-ready TypeScript/React 19 code blocks with exact file paths as headings (e.g., \`### FILE: src/physics/swerveKinematics.ts\`).\n`;
bundle += `2. Do not use placeholders, TODO comments, or simplified first-order stubs.\n`;
bundle += `3. Maintain 100% compatibility with the Zustand stores and interfaces below.\n\n`;

for (const relPath of coreFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    bundle += `### CURRENT FILE: ${relPath}\n\`\`\`typescript\n${content}\n\`\`\`\n\n`;
  }
}

const outDir = path.join(rootDir, 'src', 'specs');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'argon-prompt.md');
fs.writeFileSync(outFile, bundle, 'utf8');

console.log(`✅ Argon context bundle written to: ${outFile}`);
console.log(`👉 Copy its contents into Gemini 4 Argon (Mobile/Web), paste the response into src/specs/argon-output.md, and tell the local agent: "Apply src/specs/argon-output.md".`);
```

## 6. Ordered Execution Checklist for the Coding Agent

Execute the following sequence step-by-step, verifying `npm run build` and zero TypeScript errors after every single step:

- [ ] **Step 1**: Run `npm install @msgpack/msgpack comlink @excalidraw/mermaid-to-excalidraw` in `D:\frc-sim` and create `src/services/aiRouter.ts` and `scripts/pack-argon.mjs`.
- [ ] **Step 2**: Wire the realistic Coast/Brake E-Stop physics and the deterministic $200\text{Hz}$ / $50\text{Hz}$ fixed-timestep accumulators into `src/store.ts`, `src/App.tsx`, and `src/components/SwerveRobot.tsx`, then commit the working tree cleanly.
- [ ] **Step 3**: Refactor high-frequency telemetry in `src/store.ts` and `src/components/AdvantageScopeHUD.tsx` to use transient `Float32Array` ring buffers, eliminating $60\text{Hz}$ React re-renders.
- [ ] **Step 4**: Move `src/components/MonteCarloRunner.tsx` simulation loops into `src/workers/monteCarlo.worker.ts` using transferable typed arrays.
- [ ] **Step 5**: Implement 2nd-order swerve azimuth lag ($\tau = 0.08\text{s}$), wheel scrub friction, WPILib desaturateWheelSpeeds, and the coupled motor thermal ODE ($\frac{dT}{dt}$) with thermal foldback above $100^{\circ}\text{C}$.
- [ ] **Step 6**: Separate Ground-Truth Rapier Pose from Noisy Odometry Pose (`SwerveDrivePoseEstimator`) and wire simulated PhotonVision MultiTag AprilTag pose fusion.
- [ ] **Step 7**: Build the **AUTO** tab with native PathPlanner (`.path`/`.auto`) and Choreo (`.traj`) file import/export and a $0.0\text{s}–15.0\text{s}$ ghost-robot timeline scrubber.
- [ ] **Step 8**: Upgrade `src/components/DirectControlBridge.tsx` to binary MessagePack NetworkTables 4 and add `.wpilog` download for AdvantageScope and AdvantageKit.
- [ ] **Step 9**: Add the Virtual WPILib SysId characterization runner, Dynamic Superstructure CoM shifting, Bidirectional Wokwi sensor/LED triggers, and the FMS Match Chaos / Fault Injection panel.
