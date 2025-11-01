# Manufacturing Operations Management

## Overview
This module provides comprehensive machine management capabilities for manufacturing operations, including real-time monitoring, production tracking, and performance analytics.

## Implemented Features (Task 38.2)

### Machine Management Interface
- **Machines List Page** (`/manufacturing/machines`)
  - Real-time status dashboard with 5 status categories (Running, Idle, Maintenance, Down, Offline)
  - Status overview cards showing machine counts by status
  - Advanced filtering by search term, status, and machine type
  - Machine cards displaying key information:
    - Machine name, ID, and status badge
    - Type, location, and capacity
    - Current speed vs target speed
    - Performance indicator bar
    - Next maintenance date
  - Responsive grid layout (1-3 columns based on screen size)
  - Empty state with call-to-action for adding first machine

- **Machine Detail Page** (`/manufacturing/machines/[id]`)
  - Comprehensive machine overview with key metrics:
    - Current status with visual indicator
    - 30-day uptime percentage
    - Average OEE (Overall Equipment Effectiveness)
    - Performance percentage
  - Current production run monitoring:
    - Run ID, product, target/actual quantities
    - Progress bar with percentage
    - Control buttons (Pause, Stop)
  - Tabbed interface with 5 sections:
    1. **Specifications**: Complete machine details (manufacturer, model, serial number, capacity, dates)
    2. **Production History**: Recent production runs with status, quantities, and dates
    3. **Downtime**: Downtime events with category, reason, duration, and impact
    4. **Maintenance**: Maintenance history with type, tasks, costs, and technician
    5. **Performance Metrics**: OEE components (Availability, Performance, Quality) with 24-hour history

- **Add Machine Page** (`/manufacturing/machines/new`)
  - Comprehensive form with 4 sections:
    1. Basic Information (Machine ID, Name, Type, Location)
    2. Manufacturer Details (Manufacturer, Model, Serial Number)
    3. Capacity & Performance (Capacity, Target Speed, Current Speed)
    4. Status & Dates (Initial Status, Install Date)
  - Form validation with required fields
  - Duplicate machine ID detection
  - Success/error notifications

## Database Integration
- Uses existing manufacturing tables from `lib/db/schema.ts`:
  - `machines`: Machine specifications and status
  - `productionRuns`: Production execution tracking
  - `machineDowntime`: Downtime event logging
  - `maintenanceSchedule`: Maintenance planning and history
  - `machineMetrics`: Performance metrics and OEE data

## Key Features
- **Real-time Status Monitoring**: Visual indicators for machine status
- **Performance Tracking**: Speed, capacity, and efficiency metrics
- **Production Monitoring**: Current and historical production runs
- **Downtime Analysis**: Track and categorize machine downtime
- **Maintenance History**: Complete maintenance records
- **OEE Calculation**: Availability × Performance × Quality metrics
- **Responsive Design**: Mobile-friendly interface
- **Search & Filter**: Quick access to specific machines

## Implemented Features (Task 38.3)

### OEE Tracking and Analytics
- **OEE Monitoring Dashboard** (`/manufacturing/oee`)
  - Real-time OEE calculation: OEE = Availability × Performance × Quality
  - Machine and time range selection filters
  - Four key metric cards:
    - Overall OEE with target comparison and status badge
    - Availability (uptime vs planned production time)
    - Performance (speed vs target speed)
    - Quality (good units vs total units)
  - OEE trend chart with area visualization:
    - Shows OEE, Availability, Performance, and Quality over time
    - Target reference line for comparison
    - Configurable intervals (hourly, daily, weekly)
  - Tabbed breakdown views:
    1. **By Machine**: Bar chart comparing OEE across all machines
    2. **By Product**: Bar chart showing OEE by product type
    3. **Alerts**: List of machines below OEE threshold (default 85%)
    4. **AI Insights**: Gemini AI-powered analysis and recommendations
  - Alert system:
    - Automatic detection of machines below threshold
    - Severity levels (warning/critical)
    - Detailed breakdown of OEE components
  - AI-powered insights:
    - Pattern analysis and trend identification
    - Specific recommendations for improvement
    - Best practice identification from top performers
  - Auto-refresh every 5 minutes
  - Export functionality for reports

### Manufacturing Analytics Service
- **OEE Calculation Engine** (`services/analytics/manufacturing.ts`)
  - `calculateOEE()`: Comprehensive OEE calculation for any machine and time period
  - `getOEEByMachine()`: Breakdown of OEE across all machines
  - `getOEEByProduct()`: Breakdown of OEE by product type
  - `getOEETrend()`: Historical OEE trends with configurable intervals
  - `getOEEAlerts()`: Automatic alert generation for underperforming machines
  - `storeMachineMetrics()`: Persist calculated metrics to database
  - `getHistoricalMetrics()`: Retrieve historical performance data
  - Integrates with ProductionRuns, MachineDowntime, and Rejections data
  - Handles planned vs unplanned downtime
  - Calculates ideal cycle time based on machine capacity
  - Supports multiple time intervals (hour, day, week)

## Next Steps (Remaining Tasks)
- **Task 38.4**: Production planning and scheduling with Gantt charts
- **Task 38.5**: Maintenance management system with predictive maintenance
- **Task 38.6**: Manufacturing analytics dashboard with AI insights

## Technical Stack
- **Framework**: Next.js 14 with App Router
- **Database**: Dexie.js (IndexedDB)
- **UI Components**: shadcn/ui (Card, Button, Input, Select, Badge, Tabs)
- **Icons**: Lucide React
- **Notifications**: react-hot-toast
- **TypeScript**: Full type safety with database types

## Usage
1. Navigate to `/manufacturing/machines` to view all machines
2. Click on a machine card to view detailed information
3. Use filters to find specific machines by status or type
4. Click "Add Machine" to register a new machine
5. View production runs, downtime, maintenance, and metrics in the detail page tabs

## Integration Points
- Links to Products for production runs
- Links to Orders for work order tracking
- Links to Employees for operator and technician assignment
- Links to Inventory for spare parts management (future)
- Links to Quality Control for rejection tracking (future)
