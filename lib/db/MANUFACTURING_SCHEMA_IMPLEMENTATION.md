# Manufacturing Database Schema Implementation

## Overview
This document describes the manufacturing database schema implementation for Task 38.1.

## Implementation Date
November 1, 2025

## Tables Added

### 1. Machines Table
Tracks all manufacturing equipment and machinery.

**Fields:**
- `id`: Unique identifier
- `machineId`: Machine identifier (e.g., "M-001")
- `name`: Machine name
- `type`: Machine type (packaging, filling, labeling, mixing, etc.)
- `manufacturer`: Equipment manufacturer
- `model`: Model number
- `serialNumber`: Serial number
- `location`: Production line or area
- `status`: Machine status (running, idle, maintenance, down, offline)
- `capacity`: Units per hour capacity
- `currentSpeed`: Current production speed
- `targetSpeed`: Target production speed
- `installDate`: Installation date
- `lastMaintenanceDate`: Last maintenance date
- `nextMaintenanceDate`: Next scheduled maintenance
- `operatorId`: Current operator employee ID
- `specifications`: Additional specifications (JSON)
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `[type+status]`: Query machines by type and status
- `[location+status]`: Query machines by location
- `[status+operatorId]`: Query by status and operator
- `[nextMaintenanceDate+status]`: Maintenance scheduling

### 2. ProductionRuns Table
Tracks individual production runs on machines.

**Fields:**
- `id`: Unique identifier
- `runId`: Production run identifier
- `machineId`: Reference to machine
- `productId`: Reference to product being produced
- `orderId`: Optional reference to sales order
- `startTime`: Run start time
- `endTime`: Run end time
- `targetQuantity`: Target production quantity
- `actualQuantity`: Actual quantity produced
- `goodQuantity`: Quantity that passed quality
- `rejectedQuantity`: Quantity rejected
- `status`: Run status (scheduled, in-progress, paused, completed, cancelled)
- `operatorId`: Operator employee ID
- `notes`: Additional notes
- `createdAt`: Timestamp

**Indexes:**
- `[machineId+status]`: Query runs by machine
- `[productId+startTime]`: Query runs by product
- `[orderId+status]`: Link to sales orders
- `[operatorId+startTime]`: Operator performance
- `[status+startTime]`: Active runs
- `[machineId+startTime]`: Machine history

### 3. MachineDowntime Table
Tracks machine downtime events for OEE calculation.

**Fields:**
- `id`: Unique identifier
- `machineId`: Reference to machine
- `startTime`: Downtime start
- `endTime`: Downtime end
- `reason`: Downtime reason
- `category`: Category (planned, unplanned, breakdown, changeover, no-operator)
- `impact`: Production impact description
- `resolvedBy`: Employee ID who resolved
- `notes`: Additional notes
- `createdAt`: Timestamp

**Indexes:**
- `[machineId+startTime]`: Machine downtime history
- `[category+startTime]`: Downtime analysis by category
- `[machineId+category]`: Machine-specific patterns
- `[resolvedBy+startTime]`: Technician performance

### 4. MaintenanceSchedule Table
Tracks planned and executed maintenance activities.

**Fields:**
- `id`: Unique identifier
- `machineId`: Reference to machine
- `maintenanceType`: Type (preventive, corrective, predictive, emergency)
- `scheduledDate`: Scheduled date
- `completedDate`: Completion date
- `technician`: Technician employee ID or name
- `tasks`: List of maintenance tasks
- `parts`: Parts used or replaced
- `cost`: Maintenance cost
- `status`: Status (scheduled, in-progress, completed, cancelled)
- `notes`: Additional notes
- `createdAt`: Timestamp

**Indexes:**
- `[machineId+status]`: Machine maintenance history
- `[maintenanceType+status]`: Maintenance type analysis
- `[scheduledDate+status]`: Maintenance calendar
- `[technician+scheduledDate]`: Technician workload
- `[status+scheduledDate]`: Upcoming maintenance

### 5. MachineMetrics Table
Stores real-time and historical machine performance metrics.

