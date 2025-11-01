/**
 * Manufacturing Analytics Service
 * 
 * Provides OEE (Overall Equipment Effectiveness) tracking and analytics
 * OEE = Availability × Performance × Quality
 */

import { db } from '@/lib/db/schema';
import type { 
  Machine, 
  ProductionRun, 
  MachineDowntime, 
  MachineMetrics 
} from '@/types/database';

/**
 * OEE Calculation Result
 */
export interface OEEResult {
  oee: number; // Overall Equipment Effectiveness (0-100%)
  availability: number; // Percentage (0-100%)
  performance: number; // Percentage (0-100%)
  quality: number; // Percentage (0-100%)
  
  // Supporting data
  plannedProductionTime: number; // Minutes
  actualRunTime: number; // Minutes
  downtime: number; // Minutes
  idealCycleTime: number; // Minutes per unit
  totalUnitsProduced: number;
  goodUnitsProduced: number;
  rejectedUnits: number;
}

/**
 * OEE Breakdown by dimension
 */
export interface OEEBreakdown {
  dimension: string; // machine, shift, product, period
  value: string; // specific value (machine ID, shift name, etc.)
  oee: OEEResult;
  timestamp?: Date;
}

/**
 * OEE Trend Data Point
 */
export interface OEETrendPoint {
  timestamp: Date;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  target: number;
}

/**
 * OEE Alert
 */
export interface OEEAlert {
  id: string;
  machineId: string;
  machineName: string;
  oee: number;
  threshold: number;
  timestamp: Date;
  severity: 'warning' | 'critical';
  message: string;
}

/**
 * Manufacturing Analytics Service
 */
