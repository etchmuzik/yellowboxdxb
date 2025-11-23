import Foundation
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    // Published properties
    @Published var meals: [Meal] = []
    @Published var totalCalories: Int = 0
    @Published var totalProtein: Double = 0
    @Published var totalCarbs: Double = 0
    @Published var totalFat: Double = 0
    
    // Goals (will be loaded from user preferences)
    @Published var calorieGoal: Int = 2000
    @Published var proteinGoal: Double = 150
    @Published var carbGoal: Double = 250
    @Published var fatGoal: Double = 65
    
    // Stats
    @Published var currentStreak: Int = 0
    @Published var weeklyAverageCalories: Int = 0
    @Published var waterIntake: Int = 0
    @Published var steps: Int = 0
    
    // Computed properties
    var remainingCalories: Int {
        calorieGoal - totalCalories
    }
    
    var calorieProgress: Double {
        calorieGoal > 0 ? Double(totalCalories) / Double(calorieGoal) : 0
    }
    
    private var currentDate = Date()
    
    init() {
        loadData(for: Date())
    }
    
    // MARK: - Data Loading
    
    func loadData(for date: Date) {
        currentDate = date
        
        // Load meals for the selected date
        loadMeals(for: date)
        
        // Calculate totals
        calculateNutritionTotals()
        
        // Load user goals
        loadUserGoals()
        
        // Load stats
        loadStats()
    }
    
    private func loadMeals(for date: Date) {
        // Load meals from Core Data for the given date
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? date

        let fetchRequest = CDMeal.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "consumedAt >= %@ AND consumedAt < %@", argumentArray: [startOfDay, endOfDay])
        fetchRequest.sortDescriptors = [NSSortDescriptor(key: "consumedAt", ascending: true)]

        do {
            let cdMeals = try CoreDataStack.shared.viewContext.fetch(fetchRequest)
            meals = cdMeals.map { $0.toMeal() }
        } catch {
            print("Failed to fetch meals from Core Data: \(error)")
            meals = []
        }
    }
    
    private func calculateNutritionTotals() {
        totalCalories = meals.reduce(0) { $0 + Int($1.totalNutrition.calories) }
        totalProtein = meals.reduce(0) { $0 + $1.totalNutrition.protein }
        totalCarbs = meals.reduce(0) { $0 + $1.totalNutrition.carbohydrates }
        totalFat = meals.reduce(0) { $0 + $1.totalNutrition.fat }
    }
    
    private func loadUserGoals() {
        let userProfile = UserProfileManager()
        calorieGoal = userProfile.calorieGoal
        proteinGoal = userProfile.proteinGoal
        carbGoal = userProfile.carbsGoal
        fatGoal = userProfile.fatGoal
    }
    
    private func loadStats() {
        // Calculate streak (days with at least one meal)
        let calendar = Calendar.current
        var streak = 0
        var dateOffset = 0

        while true {
            let day = calendar.date(byAdding: .day, value: -dateOffset, to: Date()) ?? Date()
            let startOfDay = calendar.startOfDay(for: day)
            let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? day

            let fetchRequest = CDMeal.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "consumedAt >= %@ AND consumedAt < %@", argumentArray: [startOfDay, endOfDay])
            fetchRequest.fetchLimit = 1

            let count: Int
            do {
                count = try CoreDataStack.shared.viewContext.count(for: fetchRequest)
            } catch {
                print("Error fetching meal count for streak: \(error)")
                break
            }
            if count > 0 {
                streak += 1
                dateOffset += 1
            } else {
                break
            }
        }
        currentStreak = streak

        // Calculate weekly average calories (last 7 days)
        var totalCalories = 0
        for dayOffset in 0..<7 {
            let day = calendar.date(byAdding: .day, value: -dayOffset, to: Date()) ?? Date()
            let startOfDay = calendar.startOfDay(for: day)
            let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? day
            let fetchRequest = CDMeal.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "consumedAt >= %@ AND consumedAt < %@", argumentArray: [startOfDay, endOfDay])
            do {
                let cdMeals = try CoreDataStack.shared.viewContext.fetch(fetchRequest)
                let dailyCalories = cdMeals.reduce(0) { $0 + ($1.toMeal().totalNutrition.calories) }
                totalCalories += Int(dailyCalories)
            } catch {
                print("Error fetching meals for weekly nutrition: \(error)")
            }
        }
        weeklyAverageCalories = totalCalories / 7
        // Optionally, keep demo values for water and steps
        waterIntake = 6
        steps = 8432
    }
    
    // MARK: - Sample Data
    
    private func generateSampleMeals() -> [Meal] {
        let breakfast = Meal(
            name: "Breakfast",
            foods: [
                Food(
                    name: "Scrambled Eggs",
                    nutritionInfo: NutritionInfo(
                        calories: 180,
                        protein: 13,
                        carbohydrates: 2,
                        fat: 14
                    ),
                    servingSize: ServingSize(amount: 2, unit: .piece, gramsPerServing: 100),
                    dataSource: .manual
                ),
                Food(
                    name: "Whole Wheat Toast",
                    nutritionInfo: NutritionInfo(
                        calories: 140,
                        protein: 6,
                        carbohydrates: 24,
                        fat: 2,
                        fiber: 3
                    ),
                    servingSize: ServingSize(amount: 2, unit: .slice, gramsPerServing: 60),
                    dataSource: .manual
                ),
                Food(
                    name: "Orange Juice",
                    nutritionInfo: NutritionInfo(
                        calories: 110,
                        protein: 2,
                        carbohydrates: 26,
                        fat: 0,
                        sugar: 21
                    ),
                    servingSize: ServingSize(amount: 1, unit: .cup, gramsPerServing: 248),
                    dataSource: .manual
                )
            ],
            mealType: .breakfast,
            consumedAt: Calendar.current.date(bySettingHour: 8, minute: 30, second: 0, of: Date()) ?? Date()
        )
        
        let lunch = Meal(
            name: "Lunch",
            foods: [
                Food(
                    name: "Grilled Chicken Salad",
                    nutritionInfo: NutritionInfo(
                        calories: 320,
                        protein: 35,
                        carbohydrates: 12,
                        fat: 15,
                        fiber: 5
                    ),
                    servingSize: ServingSize(amount: 1, unit: .serving, gramsPerServing: 300),
                    dataSource: .aiRecognition
                ),
                Food(
                    name: "Apple",
                    nutritionInfo: .sampleApple,
                    servingSize: ServingSize(amount: 1, unit: .medium, gramsPerServing: 182),
                    dataSource: .usda
                )
            ],
            mealType: .lunch,
            consumedAt: Calendar.current.date(bySettingHour: 12, minute: 45, second: 0, of: Date()) ?? Date()
        )
        
        let snack = Meal(
            name: "Afternoon Snack",
            foods: [
                Food(
                    name: "Greek Yogurt",
                    nutritionInfo: NutritionInfo(
                        calories: 130,
                        protein: 15,
                        carbohydrates: 9,
                        fat: 4
                    ),
                    servingSize: ServingSize(amount: 1, unit: .cup, gramsPerServing: 170),
                    dataSource: .barcode
                )
            ],
            mealType: .snack,
            consumedAt: Calendar.current.date(bySettingHour: 15, minute: 30, second: 0, of: Date()) ?? Date()
        )
        
        return [breakfast, lunch, snack]
    }
}

// MARK: - Date Extensions
extension Calendar {
    func isDateInTomorrow(_ date: Date) -> Bool {
        return isDate(date, inSameDayAs: Date().addingTimeInterval(86400))
    }
}