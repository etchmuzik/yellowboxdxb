//
//  CoreDataManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Core Data persistence manager
//

import Foundation
import CoreData

class CoreDataManager: ObservableObject {
    static let shared = CoreDataManager()
    
    let container: NSPersistentContainer
    
    @Published var todaysMeals: [MealEntity] = []
    @Published var userProfile: UserProfileEntity?
    
    private init() {
        container = NSPersistentContainer(name: "SCAL")
        container.loadPersistentStores { _, error in
            if let error = error {
                print("Core Data failed to load: \(error.localizedDescription)")
            }
        }
        
        loadTodaysMeals()
        loadUserProfile()
    }
    
    // MARK: - Context
    
    var context: NSManagedObjectContext {
        container.viewContext
    }
    
    // MARK: - Save
    
    func save() {
        guard context.hasChanges else { return }
        
        do {
            try context.save()
        } catch {
            print("Failed to save Core Data: \(error)")
        }
    }
    
    // MARK: - Meal Management
    
    func addMeal(name: String, calories: Int, protein: Double = 0, carbs: Double = 0, fat: Double = 0) {
        let meal = MealEntity(context: context)
        meal.id = UUID()
        meal.name = name
        meal.calories = Int32(calories)
        meal.protein = protein
        meal.carbs = carbs
        meal.fat = fat
        meal.date = Date()
        meal.time = Date().formatted(date: .omitted, time: .shortened)
        
        save()
        loadTodaysMeals()
    }
    
    func loadTodaysMeals() {
        let request: NSFetchRequest<MealEntity> = MealEntity.fetchRequest()
        
        // Get today's date range
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        request.predicate = NSPredicate(format: "date >= %@ AND date < %@", startOfDay as NSDate, endOfDay as NSDate)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \MealEntity.date, ascending: false)]
        
        do {
            todaysMeals = try context.fetch(request)
        } catch {
            print("Failed to fetch meals: \(error)")
            todaysMeals = []
        }
    }
    
    func getMealsForDate(_ date: Date) -> [MealEntity] {
        let request: NSFetchRequest<MealEntity> = MealEntity.fetchRequest()
        
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        request.predicate = NSPredicate(format: "date >= %@ AND date < %@", startOfDay as NSDate, endOfDay as NSDate)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \MealEntity.date, ascending: false)]
        
        do {
            return try context.fetch(request)
        } catch {
            print("Failed to fetch meals for date: \(error)")
            return []
        }
    }
    
    func deleteMeal(_ meal: MealEntity) {
        context.delete(meal)
        save()
        loadTodaysMeals()
    }
    
    // MARK: - User Profile
    
    func loadUserProfile() {
        let request: NSFetchRequest<UserProfileEntity> = UserProfileEntity.fetchRequest()
        request.fetchLimit = 1
        
        do {
            userProfile = try context.fetch(request).first
            
            // Create default profile if none exists
            if userProfile == nil {
                createDefaultUserProfile()
            }
        } catch {
            print("Failed to fetch user profile: \(error)")
        }
    }
    
    func createDefaultUserProfile() {
        let profile = UserProfileEntity(context: context)
        profile.id = UUID()
        profile.name = "User"
        profile.calorieGoal = 2000
        profile.proteinGoal = 50
        profile.carbsGoal = 250
        profile.fatGoal = 65
        profile.activityLevel = "moderate"
        
        userProfile = profile
        save()
    }
    
    func updateUserProfile(name: String? = nil, 
                          calorieGoal: Int? = nil,
                          proteinGoal: Double? = nil,
                          carbsGoal: Double? = nil,
                          fatGoal: Double? = nil,
                          weight: Double? = nil,
                          height: Double? = nil,
                          age: Int? = nil,
                          gender: String? = nil,
                          activityLevel: String? = nil) {
        
        guard let profile = userProfile else { return }
        
        if let name = name { profile.name = name }
        if let calorieGoal = calorieGoal { profile.calorieGoal = Int32(calorieGoal) }
        if let proteinGoal = proteinGoal { profile.proteinGoal = proteinGoal }
        if let carbsGoal = carbsGoal { profile.carbsGoal = carbsGoal }
        if let fatGoal = fatGoal { profile.fatGoal = fatGoal }
        if let weight = weight { profile.weight = weight }
        if let height = height { profile.height = height }
        if let age = age { profile.age = Int32(age) }
        if let gender = gender { profile.gender = gender }
        if let activityLevel = activityLevel { profile.activityLevel = activityLevel }
        
        save()
    }
    
    // MARK: - Statistics
    
    func getTotalCaloriesToday() -> Int {
        todaysMeals.reduce(0) { $0 + Int($1.calories) }
    }
    
    func getTotalProteinToday() -> Double {
        todaysMeals.reduce(0) { $0 + $1.protein }
    }
    
    func getTotalCarbsToday() -> Double {
        todaysMeals.reduce(0) { $0 + $1.carbs }
    }
    
    func getTotalFatToday() -> Double {
        todaysMeals.reduce(0) { $0 + $1.fat }
    }
    
    func getWeeklyStats() -> [(date: Date, calories: Int)] {
        var stats: [(Date, Int)] = []
        let calendar = Calendar.current
        
        for dayOffset in 0..<7 {
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: Date())!
            let meals = getMealsForDate(date)
            let totalCalories = meals.reduce(0) { $0 + Int($1.calories) }
            stats.append((date, totalCalories))
        }
        
        return stats.reversed()
    }
    
    // MARK: - Data Export
    
    func exportMealsAsCSV() -> String {
        var csv = "Date,Time,Meal,Calories,Protein,Carbs,Fat\n"
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .short
        
        let allMeals = getAllMeals()
        for meal in allMeals {
            let date = dateFormatter.string(from: meal.date ?? Date())
            let row = "\(date),\(meal.time ?? ""),\(meal.name ?? ""),\(meal.calories),\(meal.protein),\(meal.carbs),\(meal.fat)\n"
            csv += row
        }
        
        return csv
    }
    
    private func getAllMeals() -> [MealEntity] {
        let request: NSFetchRequest<MealEntity> = MealEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \MealEntity.date, ascending: false)]
        
        do {
            return try context.fetch(request)
        } catch {
            print("Failed to fetch all meals: \(error)")
            return []
        }
    }
}