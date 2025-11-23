//
//  HealthKitManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  HealthKit integration manager for health data synchronization
//

import HealthKit
import SwiftUI

@MainActor
class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()
    
    private let healthStore = HKHealthStore()
    private let supabaseService = SupabaseNutritionService.shared
    @Published var isAuthorized = false
    @Published var latestWeight: Double?
    @Published var todaysWorkoutCalories: Int = 0
    @Published var todaysWaterIntake: Double = 0
    
    // HealthKit data types we want to access
    private let nutritionTypes: Set<HKSampleType> = [
        HKQuantityType(.dietaryEnergyConsumed),
        HKQuantityType(.dietaryProtein),
        HKQuantityType(.dietaryCarbohydrates),
        HKQuantityType(.dietaryFatTotal),
        HKQuantityType(.dietaryWater)
    ]
    
    private let readTypes: Set<HKObjectType> = [
        HKQuantityType(.bodyMass),
        HKQuantityType(.activeEnergyBurned),
        HKQuantityType(.dietaryWater),
        HKWorkoutType.workoutType()
    ]
    
    private let writeTypes: Set<HKSampleType> = [
        HKQuantityType(.dietaryEnergyConsumed),
        HKQuantityType(.dietaryProtein),
        HKQuantityType(.dietaryCarbohydrates),
        HKQuantityType(.dietaryFatTotal),
        HKQuantityType(.dietaryWater),
        HKWorkoutType.workoutType()
    ]
    
    init() {
        checkHealthKitAvailability()
    }
    
    // Check if HealthKit is available
    private func checkHealthKitAvailability() {
        if HKHealthStore.isHealthDataAvailable() {
            requestAuthorization()
        } else {
            Task { await self.loadSupabaseWaterBackup() }
        }
    }
    
    // Request HealthKit authorization
    func requestAuthorization() {
        healthStore.requestAuthorization(toShare: writeTypes, read: readTypes) { success, error in
            Task { @MainActor in
                self.isAuthorized = success
                if success {
                    self.loadLatestWeight()
                    self.loadTodaysWorkouts()
                    self.loadTodaysWater()
                } else {
                    await self.loadSupabaseWaterBackup()
                }
            }
        }
    }
    
    // Save meal nutrition to HealthKit
    func saveMealNutrition(meal: SimpleMeal, date: Date = Date()) async {
        guard isAuthorized else { return }
        
        // Create nutrition samples
        let samples: [HKQuantitySample] = [
            // Calories
            HKQuantitySample(
                type: HKQuantityType(.dietaryEnergyConsumed),
                quantity: HKQuantity(unit: .kilocalorie(), doubleValue: Double(meal.calories)),
                start: date,
                end: date
            ),
            // Protein
            HKQuantitySample(
                type: HKQuantityType(.dietaryProtein),
                quantity: HKQuantity(unit: .gram(), doubleValue: meal.protein),
                start: date,
                end: date
            ),
            // Carbs
            HKQuantitySample(
                type: HKQuantityType(.dietaryCarbohydrates),
                quantity: HKQuantity(unit: .gram(), doubleValue: meal.carbs),
                start: date,
                end: date
            ),
            // Fat
            HKQuantitySample(
                type: HKQuantityType(.dietaryFatTotal),
                quantity: HKQuantity(unit: .gram(), doubleValue: meal.fat),
                start: date,
                end: date
            )
        ]
        
        // Save to HealthKit
        for sample in samples {
            do {
                try await healthStore.save(sample)
            } catch {
                print("Error saving to HealthKit: \(error)")
            }
        }
    }
    
    // Load latest weight from HealthKit
    func loadLatestWeight() {
        let weightType = HKQuantityType(.bodyMass)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(
            sampleType: weightType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            if let sample = samples?.first as? HKQuantitySample {
                let weightInKg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))
                Task { @MainActor in
                    self.latestWeight = weightInKg
                }
            }
        }
        healthStore.execute(query)
    }
    
    // Load today's workout calories
    func loadTodaysWorkouts() {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: endOfDay,
            options: .strictStartDate
        )
        
        let query = HKSampleQuery(
            sampleType: HKWorkoutType.workoutType(),
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: nil
        ) { _, samples, error in
            let totalCalories = (samples as? [HKWorkout])?.reduce(0) { total, workout in
                total + (workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0)
            } ?? 0
            
            Task { @MainActor in
                self.todaysWorkoutCalories = Int(totalCalories)
            }
        }
        healthStore.execute(query)
    }
    
    // Load today's water intake
    func loadTodaysWater() {
        let waterType = HKQuantityType(.dietaryWater)
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: endOfDay,
            options: .strictStartDate
        )
        
        let query = HKStatisticsQuery(
            quantityType: waterType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            let totalWater = result?.sumQuantity()?.doubleValue(for: .liter()) ?? 0
            Task { @MainActor in
                self.todaysWaterIntake = totalWater
            }
        }
        healthStore.execute(query)
    }

    // Save water intake
    func saveWaterIntake(liters: Double, date: Date = Date()) async {
        if isAuthorized {
            let sample = HKQuantitySample(
                type: HKQuantityType(.dietaryWater),
                quantity: HKQuantity(unit: .liter(), doubleValue: liters),
                start: date,
                end: date
            )
            do {
                try await healthStore.save(sample)
                loadTodaysWater()
            } catch {
                print("Error saving water intake: \(error)")
            }
        } else {
            await MainActor.run {
                self.todaysWaterIntake += liters
            }
        }
        await supabaseService.logWater(amount: liters, date: date)
        if !isAuthorized {
            await loadSupabaseWaterBackup()
        }
    }
    
    // MARK: - Workout Methods
    
    // Save workout to HealthKit
    func saveWorkout(_ workout: WorkoutPlan) async {
        guard isAuthorized else { return }
        
        let startDate = workout.createdAt
        let endDate = startDate.addingTimeInterval(TimeInterval(workout.estimatedDuration * 60))
        
        // Map WorkoutType to HKWorkoutActivityType
        let activityType: HKWorkoutActivityType = mapWorkoutTypeToHK(workout.type)
        
        // Create workout sample
        let workoutSample = HKWorkout(
            activityType: activityType,
            start: startDate,
            end: endDate,
            duration: workout.estimatedDuration * 60,
            totalEnergyBurned: HKQuantity(unit: .kilocalorie(), doubleValue: Double(workout.estimatedCaloriesBurned)),
            totalDistance: nil,
            metadata: [
                "name": workout.name,
                "difficulty": workout.difficulty.rawValue,
                "goal": workout.goal.rawValue,
                "exerciseCount": workout.exercises.count
            ]
        )
        
        do {
            try await healthStore.save(workoutSample)
            loadTodaysWorkouts() // Reload to update UI
        } catch {
            print("Error saving workout to HealthKit: \(error)")
        }
    }
    
    // Get recent workouts from HealthKit
    func getRecentWorkouts(days: Int) async -> [HKWorkout] {
        guard isAuthorized else { return [] }
        
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date())!
        let endDate = Date()
        
        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: .strictStartDate
        )
        
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: HKWorkoutType.workoutType(),
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { _, samples, error in
                if let workouts = samples as? [HKWorkout] {
                    continuation.resume(returning: workouts)
                } else {
                    continuation.resume(returning: [])
                }
            }
            healthStore.execute(query)
        }
    }
    
    // Get workout statistics
    func getWorkoutStatistics(days: Int) async -> WorkoutStats {
        let workouts = await getRecentWorkouts(days: days)
        
        let totalWorkouts = workouts.count
        let totalCalories = workouts.reduce(0) { total, workout in
            total + Int(workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0)
        }
        
        let totalDuration = workouts.reduce(0) { total, workout in
            total + Int(workout.duration)
        }
        let averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts / 60 : 0
        
        // Get workouts from this week
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let thisWeekWorkouts = workouts.filter { $0.startDate >= weekAgo }
        
        let averageCalories = totalWorkouts > 0 ? totalCalories / totalWorkouts : 0
        
        // Find most common type (simplified - would need to track workout types)
        let mostCommonType: WorkoutType? = nil // Would need additional tracking
        
        return WorkoutStats(
            totalWorkouts: totalWorkouts,
            totalCaloriesBurned: totalCalories,
            averageWorkoutDuration: averageDuration,
            mostCommonType: mostCommonType,
            workoutsThisWeek: thisWeekWorkouts.count,
            averageCaloriesPerWorkout: averageCalories
        )
    }
    
    // Helper: Map WorkoutType to HKWorkoutActivityType
    private func mapWorkoutTypeToHK(_ type: WorkoutType) -> HKWorkoutActivityType {
        switch type {
        case .strength:
            return .traditionalStrengthTraining
        case .cardio:
            return .running
        case .hiit:
            return .highIntensityIntervalTraining
        case .yoga:
            return .yoga
        case .stretching:
            return .flexibility
        case .mixed:
            return .crossTraining
        }
    }
    
    func loadSupabaseWaterBackup() async {
        let total = await supabaseService.fetchWaterTotal(for: Date())
        await MainActor.run {
            if !self.isAuthorized {
                self.todaysWaterIntake = total
            }
        }
    }
}
