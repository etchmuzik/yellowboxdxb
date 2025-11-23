import Foundation
import CoreData
import Combine

@MainActor
class DataManager: ObservableObject {
    static let shared = DataManager()
    
    private let coreDataStack = CoreDataStack.shared
    private var cancellables = Set<AnyCancellable>()
    
    @Published var currentUser: User?
    @Published var todaysMeals: [Meal] = []
    @Published var recentFoods: [Food] = []
    
    private init() {
        loadCurrentUser()
        loadTodaysMeals()
    }
    
    // MARK: - User Management
    
    func loadCurrentUser() {
        let request = CDUser.fetchRequest()
        request.fetchLimit = 1
        
        do {
            let users = try coreDataStack.viewContext.fetch(request)
            if let cdUser = users.first {
                currentUser = User(
                    id: cdUser.id,
                    name: cdUser.name,
                    email: cdUser.email,
                    age: Int(cdUser.age),
                    gender: cdUser.gender.flatMap { Gender(rawValue: $0) },
                    height: cdUser.height,
                    weight: cdUser.weight,
                    activityLevel: ActivityLevel(rawValue: cdUser.activityLevel) ?? .moderate,
                    dailyCalorieGoal: Int(cdUser.dailyCalorieGoal),
                    proteinGoal: cdUser.proteinGoal,
                    carbGoal: cdUser.carbGoal,
                    fatGoal: cdUser.fatGoal
                )
            } else {
                // Create default user
                createDefaultUser()
            }
        } catch {
            print("Failed to load user: \(error)")
        }
    }
    
    private func createDefaultUser() {
        let user = User(name: "User", dailyCalorieGoal: 2000)
        saveUser(user)
        currentUser = user
    }
    
    func saveUser(_ user: User) {
        let context = coreDataStack.viewContext
        
        let request = CDUser.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", user.id as CVarArg)
        
        do {
            let results = try context.fetch(request)
            let cdUser = results.first ?? CDUser(context: context)
            
            // Update properties
            cdUser.id = user.id
            cdUser.name = user.name
            cdUser.email = user.email
            cdUser.age = Int16(user.age ?? 0)
            cdUser.gender = user.gender?.rawValue
            cdUser.height = user.height ?? 0
            cdUser.weight = user.weight ?? 0
            cdUser.activityLevel = user.activityLevel.rawValue
            cdUser.dailyCalorieGoal = Int32(user.dailyCalorieGoal ?? 0)
            cdUser.proteinGoal = user.proteinGoal ?? 0
            cdUser.carbGoal = user.carbGoal ?? 0
            cdUser.fatGoal = user.fatGoal ?? 0
            cdUser.updatedAt = Date()
            
            if cdUser.createdAt == nil {
                cdUser.createdAt = Date()
            }
            
            coreDataStack.save()
            currentUser = user
        } catch {
            print("Failed to save user: \(error)")
        }
    }
    
    // MARK: - Meal Management
    
    func loadTodaysMeals() {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let request = CDMeal.fetchRequest()
        request.predicate = NSPredicate(format: "consumedAt >= %@ AND consumedAt < %@", startOfDay as NSDate, endOfDay as NSDate)
        request.sortDescriptors = [NSSortDescriptor(key: "consumedAt", ascending: true)]
        
        do {
            let cdMeals = try coreDataStack.viewContext.fetch(request)
            todaysMeals = cdMeals.map { $0.toMeal() }
        } catch {
            print("Failed to load meals: \(error)")
        }
    }
    
    func loadMeals(for date: Date) -> [Meal] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let request = CDMeal.fetchRequest()
        request.predicate = NSPredicate(format: "consumedAt >= %@ AND consumedAt < %@", startOfDay as NSDate, endOfDay as NSDate)
        request.sortDescriptors = [NSSortDescriptor(key: "consumedAt", ascending: true)]
        