export class ManufacturingAnalyticsService {
  /**
   * Calculate OEE for a specific machine and time period
   * OEE = Availability × Performance × Quality
   */
  async calculateOEE(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OEEResult> {
    // Get production runs for the period
    const productionRuns = await db.productionRuns
      .where('machineId')
      .equals(machineId)
      .and(run => {
        const runStart = new Date(run.startTime);
        return runStart >= startDate && runStart <= endDate;
      })
      .toArray();

    // Get machine downtime for the period
    const downtimeRecords = await db.machineDowntime
      .where('machineId')
      .equals(machineId)
      .and(downtime => {
        const downtimeStart = new Date(downtime.startTime);
        return downtimeStart >= startDate && downtimeStart <= endDate;
      })
      .toArray();

    // Get machine details for capacity
    const machine = await db.machines.get(machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} not found`);
    }

    // Calculate planned production time (total time minus planned downtime)
    const totalTime = (endDate.getTime() - startDate.getTime()) / (1000 * 60); // Minutes
    const plannedDowntime = downtimeRecords
      .filter(d => d.category === 'planned')
      .reduce((sum, d) => {
        const start = new Date(d.startTime);
        const end = d.endTime ? new Date(d.endTime) : new Date();
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
    
    const plannedProductionTime = totalTime - plannedDowntime;

    // Calculate actual run time (planned production time minus unplanned downtime)
    const unplannedDowntime = downtimeRecords
      .filter(d => d.category !== 'planned')
      .reduce((sum, d) => {
        const start = new Date(d.startTime);
        const end = d.endTime ? new Date(d.endTime) : new Date();
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
    
    const actualRunTime = plannedProductionTime - unplannedDowntime;

    // Calculate Availability = (Actual Run Time / Planned Production Time) × 100
    const availability = plannedProductionTime > 0 
      ? (actualRunTime / plannedProductionTime) * 100 
      : 0;

    // Calculate total units produced and good units
    const totalUnitsProduced = productionRuns.reduce(
      (sum, run) => sum + run.actualQuantity, 
      0
    );
    const goodUnitsProduced = productionRuns.reduce(
      (sum, run) => sum + run.goodQuantity, 
      0
    );
    const rejectedUnits = productionRuns.reduce(
      (sum, run) => sum + run.rejectedQuantity, 
      0
    );

    // Calculate ideal cycle time (minutes per unit at target speed)
    const idealCycleTime = machine.targetSpeed > 0 
      ? 60 / machine.targetSpeed 
      : 0;

    // Calculate Performance = (Ideal Cycle Time × Total Units) / Actual Run Time × 100
    const idealProductionTime = idealCycleTime * totalUnitsProduced;
    const performance = actualRunTime > 0 
      ? (idealProductionTime / actualRunTime) * 100 
      : 0;

    // Calculate Quality = (Good Units / Total Units) × 100
    const quality = totalUnitsProduced > 0 
      ? (goodUnitsProduced / totalUnitsProduced) * 100 
      : 0;

    // Calculate OEE = Availability × Performance × Quality / 10000
    const oee = (availability * performance * quality) / 10000;

    return {
      oee: Math.min(oee, 100), // Cap at 100%
      availability: Math.min(availability, 100),
      performance: Math.min(performance, 100),
      quality: Math.min(quality, 100),
      plannedProductionTime,
      actualRunTime,
      downtime: unplannedDowntime,
      idealCycleTime,
      totalUnitsProduced,
      goodUnitsProduced,
      rejectedUnits,
    };
  }

  /**
   * Get OEE breakdown by machine
   */
  async getOEEByMachine(
    startDate: Date,
    endDate: Date
  ): Promise<OEEBreakdown[]> {
    const machines = await db.machines.toArray();
    const breakdowns: OEEBreakdown[] = [];

    for (const machine of machines) {
      try {
        const oee = await this.calculateOEE(machine.id, startDate, endDate);
        breakdowns.push({
          dimension: 'machine',
          value: machine.name,
          oee,
        });
      } catch (error) {
        console.error(`Error calculating OEE for machine ${machine.id}:`, error);
      }
    }

    return breakdowns.sort((a, b) => b.oee.oee - a.oee.oee);
  }

  /**
   * Get OEE breakdown by product
   */
  async getOEEByProduct(
    startDate: Date,
    endDate: Date
  ): Promise<OEEBreakdown[]> {
    // Get all production runs in the period
    const productionRuns = await db.productionRuns
      .where('startTime')
      .between(startDate, endDate, true, true)
      .toArray();

    // Group by product
    const productGroups = new Map<string, ProductionRun[]>();
    for (const run of productionRuns) {
      if (!productGroups.has(run.productId)) {
        productGroups.set(run.productId, []);
      }
      productGroups.get(run.productId)!.push(run);
    }

    const breakdowns: OEEBreakdown[] = [];

    for (const [productId, runs] of productGroups) {
      const product = await db.products.get(productId);
      if (!product) continue;

      // Calculate aggregate OEE for this product across all machines
      const totalUnits = runs.reduce((sum, r) => sum + r.actualQuantity, 0);
      const goodUnits = runs.reduce((sum, r) => sum + r.goodQuantity, 0);
      const quality = totalUnits > 0 ? (goodUnits / totalUnits) * 100 : 0;

      // Get machine IDs for these runs
      const machineIds = [...new Set(runs.map(r => r.machineId))];
      
      // Calculate average availability and performance across machines
      let totalAvailability = 0;
      let totalPerformance = 0;
      let machineCount = 0;

      for (const machineId of machineIds) {
        try {
          const machineOEE = await this.calculateOEE(machineId, startDate, endDate);
          totalAvailability += machineOEE.availability;
          totalPerformance += machineOEE.performance;
          machineCount++;
        } catch (error) {
          console.error(`Error calculating OEE for machine ${machineId}:`, error);
        }
      }

      const avgAvailability = machineCount > 0 ? totalAvailability / machineCount : 0;
      const avgPerformance = machineCount > 0 ? totalPerformance / machineCount : 0;
      const oee = (avgAvailability * avgPerformance * quality) / 10000;

      breakdowns.push({
        dimension: 'product',
        value: product.name,
        oee: {
          oee: Math.min(oee, 100),
          availability: avgAvailability,
          performance: avgPerformance,
          quality,
          plannedProductionTime: 0,
          actualRunTime: 0,
          downtime: 0,
          idealCycleTime: 0,
          totalUnitsProduced: totalUnits,
          goodUnitsProduced: goodUnits,
          rejectedUnits: totalUnits - goodUnits,
        },
      });
    }

    return breakdowns.sort((a, b) => b.oee.oee - a.oee.oee);
  }

  /**
   * Get OEE trend over time
   */
  async getOEETrend(
    machineId: string,
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' = 'day',
    target: number = 85
  ): Promise<OEETrendPoint[]> {
    const trends: OEETrendPoint[] = [];
    
    // Calculate interval duration in milliseconds
    const intervalMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    }[interval];

    let currentStart = new Date(startDate);
    
    while (currentStart < endDate) {
      const currentEnd = new Date(Math.min(
        currentStart.getTime() + intervalMs,
        endDate.getTime()
      ));

      try {
        const oee = await this.calculateOEE(machineId, currentStart, currentEnd);
        trends.push({
          timestamp: new Date(currentStart),
          oee: oee.oee,
          availability: oee.availability,
          performance: oee.performance,
          quality: oee.quality,
          target,
        });
      } catch (error) {
        console.error(`Error calculating OEE trend for ${currentStart}:`, error);
      }

      currentStart = currentEnd;
    }

    return trends;
  }

  /**
   * Get OEE alerts for machines below threshold
   */
  async getOEEAlerts(
    threshold: number = 85,
    startDate?: Date,
    endDate?: Date
  ): Promise<OEEAlert[]> {
    const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || new Date();

    const machines = await db.machines.where('status').equals('running').toArray();
    const alerts: OEEAlert[] = [];

    for (const machine of machines) {
      try {
        const oee = await this.calculateOEE(machine.id, start, end);
        
        if (oee.oee < threshold) {
          const severity = oee.oee < threshold * 0.8 ? 'critical' : 'warning';
          
          alerts.push({
            id: `oee-alert-${machine.id}-${Date.now()}`,
            machineId: machine.id,
            machineName: machine.name,
            oee: oee.oee,
            threshold,
            timestamp: new Date(),
            severity,
            message: `OEE (${oee.oee.toFixed(1)}%) is below threshold (${threshold}%). ` +
                    `Availability: ${oee.availability.toFixed(1)}%, ` +
                    `Performance: ${oee.performance.toFixed(1)}%, ` +
                    `Quality: ${oee.quality.toFixed(1)}%`,
          });
        }
      } catch (error) {
        console.error(`Error checking OEE alert for machine ${machine.id}:`, error);
      }
    }

    return alerts.sort((a, b) => a.oee - b.oee);
  }

  /**
   * Store calculated OEE metrics in the database
   */
  async storeMachineMetrics(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const oee = await this.calculateOEE(machineId, startDate, endDate);
    
    await db.machineMetrics.add({
      id: `metric-${machineId}-${Date.now()}`,
      machineId,
      timestamp: new Date(),
      oee: oee.oee,
      availability: oee.availability,
      performance: oee.performance,
      quality: oee.quality,
      cycleTime: oee.idealCycleTime,
      downtime: oee.downtime,
      output: oee.totalUnitsProduced,
      createdAt: new Date(),
    });
  }

  /**
   * Get historical OEE metrics from database
   */
  async getHistoricalMetrics(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MachineMetrics[]> {
    return await db.machineMetrics
      .where('machineId')
      .equals(machineId)
      .and(metric => {
        const timestamp = new Date(metric.timestamp);
        return timestamp >= startDate && timestamp <= endDate;
      })
      .sortBy('timestamp');
  }
}

// Export singleton instance
export const manufacturingAnalytics = new ManufacturingAnalyticsService();
