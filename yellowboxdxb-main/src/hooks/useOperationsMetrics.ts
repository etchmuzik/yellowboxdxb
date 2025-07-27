import { useMemo } from 'react';
import { Rider, Bike, ApplicationStage } from '@/types';

interface OperationsMetrics {
  activeRiders: number;
  pendingRiders: number;
  ridersInTraining: number;
  availableBikes: number;
  assignedBikes: number;
  maintenanceBikes: number;
  ridersByStage: Record<ApplicationStage, number>;
  ridersNeedingAttention: Rider[];
  avgOnboardingTime: number;
  testPassRate: number;
}

export function useOperationsMetrics(riders: Rider[], bikes: Bike[]): OperationsMetrics {
  return useMemo(() => {
    const activeRiders = riders.filter(r => r.applicationStage === 'Active').length;
    const pendingRiders = riders.filter(r => 
      r.applicationStage !== 'Active' && r.applicationStage !== 'ID Issued'
    ).length;
    const ridersInTraining = riders.filter(r => 
      r.applicationStage === 'Theory Test' || r.applicationStage === 'Road Test'
    ).length;

    const availableBikes = bikes.filter(b => b.status === 'Available').length;
    const assignedBikes = bikes.filter(b => b.status === 'Assigned').length;
    const maintenanceBikes = bikes.filter(b => b.status === 'Maintenance').length;

    const ridersByStage = riders.reduce((acc, rider) => {
      acc[rider.applicationStage] = (acc[rider.applicationStage] || 0) + 1;
      return acc;
    }, {} as Record<ApplicationStage, number>);

    const ridersNeedingAttention = riders.filter(r => {
      if (r.testStatus.theory === 'Fail' || r.testStatus.road === 'Fail') return true;
      
      const daysSinceJoin = Math.floor(
        (new Date().getTime() - new Date(r.joinDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (r.applicationStage === 'Applied' && daysSinceJoin > 7) return true;
      if (r.applicationStage === 'Docs Verified' && daysSinceJoin > 14) return true;
      
      return false;
    }).slice(0, 5);

    const avgOnboardingTime = riders
      .filter(r => r.applicationStage === 'Active')
      .reduce((acc, rider) => {
        const days = Math.floor(
          (new Date(rider.expectedStart).getTime() - new Date(rider.joinDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return acc + days;
      }, 0) / (activeRiders || 1);

    const testPassRate = riders.reduce((acc, rider) => {
      const tests = [rider.testStatus.theory, rider.testStatus.road, rider.testStatus.medical];
      const passedTests = tests.filter(t => t === 'Pass').length;
      return acc + (passedTests / 3);
    }, 0) / (riders.length || 1) * 100;

    return {
      activeRiders,
      pendingRiders,
      ridersInTraining,
      availableBikes,
      assignedBikes,
      maintenanceBikes,
      ridersByStage,
      ridersNeedingAttention,
      avgOnboardingTime,
      testPassRate
    };
  }, [riders, bikes]);
}