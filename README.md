# ROUTELESS – The Last Mile 🚌
### AI-Powered Intelligent Rural Transportation & Student Mobility Network
*Belagavi District (Raybag • Chikkodi • Hukkeri Taluks) Rural Transit Grid*

---

> **Core Product Vision:**
> *"When a government bus fails, a rural route is disrupted, or seat capacity is exhausted, no student should be left stranded."*

---

## 🌟 Executive Summary

**ROUTELESS** is an AI-powered rural mobility coordination platform engineered to solve the acute last-mile transportation crisis faced by rural students attending government polytechnic institutes, degree colleges, and pre-university institutions. 

In rural clusters such as Raybag, Chikkodi, and Hukkeri, students depend entirely on a limited frequency of State Road Transport (NWKRTC/KSRTC) buses. When a bus breaks down, culverts flood during monsoons, or morning rush crowds out students, educational opportunities are lost. 

ROUTELESS bridges this gap by unifying **Students**, **State Transport Operators**, **College Administrators**, and **Verified Alternative Rural Providers** (Gram Panchayat E-Rickshaw collectives, verified MaxiCabs, and institution auxiliary shuttles) into an intelligent, self-healing transit network.

---

## 🚀 Key Modules & System Capabilities

### 1. Module A: Student Portal (`/student`)
- **Digital Student Boarding Pass**: Live vehicle assignment, operator details, driver contact number, and designated pickup landmark.
- **Seat Status Tracking**: Real-time status badges: `CONFIRMED`, `WAITLISTED`, `REASSIGNED`, or `PENDING`.
- **Intelligent Ride Request Engine**: Select origin village, institution, travel date, and arrival deadline with exam priority flags.
- **Priority Tiering**: Exam Day Boost (+40 pts) and Female Student Remote Last-Mile Safety Quota (+25 pts).
- **Explainable AI Decision Audit**: Complete transparency on why a particular vehicle or waitlist rank was assigned.
- **Live Seat Inventory**: Real-time occupancy progress bars across all scheduled public buses.
- **Switchable Demo Personas**: Preloaded accounts (Pooja Patil, Rohan Biradar, Basavanna Gouda, Meenakshi Hiremath, etc.).

### 2. Module B: Transit Operator Command Center (`/operator`)
- **Fleet Management**: Monitor scheduled government buses (Ashok Leyland 55-seaters, Tata Marcopolo 32-seaters, Eicher 45-seaters).
- **Seat Capacity & Load Factor Controls**: Real-time tracking of occupied vs available seat headroom.
- **Mechanical Breakdown Reporting**: One-click driver breakdown dispatch that triggers instantaneous AI reallocation.
- **Road Closure & Repair Logging**: Live toggles on rural road segments that force network graph re-computation.
- **Auxiliary Bus Deployment**: On-demand dispatch of auxiliary relief vehicles (absorbing waitlisted students in priority order).

#### Exam Day Emergency Command Center

The operator dashboard includes a combined emergency demonstration that applies two government bus failures, a 40% demand increase, and a simulated flood closure of the Harugeri–Mugalkhod road in one run.

- Demand is based on the current student records: `ceil(current students × 1.40)`. The additional request records are marked **Simulated** in the operator request queue and are added only once per run.
- The `EmergencyOptimizer` uses the current road graph and existing Dijkstra router to exclude disrupted edges. It checks service compatibility, vehicle status, seat availability, estimated arrival, and each examination start time before assigning a seat.
- Examination urgency has three explainable categories: **Critical** (exam within 60 minutes or 30 minutes or less of estimated arrival buffer), **High** (exam within the two-hour window), and **Normal**. Non-examination students remain in the queue and can use remaining eligible seats.
- This is a deterministic priority-aware greedy allocation pass, not a global optimizer; the report exposes unmet capacity and timing constraints rather than promising every student will arrive on time.
- Vehicle capacities are never exceeded. Students without an open, compatible, on-time option remain waitlisted or at risk, and the report states the constraint.
- Students see only their own emergency status, previous/new vehicle, pickup point, estimated arrival, and flood-safe route estimate in the Student Portal.
- All times and route calculations are local demonstration estimates from the included demo data; the feature does not use live traffic or external services. Reset uses the existing demo-data reset action.