**Fields:**
- `id`: Unique identifier
- `machineId`: Reference to machine
- `timestamp`: Metric timestamp
- `oee`: Overall Equipment Effectiveness (0-100%)
- `availability`: Availability percentage
- `performance`: Performance percentage
- `quality`: Quality percentage
- `cycleTime`: Seconds per unit
- `downtime`: Minutes of downtime
- `output`: Units produced
- `energyConsumption`: Energy consumption in kWh
- `createdAt`: Timestamp

**Indexes:**
- `[machineId+timestamp]`: Time-series data
- `[timestamp+machineId]`: Cross-machine analysis
- `[machineId+oee]`: Performance tracking

## Type Definitions Added

### Enums
- `MachineStatus`: running | idle | maintenance | down | offline
- `ProductionRunStatus`: scheduled | in-progress | paused | completed | cancelled
- `DowntimeCategory`: planned | unplanned | breakdown | changeover | no-operator
- `MaintenanceType`: preventive | corrective | predictive | emergency
- `MaintenanceStatus`: scheduled | in-progress | completed | cancelled

### Interfaces
- `Machine`: Complete machine definition
- `ProductionRun`: Production run tracking
- `MachineDowntime`: Downtime event tracking
- `MaintenanceSchedule`: Maintenance activity tracking
- `MachineMetrics`: Performance metrics

## Integration Points

### Links to Existing Tables
- **Products**: `ProductionRuns.productId` links to products being manufactured
- **Orders**: `ProductionRuns.orderId` links to sales orders
- **Employees**: `Machine.operatorId`, `ProductionRun.operatorId`, `MaintenanceSchedule.technician` link to employees
- **Rejections**: Quality data from production runs links to rejection tracking

### Database Operations
All manufacturing tables are integrated into:
- `clearAllData()`: Clears all manufacturing data
- `getStats()`: Returns counts for all manufacturing tables
- `exportAllData()`: Exports manufacturing data for backup
- `importAllData()`: Imports manufacturing data from backup

### Automatic Hooks
- **Machines**: Auto-sets createdAt, updatedAt, status='idle', installDate
- **ProductionRuns**: Auto-sets createdAt, startTime, status='scheduled', initializes quantities to 0
- **MachineDowntime**: Auto-sets createdAt, startTime
- **MaintenanceSchedule**: Auto-sets createdAt, status='scheduled', initializes tasks array
- **MachineMetrics**: Auto-sets createdAt, timestamp

## OEE Calculation Support

The schema supports OEE (Overall Equipment Effectiveness) calculation:

**OEE = Availability × Performance × Quality**

- **Availability**: Calculated from `MachineDowntime` data
- **Performance**: Calculated from `ProductionRun` actual vs target speed
- **Quality**: Calculated from `ProductionRun` good vs total quantity

## Files Modified

1. **types/database.ts**
   - Added manufacturing type definitions
   - Added 5 new enums
   - Added 5 new interfaces

2. **lib/db/schema.ts**
   - Added 5 new table declarations
   - Added schema definitions with compound indexes
   - Added automatic hooks for all tables
   - Updated clearAllData() method
   - Updated getStats() method
   - Updated exportAllData() method
   - Updated importAllData() method

## Next Steps

The following tasks can now be implemented:
- Task 38.2: Create machine management interface
- Task 38.3: Implement OEE tracking and analytics
- Task 38.4: Create production planning and scheduling
- Task 38.5: Implement maintenance management system
- Task 38.6: Create manufacturing analytics dashboard

## Requirements Met

✅ Add Machines table with all specified fields
✅ Add ProductionRuns table with all specified fields
✅ Add MachineDowntime table with all specified fields
✅ Add MaintenanceSchedule table with all specified fields
✅ Add MachineMetrics table with all specified fields
✅ Create compound indexes for machineId, timestamp, status, and productId
✅ Update lib/db/schema.ts to include all manufacturing tables
✅ Integration with Products, Orders, Employees, Rejections tables
