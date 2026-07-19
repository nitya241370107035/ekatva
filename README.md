# Ekatva (एकत्व) – Digital Unity for Weaving Cooperatives

**Tagline:**  
*"Where every loom becomes part of a larger, stronger weave."*

## Introduction

Ekatva (एकत्व) is a mobile-first, multilingual, offline-capable Progressive Web Application (PWA) designed to digitise the complete operational lifecycle of handloom weaving cooperatives. The platform empowers cooperative societies, weavers, buyers, and administrators through a unified digital ecosystem that streamlines daily operations, strengthens collective bargaining, improves transparency, and enhances the economic well-being of artisan communities. Built with an offline-first architecture, Ekatva ensures uninterrupted access even in regions with unreliable internet connectivity.

---

# Problem Statement

Handloom cooperatives continue to face significant operational and economic challenges due to dependence on fragmented manual systems. Paper-based workflows make record management slow and error-prone, while disconnected procurement and production processes reduce operational efficiency.

The major challenges include:

- Manual paper-based record keeping
- Fragmented procurement and production workflows
- Weak collective bargaining power
- Limited access to larger markets
- Opaque payment and production records
- Poor visibility into government welfare schemes
- Low digital adoption among rural artisans
- Language and accessibility barriers

Ekatva directly addresses these pain points by providing a unified digital platform aligned with the hackathon problem statement, enabling cooperatives to operate more efficiently while improving transparency, collaboration, and financial inclusion.

---

# Solution Overview

Ekatva delivers an integrated digital platform featuring role-based dashboards for Secretaries, Weavers, Buyers, and Administrators. The application functions offline, synchronises automatically when connectivity returns, and supports multilingual voice interaction in Hindi, English, and Bengali to improve accessibility for artisans.

The platform introduces six major innovations:

### 1. Coalition Capacity Engine
Aggregates production capacity across multiple cooperatives, enabling them to jointly bid for larger purchase orders that individual societies cannot fulfill independently.

### 2. Job Sakhi Voice Assistant
A multilingual voice interface allowing weavers to request raw materials, receive job assignments, update production status, and check earnings using natural speech.

### 3. QR Fair-Wage Traceability
Every finished product receives a QR code that records its complete production journey, quality checkpoints, and transparent wage distribution through an immutable verification chain.

### 4. Reputation-Driven Credit System
Automatically calculates a reliability score based on delivery history and quality performance, enabling trusted weavers to receive advance payments without traditional collateral.

### 5. Predictive Procurement Advisor
Analyzes historical procurement data and production trends to recommend optimized bulk purchases, reducing material costs and shortages.

### 6. Government Scheme Matchmaker
Automatically identifies government welfare schemes applicable to individual weavers and pre-fills application summaries using existing member data.

---

# Core Modules

## 1. Digital Member Ecosystem

- Digital member profiles
- QR-based identity cards
- Cooperative notice board
- Digital grievance management
- Member activity history

---

## 2. Collective Bulk Procurement Engine

- Raw material indent collection
- Indent consolidation
- Vendor marketplace
- Predictive procurement advisor
- Inventory and stock management

---

## 3. Production Tracking & Quality Control

- Digital job card creation
- Production status updates
- Quality control checkpoints
- Immutable hash-chain production timeline

---

## 4. Transparent Payment Ledger & Digital Passbook

- Automatic wage calculation
- Digital payment passbook
- Reliability score generation
- Advance payment management

---

## 5. Market Linkages & Coalition Engine

- Cooperative storefront
- Buyer RFQ (Request for Quotation)
- Coalition formation across societies
- Unified quotation generation

---

## 6. QR Traceability & Fair-Wage Branding

- Product instance generation
- Public QR traceability page
- Wage transparency
- Hash-chain verification

---

## 7. Voice-First Access – Job Sakhi

- Web Speech API integration
- Hindi, English, and Bengali support
- Natural language command parser
- Spoken feedback system

---

## 8. Government Scheme Matchmaker

- Government scheme database
- Eligibility verification
- Auto-generated application summaries
- Scheme recommendation engine

---

# Technical Architecture

| Layer | Technologies |
|--------|--------------|
| **Frontend** | React (Vite), Tailwind CSS, shadcn/ui, Framer Motion |
| **Authentication** | Firebase Authentication |
| **Database** | Cloud Firestore with Offline Persistence |
| **Storage** | Firebase Storage |
| **Progressive Web App** | vite-plugin-pwa |
| **Voice Processing** | Web Speech API |
| **Internationalization** | i18next |
| **QR Generation** | react-qr-code |
| **Integrity Verification** | js-sha256 |

## Architecture Highlights

- Serverless Firebase-based backend with minimal operational overhead.
- Offline-first architecture using Firestore offline persistence for uninterrupted usage.
- Client-side Coalition Capacity Engine enabling distributed order aggregation.
- On-device voice processing through the Web Speech API for responsive multilingual interaction.
- Vintage handloom-inspired user interface designed specifically for rural accessibility.
- JSON-based multilingual translation files managed through i18next for seamless language switching.

---

# Installation & Local Setup

## Prerequisites

- Node.js
- npm
- Firebase Project
  - Authentication enabled
  - Cloud Firestore enabled
  - Firebase Storage enabled

## Installation

### Clone the repository

```bash
git clone https://github.com/your-username/ekatva.git
cd ekatva
```

### Install dependencies

```bash
npm install
```

### Configure Firebase

Create your Firebase configuration file and add your Firebase project credentials.

```javascript
// firebase.js

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### Start development server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

# Demonstration Flow

1. Secretary registers a new weaver and generates a digital QR identity card.
2. Weaver requests raw material using the Job Sakhi voice assistant.
3. Secretary reviews and consolidates procurement indents.
4. Bulk procurement order is generated using predictive recommendations.
5. Secretary creates a digital job card and assigns work.
6. Weaver starts and completes production using voice commands.
7. Quality Control verifies the finished product and records checkpoints.
8. QR code is generated with complete production and wage traceability.
9. Buyer submits an RFQ, triggering coalition formation for large-scale fulfillment.
10. Buyer scans the QR code to view transparent product history and fair-wage information.
11. Government Scheme Matchmaker identifies eligible schemes and pre-fills application summaries for the weaver.

---

# Future Roadmap

- Pilot deployment with real weaving cooperatives
- UPI payment integration for seamless wage disbursement
- AI Design Copilot for pattern recommendations
- Blockchain-backed authenticity certificates
- Expansion to handicrafts, handicloom, pottery, bamboo, and other artisan sectors
- State-level analytics dashboards for cooperative federations and government agencies

---

## Vision

Ekatva envisions a future where every weaving cooperative, regardless of size or location, has access to powerful digital tools that improve transparency, collaboration, market access, and financial security. By combining offline-first technology, multilingual accessibility, intelligent automation, and community-driven innovation, Ekatva transforms traditional handloom ecosystems into connected, resilient, and economically empowered networks.

Together, every loom becomes part of a larger, stronger weave.