Run the emergency and existing allocation/transport regression checks with `npm run test:emergency`.

### 3. Module C: Intelligent Allocation Engine (`src/algorithms/allocationEngine.ts`)
- Multi-factor algorithmic evaluation function:
  $$\text{Score} = \text{RouteMatch} (35) + \text{TimeBufferMatch} (25) + \text{CapacityScore} (15) + \text{PriorityBonus} (40)$$
- **Strict Anti-Overbooking Constraint**: Absolute statutory capacity limit ($Occupied \le Capacity$).
- **Multi-Tier Cascade**: Primary Government Bus $\rightarrow$ Secondary Mini-Bus $\rightarrow$ Verified Rural Feeder $\rightarrow$ Priority Waitlist.
- **Transparent Explainability**: Detailed reason strings generated for every student allocation.

### 4. Module D: Dijkstra Route Optimizer & Schematic Map (`/routes`)
- **Weighted Graph Topology**: Models rural villages, colleges, junctions, and road segments with physical distances, road conditions (good, average, poor, flooded, under_repair), and disruption flags.
- **Dijkstra Shortest Path Engine**: Automatically avoids severed road segments (canal culvert cracks, flooded bridges) to find the fastest valid detour.
- **Delta Impact Metrics**: Compares baseline path vs. optimized bypass (e.g., $+8.0\text{ km}$, $+20\text{ mins}$ detour).
- **Interactive SVG Transit Grid**: Visual graph representation with interactive nodes and clickable roads to simulate closures directly on the map.

### 5. Module E: Transport Disruption Simulator (`/simulator`) — *Signature Feature*
- **Simulate Bus Breakdown**:
  1. Marks target bus as unavailable (`BREAKDOWN`).
  2. Queries all assigned students on that vehicle manifest.
  3. Re-runs allocation algorithm across neighboring buses and verified auxiliary feeders.
  4. Dynamically reassigns students with exam priority first.
  5. Places remaining overflow on emergency waitlist.
  6. Emits instant push notifications across the student and operator dashboards.
  7. Renders a comprehensive side-by-side **Before & After Impact Report**.
- **Simulate Road Closure**: Block critical road corridors and compute graph bypass paths in real-time.
- **Simulate Demand Surge**: Simulates a sudden $+8$ morning exam rush to stress-test capacity and trigger auxiliary relief.

### 6. Module F: Demand Analytics & Forecasting (`/analytics`)
- **Observed Metrics**: Total requests, confirmed allocations, waitlisted students, fleet utilization percentage.
- **Transparent Algorithmic Forecasting**:
  - Uses a **Weighted Historical Moving Average with Demographic Scaling**:
    $$\text{Projected} = (0.60 \times \text{ObservedDemand} + 0.40 \times \text{VillageStudentPopulation} \times 0.22) \times 1.15 \text{ (Exam Multiplier)}$$
  - Distinguishes observed live demand from algorithmic projections.
  - Zero black-box or fabricated machine learning claims.
- **Visual Analytics**: Interactive Recharts bar graphs and area charts comparing corridor demand and time-slot ridership.

### 7. Module G: AI Mobility Assistant (`/assistant`)
- **Natural Language Decision Support**: Answering queries for students (*"Which bus can take me to my college?"*, *"What happens if my bus breaks down?"*, *"Why am I waitlisted?"*) and operators (*"Which route is overloaded?"*, *"Who is affected by the disruption?"*).
- Context-aware RAG over live application memory.

