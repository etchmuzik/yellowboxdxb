//
//  MealDataManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Meal data management with local persistence and CloudKit sync
//

import SwiftUI

// Enhanced data manager with UserDefaults persistence and CloudKit sync
class MealDataManager: ObservableObject {
    @Published var todaysMeals: [SimpleMeal] = []
    @Published var totalCalories: Int = 0
    
    // Smart connection properties
    @Published var lastLoggedMeal: SimpleMeal?
    @Published var shouldCelebrate: Bool = false
    @Published var celebrationMessage: String = ""
    
    var onMealLogged: ((SimpleMeal, String) -> Void)?
    
    private let userDefaults = UserDefaults.standard
    private let mealsKey = "todaysMeals"
    private let dateKey = "lastSavedDate"
    private let cloudKit = CloudKitManager.shared
    private let supabaseService = SupabaseNutritionService.shared
    
    init() {
        loadTodaysMeals()
        syncWithCloud()
        Task { await syncWithSupabaseMeals() }
    }
    
    func loadTodaysMeals() {
        // Check if we need to clear old data
        if let lastSavedDate = userDefaults.object(forKey: dateKey) as? Date {
            if !Calendar.current.isDateInToday(lastSavedDate) {
                // Clear old meals if not from today
                todaysMeals = []
                saveMeals()
                return
            }
        }
        
        // Load saved meals
        if let data = userDefaults.data(forKey: mealsKey),
           let decoded = try? JSONDecoder().decode([SimpleMeal].self, from: data) {
            todaysMeals = decoded
        }
        
        updateTotalCalories()
    }
    
    func addMeal(name: String, calories: Int, protein: Double = 0, carbs: Double = 0, fat: Double = 0, source: String = "") {
        let timestamp = Date()
        let time = timestamp.formatted(date: .omitted, time: .shortened)
        let meal = SimpleMeal(
            name: name,
            calories: calories,
            time: time,
            protein: protein,
            carbs: carbs,
            fat: fat
        )
        todaysMeals.append(meal)
        lastLoggedMeal = meal
        updateTotalCalories()
        saveMeals()
        
        // Sync with HealthKit
        Task {
            await HealthKitManager.shared.saveMealNutrition(meal: meal)
        }
        
        // Sync with CloudKit
        Task {
            do {
                try await cloudKit.saveMealToCloud(meal)
            } catch {
                print("Failed to sync meal to cloud: \(error)")
            }
        }
        Task {
            await supabaseService.createMeal(meal, loggedAt: timestamp)
        }
        
        // Trigger smart connections
        onMealLogged?(meal, source)
        checkForCelebrations()
    }
    
    private func checkForCelebrations() {
        // Simple celebration logic - can be expanded
        if todaysMeals.count == 1 {
            triggerCelebration("🎉 First meal logged today!")
        } else if todaysMeals.count == 3 {
            triggerCelebration("🔥 Three meals tracked - great consistency!")
        } else if totalCalories >= 500 && totalCalories <= 600 {
            triggerCelebration("💪 Halfway to your goal!")
        }
    }
    
    private func triggerCelebration(_ message: String) {
        celebrationMessage = message
        shouldCelebrate = true
        
        // Auto-dismiss celebration after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.shouldCelebrate = false
        }
    }
    
    private func saveMeals() {
        if let encoded = try? JSONEncoder().encode(todaysMeals) {
            userDefaults.set(encoded, forKey: mealsKey)
            userDefaults.set(Date(), forKey: dateKey)
        }
    }
    
    private func updateTotalCalories() {
        totalCalories = todaysMeals.reduce(0) { $0 + $1.calories }
    }
    
    // CloudKit sync methods
    func syncWithCloud() {
        guard cloudKit.isAvailable else { return }
        
        Task {
            do {
                // Fetch meals from CloudKit
                let cloudMeals = try await cloudKit.fetchMealsFromCloud()
                
                await MainActor.run {
                    // Merge cloud meals with local meals (avoiding duplicates)
                    for cloudMeal in cloudMeals {
                        if !todaysMeals.contains(where: { $0.id == cloudMeal.id }) {
                            // Only add today's meals
                            let mealDate = parseMealDate(from: cloudMeal.time)
                            if Calendar.current.isDateInToday(mealDate) {
                                todaysMeals.append(cloudMeal)
                            }
                        }
                    }
                    
                    updateTotalCalories()
                    saveMeals()
                }
            } catch {
                print("Failed to sync with cloud: \(error)")
            }
        }
    }
    
    func syncWithSupabaseMeals() async {
        let remoteMeals = await supabaseService.fetchMeals(for: Date())
        guard !remoteMeals.isEmpty else { return }
        await MainActor.run {
            var merged = todaysMeals
            for meal in remoteMeals {
                if !merged.contains(where: { $0.id == meal.id }) {
                    merged.append(meal)
                }
            }
            todaysMeals = merged
            updateTotalCalories()
            saveMeals()
        }
    }
    
    func deleteMeal(_ meal: SimpleMeal) {
        todaysMeals.removeAll { $0.id == meal.id }
        updateTotalCalories()
        saveMeals()
        
        // Delete from CloudKit
        Task {
            do {
                try await cloudKit.deleteMealFromCloud(meal.id)
            } catch {
                print("Failed to delete meal from cloud: \(error)")
            }
        }
        Task {
            await supabaseService.deleteMeal(meal)
        }
    }
    
    private func parseMealDate(from timeString: String) -> Date {
        // Parse the time string to get today's date with that time
        // For simplicity, assuming meals are from today
        return Date()
    }
}
