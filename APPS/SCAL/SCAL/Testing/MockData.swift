//
//  MockData.swift
//  SCAL
//
//  Mock data for testing and previews
//

import Foundation
import UIKit
@testable import SCAL

// MARK: - Mock Data Provider

enum MockData {
    
    // MARK: - Users
    
    static let freeUser = User(
        id: UUID(),
        name: "John Free",
        email: "john.free@example.com",
        avatarURL: nil,
        createdAt: Date().addingTimeInterval(-30 * 24 * 60 * 60), // 30 days ago
        subscription: .free,
        preferences: UserPreferences()
    )
    
    static let premiumUser = User(
        id: UUID(),
        name: "Jane Premium",
        email: "jane.premium@example.com",
        avatarURL: nil,
        createdAt: Date().addingTimeInterval(-90 * 24 * 60 * 60), // 90 days ago
        subscription: .premium,
        preferences: UserPreferences()
    )
    
    static let proUser = User(
        id: UUID(),
        name: "Pro Power",
        email: "pro.power@example.com",
        avatarURL: nil,
        createdAt: Date().addingTimeInterval(-180 * 24 * 60 * 60), // 180 days ago
        subscription: .pro,
        preferences: UserPreferences()
    )
    
    // MARK: - Meals
    
    static let breakfastMeal = SimpleMeal(
        id: UUID(),
        name: "Healthy Breakfast",
        calories: 450,
        protein: 25.0,
        carbs: 55.0,
        fat: 15.0,
        timestamp: Calendar.current.date(bySettingHour: 8, minute: 30, second: 0, of: Date())!
    )
    
    static let lunchMeal = SimpleMeal(
        id: UUID(),
        name: "Grilled Chicken Salad",
        calories: 650,
        protein: 45.0,
        carbs: 40.0,
        fat: 25.0,
        timestamp: Calendar.current.date(bySettingHour: 12, minute: 45, second: 0, of: Date())!
    )
    
    static let dinnerMeal = SimpleMeal(
        id: UUID(),
        name: "Salmon with Vegetables",
        calories: 720,
        protein: 50.0,
        carbs: 45.0,
        fat: 30.0,
        timestamp: Calendar.current.date(bySettingHour: 19, minute: 0, second: 0, of: Date())!
    )
    
    static let snackMeal = SimpleMeal(
        id: UUID(),
        name: "Greek Yogurt with Berries",
        calories: 180,
        protein: 15.0,
        carbs: 20.0,
        fat: 5.0,
        timestamp: Calendar.current.date(bySettingHour: 15, minute: 30, second: 0, of: Date())!
    )
    
    static let allMeals = [breakfastMeal, lunchMeal, dinnerMeal, snackMeal]
    
    // MARK: - Complex Meals
    
    static let complexBreakfast = Meal(
        id: UUID(),
        name: "Full American Breakfast",
        mealType: .breakfast,
        timestamp: Calendar.current.date(bySettingHour: 8, minute: 0, second: 0, of: Date())!,
        foods: [
            Food(
                id: UUID(),
                name: "Scrambled Eggs",
                brand: nil,
                barcode: nil,
                quantity: 2,
                unit: "large",
                baseNutrition: NutritionInfo(calories: 140, protein: 12, carbs: 2, fat: 10, fiber: 0),
                tags: ["protein", "breakfast"]
            ),
            Food(
                id: UUID(),
                name: "Whole Wheat Toast",
                brand: "Dave's Killer Bread",
                barcode: "012345678901",
                quantity: 2,
                unit: "slices",
                baseNutrition: NutritionInfo(calories: 140, protein: 6, carbs: 22, fat: 2, fiber: 4),
                tags: ["grain", "fiber"]
            ),
            Food(
                id: UUID(),
                name: "Avocado",
                brand: nil,
                barcode: nil,
                quantity: 0.5,
                unit: "medium",
                baseNutrition: NutritionInfo(calories: 120, protein: 1.5, carbs: 6, fat: 11, fiber: 5),
                tags: ["healthy fat", "fiber"]
            ),
            Food(
                id: UUID(),
                name: "Orange Juice",
                brand: "Tropicana",
                barcode: "012345678902",
                quantity: 8,
                unit: "oz",
                baseNutrition: NutritionInfo(calories: 110, protein: 2, carbs: 26, fat: 0, fiber: 0),
                tags: ["fruit", "vitamin c"]
            )
        ],
        notes: "Great start to the day!",
        photoURL: nil,
        location: nil
    )
    
    // MARK: - Detected Foods
    
    static let detectedApple = DetectedFood(
        id: UUID(),
        name: "Red Apple",
        category: "fruit",
        confidence: 0.95,
        boundingBox: CGRect(x: 50, y: 50, width: 100, height: 100),
        nutrition: NutritionInfo(calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4),
        quantity: 1.0,
        unit: "medium"
    )
    