        do {
            let cdMeals = try coreDataStack.viewContext.fetch(request)
            return cdMeals.map { $0.toMeal() }
        } catch {
            print("Failed to load meals: \(error)")
            return []
        }
    }
    
    func saveMeal(_ meal: Meal) {
        let context = coreDataStack.viewContext
        
        let request = CDMeal.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", meal.id as CVarArg)
        
        do {
            let results = try context.fetch(request)
            let cdMeal = results.first ?? CDMeal(context: context)
            
            // Update properties
            cdMeal.id = meal.id
            cdMeal.name = meal.name
            cdMeal.mealType = meal.mealType.rawValue
            cdMeal.consumedAt = meal.consumedAt
            cdMeal.notes = meal.notes
            cdMeal.locationName = meal.locationName
            cdMeal.latitude = meal.latitude ?? 0
            cdMeal.longitude = meal.longitude ?? 0
            cdMeal.updatedAt = Date()
            
            if cdMeal.createdAt == nil {
                cdMeal.createdAt = Date()
            }
            
            // Save foods
            let cdFoods = meal.foods.map { food -> CDFood in
                let cdFood = CDFood(context: context)
                updateCDFood(cdFood, from: food)
                return cdFood
            }
            
            cdMeal.foods = NSOrderedSet(array: cdFoods)
            
            coreDataStack.save()
            loadTodaysMeals()
        } catch {
            print("Failed to save meal: \(error)")
        }
    }
    
    func deleteMeal(_ meal: Meal) {
        let context = coreDataStack.viewContext
        let request = CDMeal.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", meal.id as CVarArg)
        
        do {
            let results = try context.fetch(request)
            if let cdMeal = results.first {
                context.delete(cdMeal)
                coreDataStack.save()
                loadTodaysMeals()
            }
        } catch {
            print("Failed to delete meal: \(error)")
        }
    }
    
    // MARK: - Food Management
    
    func searchFoods(query: String) -> [Food] {
        let request = CDFood.fetchRequest()
        request.predicate = NSPredicate(format: "name CONTAINS[cd] %@", query)
        request.sortDescriptors = [NSSortDescriptor(key: "updatedAt", ascending: false)]
        request.fetchLimit = 20
        
        do {
            let cdFoods = try coreDataStack.viewContext.fetch(request)
            return cdFoods.map { $0.toFood() }
        } catch {
            print("Failed to search foods: \(error)")
            return []
        }
    }
    
    func loadRecentFoods() {
        let request = CDFood.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "updatedAt", ascending: false)]
        request.fetchLimit = 10
        
        do {
            let cdFoods = try coreDataStack.viewContext.fetch(request)
            recentFoods = cdFoods.map { $0.toFood() }
        } catch {
            print("Failed to load recent foods: \(error)")
        }
    }
    
    private func updateCDFood(_ cdFood: CDFood, from food: Food) {
        cdFood.id = food.id
        cdFood.name = food.name
        cdFood.brand = food.brand
        cdFood.barcode = food.barcode
        cdFood.calories = food.nutritionInfo.calories
        cdFood.protein = food.nutritionInfo.protein
        cdFood.carbohydrates = food.nutritionInfo.carbohydrates
        cdFood.fat = food.nutritionInfo.fat
        cdFood.fiber = food.nutritionInfo.fiber ?? 0
        cdFood.sugar = food.nutritionInfo.sugar ?? 0
        cdFood.sodium = food.nutritionInfo.sodium ?? 0
        cdFood.servingAmount = food.servingSize.amount
        cdFood.servingUnit = food.servingSize.unit.rawValue
        cdFood.recognitionConfidence = food.recognitionConfidence
        cdFood.dataSource = food.dataSource.rawValue
        cdFood.usdaFoodId = food.usdaFoodId
        cdFood.customServingSize = food.customServingSize
        cdFood.updatedAt = Date()
        
        if cdFood.createdAt == nil {
            cdFood.createdAt = Date()
        }
    }
    
    // MARK: - Statistics
    
    func calculateStreak() -> Int {
        let calendar = Calendar.current
        var streak = 0
        var currentDate = Date()
        
        while true {
            let meals = loadMeals(for: currentDate)
            if meals.isEmpty {
                break
            }
            streak += 1
            currentDate = calendar.date(byAdding: .day, value: -1, to: currentDate)!
        }
        
        return streak
    }
    
    func calculateWeeklyAverage() -> Int {
        let calendar = Calendar.current
        let endDate = Date()
        let startDate = calendar.date(byAdding: .day, value: -7, to: endDate)!
        
        var totalCalories = 0
        var dayCount = 0
        
        var currentDate = startDate
        while currentDate <= endDate {
            let meals = loadMeals(for: currentDate)
            if !meals.isEmpty {
                let dayCalories = meals.reduce(0) { $0 + Int($1.totalNutrition.calories) }
                totalCalories += dayCalories
                dayCount += 1
            }
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        return dayCount > 0 ? totalCalories / dayCount : 0
    }
}