### 8. Practical Innovation & Inclusivity
- **Multilingual Support**: Instant toggle between **English** and **Kannada (ಕನ್ನಡ)**.
- **Rural Lite Mode**: High-contrast, low-bandwidth mode disabling heavy animations for 2G rural networks.
- **One-Click Demo Reset**: Instantly restore the default benchmark scenario at any point.

---

## 🏛️ Technical Architecture

```
routeless/
├── src/
│   ├── algorithms/
│   │   ├── allocationEngine.ts    # Multi-factor student seat allocation
│   │   ├── graphRouter.ts         # Dijkstra shortest path & bypass calculation
│   │   ├── disruptionEngine.ts    # Cascading breakdown & surge reallocation
│   │   ├── emergencyOptimizer.ts  # Combined crisis demand, priority & route-aware allocation
│   │   ├── demandForecaster.ts    # Weighted moving average ridership projection
│   │   └── aiAssistantEngine.ts   # Context-aware natural language decision support
│   ├── components/
│   │   ├── Navbar.tsx             # Global navigation, language & mode toggles, alerts
│   │   ├── LandingPage/           # Executive product overview & quick launchers
│   │   ├── StudentPortal/         # Boarding pass, seat availability, ride request
│   │   ├── OperatorDashboard/     # Fleet management, bus status, auxiliary dispatch
│   │   │   └── EmergencyCommandCenter.tsx # Combined exam-day crisis status and response report
│   │   ├── RouteVisualizer/       # Interactive schematic SVG map & detour delta
│   │   ├── DisruptionSimulator/   # Breakdown & closure simulator, impact reports
│   │   ├── Analytics/             # Recharts corridor demand & capacity load charts
│   │   └── AIAssistant/           # Interactive decision assistant with prompt chips
│   ├── context/
│   │   └── TransportContext.tsx   # Centralized reactive state & localStorage sync
│   ├── data/
│   │   └── demoData.ts            # Realistic Belagavi district rural transit dataset
│   ├── locales/
│   │   ├── en.ts                  # English translations
│   │   └── kn.ts                  # Kannada (ಕನ್ನಡ) translations
│   ├── types/
│   │   └── index.ts               # Domain TypeScript interfaces
│   ├── App.tsx                    # Main root component
│   └── main.tsx                   # DOM entrypoint
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🧪 Automated Testing Verification

The platform includes an automated functional test suite (`test-suite.js`) validating the 7 core requirements from Section 8:

| Test ID | Scenario | Expected Outcome | Result |
|---|---|---|:---:|
| **TEST 1** | Student Requests Ride | Compatible bus matched, seat allocated, arrival buffer verified | **PASS (100%)** |
| **TEST 2** | Bus Reaches Full Capacity | Overbooking strictly rejected, candidate marked ineligible | **PASS (100%)** |
| **TEST 3** | Bus Breakdown Event | Bus marked breakdown; orphaned students prioritized & reassigned | **PASS (100%)** |
| **TEST 4** | Road Segment Blocked | Dijkstra computes bypass route; detour km and min calculated | **PASS (100%)** |
| **TEST 5** | Student Demand Surge | Fleet headroom stressed, overloaded corridors flagged | **PASS (100%)** |
| **TEST 6** | Auxiliary Bus Deployed | Additional capacity absorbs waitlisted students into confirmed pass | **PASS (100%)** |
| **TEST 7** | State Persistence | LocalStorage serialization hydrates consistently without data loss | **PASS (100%)** |

**Overall Verification: 7 / 7 Tests Passed (100% Core Reliability)**

---

## ⚡ Setup & Local Execution Instructions

### Prerequisites
- Node.js version 18 or higher (v24.x recommended)
- npm or pnpm

### Step-by-Step Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/rohitkumarhanchinal/routeless-rural-transit.git
   cd routeless-rural-transit
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Automated Test Suite**:
   ```bash
   npx tsx test-suite.js
   ```

4. **Launch Local Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` to interact with the live application.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🎭 Step-by-Step Demonstration Walkthrough for Judges