    static let detectedChicken = DetectedFood(
        id: UUID(),
        name: "Grilled Chicken Breast",
        category: "protein",
        confidence: 0.88,
        boundingBox: CGRect(x: 200, y: 100, width: 150, height: 120),
        nutrition: NutritionInfo(calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0),
        quantity: 4.0,
        unit: "oz"
    )
    
    static let detectedSalad = DetectedFood(
        id: UUID(),
        name: "Mixed Green Salad",
        category: "vegetable",
        confidence: 0.82,
        boundingBox: CGRect(x: 100, y: 250, width: 200, height: 150),
        nutrition: NutritionInfo(calories: 35, protein: 2.5, carbs: 7, fat: 0.5, fiber: 3),
        quantity: 2.0,
        unit: "cups"
    )
    
    static let mealComposition = MealComposition(
        detectedFoods: [detectedApple, detectedChicken, detectedSalad],
        totalCalories: 295,
        totalProtein: 34.0,
        totalCarbs: 32.0,
        totalFat: 4.4,
        confidence: 0.88,
        processedImage: createMockProcessedImage()
    )
    
    // MARK: - Daily Nutrition Data
    
    static func generateWeeklyData() -> [DailyNutritionData] {
        let calendar = Calendar.current
        return (0..<7).map { dayOffset in
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: Date())!
            return DailyNutritionData(
                date: date,
                calories: Int.random(in: 1600...2400),
                protein: Double.random(in: 80...150),
                carbs: Double.random(in: 150...300),
                fat: Double.random(in: 50...100),
                waterIntake: Double.random(in: 6...12)
            )
        }.reversed()
    }
    
    static func generateMonthlyData() -> [DailyNutritionData] {
        let calendar = Calendar.current
        return (0..<30).map { dayOffset in
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: Date())!
            return DailyNutritionData(
                date: date,
                calories: Int.random(in: 1600...2400),
                protein: Double.random(in: 80...150),
                carbs: Double.random(in: 150...300),
                fat: Double.random(in: 50...100),
                waterIntake: Double.random(in: 6...12)
            )
        }.reversed()
    }
    
    // MARK: - Achievements
    
    static let achievements = [
        Achievement(
            id: UUID(),
            title: "First Scan",
            description: "Scanned your first meal",
            icon: "camera.fill",
            unlockedDate: Date().addingTimeInterval(-7 * 24 * 60 * 60),
            progress: 1.0
        ),
        Achievement(
            id: UUID(),
            title: "Week Warrior",
            description: "Logged meals for 7 consecutive days",
            icon: "calendar.badge.checkmark",
            unlockedDate: Date().addingTimeInterval(-1 * 24 * 60 * 60),
            progress: 1.0
        ),
        Achievement(
            id: UUID(),
            title: "Hydration Hero",
            description: "Drink 8 glasses of water daily for a week",
            icon: "drop.fill",
            unlockedDate: nil,
            progress: 0.6
        ),
        Achievement(
            id: UUID(),
            title: "Protein Power",
            description: "Meet your protein goal 10 days in a row",
            icon: "bolt.fill",
            unlockedDate: nil,
            progress: 0.3
        )
    ]
    
    // MARK: - AI Coach Messages
    
    static let coachMessages = [
        CoachMessage(
            id: UUID(),
            text: "Great job logging your breakfast! I noticed you're getting good protein. How about adding some fruits for vitamins?",
            isUser: false,
            timestamp: Date().addingTimeInterval(-3600)
        ),
        CoachMessage(
            id: UUID(),
            text: "What healthy snacks do you recommend?",
            isUser: true,
            timestamp: Date().addingTimeInterval(-3000)
        ),
        CoachMessage(
            id: UUID(),
            text: "Here are my top 5 healthy snack recommendations:\n\n1. Greek yogurt with berries\n2. Apple slices with almond butter\n3. Mixed nuts (portion controlled)\n4. Carrot sticks with hummus\n5. Hard-boiled eggs\n\nThese provide a good balance of protein, healthy fats, and fiber to keep you satisfied!",
            isUser: false,
            timestamp: Date().addingTimeInterval(-2400)
        )
    ]
    
    // MARK: - Meal Plans
    
    static let sampleMealPlan = MealPlan(
        id: UUID(),
        name: "Balanced Week",
        startDate: Date(),
        endDate: Date().addingTimeInterval(7 * 24 * 60 * 60),
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 250,
        targetFat: 67,
        meals: Dictionary(uniqueKeysWithValues: (0..<7).map { day in
            let date = Calendar.current.date(byAdding: .day, value: day, to: Date())!
            return (date, [
                PlannedMeal(type: .breakfast, foods: [], targetCalories: 400),
                PlannedMeal(type: .lunch, foods: [], targetCalories: 600),
                PlannedMeal(type: .dinner, foods: [], targetCalories: 700),
                PlannedMeal(type: .snack, foods: [], targetCalories: 300)
            ])
        }),
        isActive: true
    )
    
    // MARK: - Helper Methods
    
    static func createMockProcessedImage() -> UIImage {
        UIGraphicsBeginImageContext(CGSize(width: 400, height: 400))
        defer { UIGraphicsEndImageContext() }
        
        UIColor.white.setFill()
        UIRectFill(CGRect(x: 0, y: 0, width: 400, height: 400))
        
        // Draw bounding boxes
        UIColor.red.withAlphaComponent(0.3).setFill()
        UIRectFill(CGRect(x: 50, y: 50, width: 100, height: 100))
        
        UIColor.green.withAlphaComponent(0.3).setFill()
        UIRectFill(CGRect(x: 200, y: 100, width: 150, height: 120))
        
        UIColor.blue.withAlphaComponent(0.3).setFill()
        UIRectFill(CGRect(x: 100, y: 250, width: 200, height: 150))
        
        return UIGraphicsGetImageFromCurrentImageContext() ?? UIImage()
    }
    
    static func randomMealForDate(_ date: Date) -> SimpleMeal {
        let meals = ["Oatmeal with Berries", "Chicken Caesar Salad", "Pasta Primavera", "Steak and Vegetables", "Smoothie Bowl", "Turkey Sandwich", "Quinoa Bowl", "Fish Tacos"]
        let meal = meals.randomElement()!
        
        return SimpleMeal(
            id: UUID(),
            name: meal,
            calories: Int.random(in: 300...800),
            protein: Double.random(in: 15...50),
            carbs: Double.random(in: 30...80),
            fat: Double.random(in: 10...35),
            timestamp: date
        )
    }
}

