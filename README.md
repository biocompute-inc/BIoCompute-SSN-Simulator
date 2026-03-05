#  NanoSim  (WASM)
**Single-Molecule Nanopore Analysis & Simulation Platform**

NanoSim is a high-performance, real-time nanopore sequencing simulator. It combines a highly accurate stochastic physics engine written in **Rust (WebAssembly)** with a responsive, modern frontend built in **Next.js & React**. 

This platform allows researchers and developers to simulate time-resolved ionic flux, experiment with different membrane materials (SiN, MoS₂, Graphene), and visualize the quantum-scale electronics of single-molecule translocation (ssDNA, dsDNA, Proteins) in real-time.

---

##  Features
* **High-Performance Physics Engine:** Built in Rust and compiled to WebAssembly (WASM) for lightning-fast, zero-block bulk array processing.
* **Realistic Stochastic Modeling:** Simulates Gaussian variance in molecule dwell times, hydrodynamic confinement drag, and realistic arrival Poisson distributions based on concentration.
* **Advanced Signal Processing:** Includes a Schmitt Trigger (Hysteresis) algorithm for robust event detection against high thermal noise.
* **Real-time Spectral Analysis:** Computes AC-coupled Fast Fourier Transforms (FFT) to visualize the Noise Power Spectral Density (PSD) and TIA filter roll-off.
* **Interactive Data Visualization:** Downsampled trace rendering with precise threshold bounding, population distribution histograms, and depth-vs-dwell scatter plots.
* **Exportable Data:** One-click export of raw physical and measured current traces to `.csv` for external analysis.

---

##  Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Charting:** Recharts
* **Backend / Physics Engine:** Rust, `wasm-bindgen`, `rustfft`
* **Build Tools:** `wasm-pack`, Webpack (configured for static WASM asset loading)

---

##  Getting Started

To run this project locally, you will need both Node.js and the Rust toolchain installed on your machine.

### Prerequisites
1. **Node.js** (v18 or higher) - [Install here](https://nodejs.org/)
2. **Rust & Cargo** - [Install via rustup](https://rustup.rs/)
3. **Wasm-Pack** - Used to compile Rust into WebAssembly.
   ```bash
   cargo install wasm-pack

### 1. Clone the Repository
    git clone https://github.com/biocompute-inc/BIoCompute-SSN-Simulator.git
    cd nanopore-simulator
### 2. Build the Rust Engine
    cd wasm-engine
    wasm-pack build --target web
    cd ..
### 3. Install Frontend Dependencies:
    npm install
### 4. Start the Development Server:
    npm run dev