1. **Explore the Landing Page**:
   - Note the clear mission, key innovation pillars, and one-click role launchers.
   - Switch languages to **ಕನ್ನಡ** using the top header button to observe bilingual interface support.

2. **Student Portal (Module A)**:
   - Default active persona: **Pooja Patil** (Final Year Diploma, Harugeri Village $\rightarrow$ Govt Polytechnic).
   - View her **Digital Boarding Pass** on Bus `KA-28-F-1102` with **Exam Day Priority** badge.
   - Expand the **Explainable AI Decision Audit** to inspect the score breakdown: Route (+35), Time (+20), Capacity (+10), Priority (+40).
   - Use the **Switch Demo Student** dropdown to select **Basavanna Gouda**: note his `WAITLISTED` pass because the primary bus reached 100% capacity (demonstrating strict anti-overbooking).

3. **Disruption Simulator (Module E — Signature Feature)**:
   - Navigate to the **Disruption Simulator** tab.
   - Select Bus `KA-28-F-1102` (the overcrowded 50-seater).
   - Click the prominent **"SIMULATE BUS BREAKDOWN"** button.
   - **Observe live reaction**:
     - Bus `KA-28-F-1102` is marked `BREAKDOWN`.
     - The AI Reallocation Engine runs instantly.
     - The **Disruption Impact & Reallocation Report** appears showing displaced students, reassigned vehicles, and priority explanations.
     - A system emergency alert pulses in the notification center.
   - Switch back to the **Student Portal**: Pooja Patil's boarding pass now shows `REASSIGNED` to a verified alternative provider (`KA-28-EV-04` Panchayat Feeder), confirming real-time cross-dashboard synchronization!

4. **Dijkstra Route Optimizer (Module D)**:
   - Navigate to **Route Optimizer**.
   - Select Origin: `Harugeri Village` and Destination: `Government Polytechnic`.
   - Observe the interactive schematic map: The direct route is marked `BLOCKED` (canal bridge subsidence).
   - Notice the glowing cyan bypass path automatically computed via Mugalkhod.
   - Inspect the **Detour Overhead**: Baseline 22.5 km (30 min) vs. Bypass 30.5 km (50 min) $\rightarrow +8\text{ km}$ ($+20\text{ min}$ detour).
   - Click any road segment directly on the map to toggle its disruption status and watch the path dynamically re-route!

5. **Operator Command Center (Module B)**:
   - Open **Operator Command Center**.
   - View the **Student Requests Queue** and real-time **Bus Fleet Manager**.
   - Click **"Deploy Auxiliary Bus"**, enter vehicle details, and submit.
   - Watch the auxiliary bus enter active service and immediately absorb waitlisted students!

6. **Demand Analytics (Module F)**:
   - View the corridor ridership breakdown and hourly load factor chart.
   - Read the transparent methodology explanation for moving average demand forecasting.

7. **One-Click Reset**:
   - Click **"Reset Demo State"** in the top navigation bar to restore the benchmark scenario clean at any time.

---

## 🔒 Safety, Privacy & Ethical Standards
- **Zero Student Contact Disclosure**: Private student phone numbers and personal IDs are masked in public views.
- **Verified Operators Only**: Only RTO-licensed state transport buses and verified Gram Panchayat auxiliary providers are eligible for student dispatch.
- **No Overbooking Guarantee**: Vehicles strictly halt allocations when statutory capacity is reached to prevent dangerous rural bus roof-riding.

---

## ⚠️ Known Limitations
- The routing visualization uses a schematic graph coordinate layout rather than live satellite GIS imagery to guarantee offline and low-bandwidth accessibility in rural zones without paid map API dependencies.
- Demand predictions are derived from weighted demographic moving averages rather than high-compute neural networks, prioritizing full transparency and verifiability.

---

*Developed for the AI-Powered Intelligent Rural Transportation Challenge: ROUTELESS – The Last Mile.*