// MARK: - Mock Models

struct User {
    let id: UUID
    let name: String
    let email: String
    let avatarURL: URL?
    let createdAt: Date
    let subscription: SubscriptionTier
    let preferences: UserPreferences
}

struct UserPreferences {
    var calorieGoal: Int = 2000
    var proteinGoal: Double = 150
    var carbGoal: Double = 250
    var fatGoal: Double = 67
    var waterGoal: Int = 8
    var mealReminders: Bool = true
    var weeklyReports: Bool = true
}

struct Achievement: Identifiable {
    let id: UUID
    let title: String
    let description: String
    let icon: String
    let unlockedDate: Date?
    let progress: Double
    
    var isUnlocked: Bool {
        unlockedDate != nil
    }
}

struct CoachMessage: Identifiable {
    let id: UUID
    let text: String
    let isUser: Bool
    let timestamp: Date
}

struct PlannedMeal {
    let type: MealType
    let foods: [Food]
    let targetCalories: Int
}

// MARK: - Test Scenarios

enum TestScenario {
    case emptyState
    case singleMeal
    case fullDay
    case weekOfData
    case goalExceeded
    case perfectDay
    case lowProtein
    case noWater
    
    func generateData() -> [SimpleMeal] {
        switch self {
        case .emptyState:
            return []
        case .singleMeal:
            return [MockData.breakfastMeal]
        case .fullDay:
            return MockData.allMeals
        case .weekOfData:
            return (0..<7).flatMap { day in
                let date = Calendar.current.date(byAdding: .day, value: -day, to: Date())!
                return (0..<4).map { _ in
                    MockData.randomMealForDate(date)
                }
            }
        case .goalExceeded:
            return [
                SimpleMeal(id: UUID(), name: "Large Pizza", calories: 2500, protein: 80, carbs: 300, fat: 100, timestamp: Date()),
                SimpleMeal(id: UUID(), name: "Ice Cream", calories: 500, protein: 8, carbs: 60, fat: 25, timestamp: Date())
            ]
        case .perfectDay:
            return [
                SimpleMeal(id: UUID(), name: "Perfect Breakfast", calories: 400, protein: 30, carbs: 50, fat: 13, timestamp: Date()),
                SimpleMeal(id: UUID(), name: "Perfect Lunch", calories: 600, protein: 45, carbs: 75, fat: 20, timestamp: Date()),
                SimpleMeal(id: UUID(), name: "Perfect Dinner", calories: 700, protein: 52, carbs: 88, fat: 23, timestamp: Date()),
                SimpleMeal(id: UUID(), name: "Perfect Snack", calories: 300, protein: 23, carbs: 37, fat: 11, timestamp: Date())
            ]
        case .lowProtein:
            return [
                SimpleMeal(id: UUID(), name: "Fruit Salad", calories: 300, protein: 2, carbs: 70, fat: 2, timestamp: Date()),
                SimpleMeal(id: UUID(), name: "Pasta with Marinara", calories: 500, protein: 12, carbs: 90, fat: 8, timestamp: Date()),
                SimpleMeal(id: UUID(), name: "Vegetable Soup", calories: 250, protein: 5, carbs: 45, fat: 5, timestamp: Date())
            ]
        case .noWater:
            return MockData.allMeals // Just meals, no water logged
        }
    }
}