//
//  AnalyticsManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Analytics and insights manager for nutrition data
//

import SwiftUI
import Foundation

// MARK: - Analytics Data Models

struct DailyNutritionData: Identifiable, Codable {
    let id = UUID()
    let date: Date
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let mealCount: Int
    let waterIntake: Double
    
    var calorieGoalMet: Bool {
        calories >= 1800 // Basic threshold
    }
    
    var balanceScore: Double {
        // Calculate nutrition balance (0-100)
        let proteinRatio = min(protein / 50.0, 1.0) // Target 50g
        let carbsRatio = min(carbs / 250.0, 1.0) // Target 250g
        let fatRatio = min(fat / 65.0, 1.0) // Target 65g
        
        return (proteinRatio + carbsRatio + fatRatio) / 3.0 * 100
    }
}

struct WeeklyInsights: Identifiable {
    let id = UUID()
    let weekStart: Date
    let weekEnd: Date
    let averageCalories: Int
    let totalMeals: Int
    let consistencyScore: Double
    let topFoods: [String]
    let nutritionTrends: NutritionTrends
    let achievements: [String]
}

struct NutritionTrends {
    let caloriesTrend: TrendDirection
    let proteinTrend: TrendDirection
    let carbsTrend: TrendDirection
    let fatTrend: TrendDirection
    let consistencyTrend: TrendDirection
}

enum TrendDirection: String, CaseIterable {
    case increasing = "↗️"
    case stable = "→"
    case decreasing = "↙️"
    
    var description: String {
        switch self {
        case .increasing: return "Increasing"
        case .stable: return "Stable"
        case .decreasing: return "Decreasing"
        }
    }
    
    var color: Color {
        switch self {
        case .increasing: return .green
        case .stable: return .blue
        case .decreasing: return .orange
        }
    }
}

struct NutritionGoal {
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    
    static func defaultGoals() -> NutritionGoal {
        NutritionGoal(calories: 2000, protein: 50, carbs: 250, fat: 65)
    }
}

struct NutritionDataSummary {
    let averageCalories: Int?
    let averageProtein: Double?
    let averageCarbs: Double?
    let averageFat: Double?
    let totalDays: Int
}

// MARK: - Analytics Manager

@MainActor
class AnalyticsManager: ObservableObject {
    static let shared = AnalyticsManager()
    
    @Published var dailyData: [DailyNutritionData] = []
    @Published var weeklyInsights: WeeklyInsights?
    @Published var currentStreak: Int = 0
    @Published var bestStreak: Int = 0
    @Published var totalMealsLogged: Int = 0
    @Published var nutritionGoals = NutritionGoal.defaultGoals()
    
    // Chart data
    @Published var last7DaysData: [DailyNutritionData] = []
    @Published var last30DaysData: [DailyNutritionData] = []
    
    private let userDefaults = UserDefaults.standard
    private let analyticsKey = "analyticsData"
    private let streakKey = "currentStreak"
    private let bestStreakKey = "bestStreak"
    
    init() {
        loadAnalyticsData()
        generateDemoData() // For development
    }
    
    // MARK: - Data Management
    
    func addMealData(_ meal: SimpleMeal, date: Date = Date()) {
        let calendar = Calendar.current
        let dayStart = calendar.startOfDay(for: date)
        
        // Find or create today's data
        if let index = dailyData.firstIndex(where: { calendar.isDate($0.date, inSameDayAs: dayStart) }) {
            // Update existing day
            var existingData = dailyData[index]
            dailyData[index] = DailyNutritionData(
                date: existingData.date,
                calories: existingData.calories + meal.calories,
                protein: existingData.protein + meal.protein,
                carbs: existingData.carbs + meal.carbs,
                fat: existingData.fat + meal.fat,
                mealCount: existingData.mealCount + 1,
                waterIntake: existingData.waterIntake
            )
        } else {
            // Create new day
            let newData = DailyNutritionData(
                date: dayStart,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                mealCount: 1,
                waterIntake: 0
            )
            dailyData.append(newData)
        }
        
        totalMealsLogged += 1
        updateStreaks()
        updateChartData()
        generateWeeklyInsights()
        saveAnalyticsData()
    }
    
    func addWaterIntake(_ liters: Double, date: Date = Date()) {
        let calendar = Calendar.current
        let dayStart = calendar.startOfDay(for: date)
        
        if let index = dailyData.firstIndex(where: { calendar.isDate($0.date, inSameDayAs: dayStart) }) {
            var existingData = dailyData[index]
            dailyData[index] = DailyNutritionData(
                date: existingData.date,
                calories: existingData.calories,
                protein: existingData.protein,
                carbs: existingData.carbs,
                fat: existingData.fat,
                mealCount: existingData.mealCount,
                waterIntake: existingData.waterIntake + liters
            )
        } else {
            let newData = DailyNutritionData(
                date: dayStart,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                mealCount: 0,
                waterIntake: liters
            )
            dailyData.append(newData)
        }
        
        updateChartData()
        saveAnalyticsData()
    }
    
    // MARK: - Insights Generation
    
    private func updateStreaks() {
        let sortedData = dailyData.sorted { $0.date < $1.date }
        let calendar = Calendar.current
        
        currentStreak = 0
        var tempStreak = 0
        var maxStreak = 0
        
        for (index, data) in sortedData.enumerated() {
            if data.mealCount > 0 {
                tempStreak += 1
                
                // Check if this is today or yesterday (for current streak)
                let daysDifference = calendar.dateComponents([.day], from: data.date, to: Date()).day ?? 0
                if daysDifference <= 1 {
                    currentStreak = tempStreak
                }
            } else {
                maxStreak = max(maxStreak, tempStreak)
                tempStreak = 0
            }
        }
        
        bestStreak = max(maxStreak, tempStreak, bestStreak)
        
        userDefaults.set(currentStreak, forKey: streakKey)
        userDefaults.set(bestStreak, forKey: bestStreakKey)
    }
    
    private func updateChartData() {
        let calendar = Calendar.current
        let now = Date()
        
        // Last 7 days
        let sevenDaysAgo = calendar.date(byAdding: .day, value: -7, to: now)!
        last7DaysData = dailyData.filter { $0.date >= sevenDaysAgo }
            .sorted { $0.date < $1.date }
        
        // Last 30 days
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: now)!
        last30DaysData = dailyData.filter { $0.date >= thirtyDaysAgo }
            .sorted { $0.date < $1.date }
    }
    
    private func generateWeeklyInsights() {
        let calendar = Calendar.current
        let now = Date()
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: now)!
        
        let weekData = dailyData.filter { $0.date >= weekAgo }
        
        guard !weekData.isEmpty else { return }
        
        let totalCalories = weekData.reduce(0) { $0 + $1.calories }
        let averageCalories = totalCalories / max(1, weekData.count)
        let totalMeals = weekData.reduce(0) { $0 + $1.mealCount }
        
        // Calculate consistency (days with meals / 7)
        let daysWithMeals = weekData.filter { $0.mealCount > 0 }.count
        let consistencyScore = Double(daysWithMeals) / 7.0 * 100
        
        // Generate nutrition trends
        let trends = calculateNutritionTrends(from: weekData)
        
        // Top foods (mock data for now)
        let topFoods = ["Chicken Shawarma", "Hummus", "Arabic Coffee"]
        
        // Achievements
        var achievements: [String] = []
        if consistencyScore >= 80 {
            achievements.append("🔥 Consistent Tracker")
        }
        if averageCalories >= nutritionGoals.calories {
            achievements.append("💪 Goal Achiever")
        }
        if currentStreak >= 3 {
            achievements.append("⚡ On Fire")
        }
        
        weeklyInsights = WeeklyInsights(
            weekStart: weekAgo,
            weekEnd: now,
            averageCalories: averageCalories,
            totalMeals: totalMeals,
            consistencyScore: consistencyScore,
            topFoods: topFoods,
            nutritionTrends: trends,
            achievements: achievements
        )
    }
    
    private func calculateNutritionTrends(from data: [DailyNutritionData]) -> NutritionTrends {
        // Simple trend calculation (comparing first half vs second half of week)
        let midPoint = data.count / 2
        let firstHalf = Array(data.prefix(midPoint))
        let secondHalf = Array(data.suffix(data.count - midPoint))
        
        func getTrend(first: [DailyNutritionData], second: [DailyNutritionData], keyPath: KeyPath<DailyNutritionData, Double>) -> TrendDirection {
            let firstAvg = first.isEmpty ? 0 : first.map { $0[keyPath: keyPath] }.reduce(0, +) / Double(first.count)
            let secondAvg = second.isEmpty ? 0 : second.map { $0[keyPath: keyPath] }.reduce(0, +) / Double(second.count)
            
            if secondAvg > firstAvg * 1.1 {
                return .increasing
            } else if secondAvg < firstAvg * 0.9 {
                return .decreasing
            } else {
                return .stable
            }
        }
        
        func getCalorieTrend(first: [DailyNutritionData], second: [DailyNutritionData]) -> TrendDirection {
            let firstAvg = first.isEmpty ? 0 : Double(first.map { $0.calories }.reduce(0, +)) / Double(first.count)
            let secondAvg = second.isEmpty ? 0 : Double(second.map { $0.calories }.reduce(0, +)) / Double(second.count)
            
            if secondAvg > firstAvg * 1.1 {
                return .increasing
            } else if secondAvg < firstAvg * 0.9 {
                return .decreasing
            } else {
                return .stable
            }
        }
        
        return NutritionTrends(
            caloriesTrend: getCalorieTrend(first: firstHalf, second: secondHalf),
            proteinTrend: getTrend(first: firstHalf, second: secondHalf, keyPath: \.protein),
            carbsTrend: getTrend(first: firstHalf, second: secondHalf, keyPath: \.carbs),
            fatTrend: getTrend(first: firstHalf, second: secondHalf, keyPath: \.fat),
            consistencyTrend: .stable // Simplified for now
        )
    }
    
    // MARK: - Analytics Queries
    
    func getAverageCaloriesForPeriod(_ days: Int) -> Int {
        let calendar = Calendar.current
        let cutoffDate = calendar.date(byAdding: .day, value: -days, to: Date())!
        
        let periodData = dailyData.filter { $0.date >= cutoffDate }
        guard !periodData.isEmpty else { return 0 }
        
        let total = periodData.reduce(0) { $0 + $1.calories }
        return total / periodData.count
    }
    
    func getNutritionScore() -> Double {
        guard let today = dailyData.first(where: { Calendar.current.isDateInToday($0.date) }) else {
            return 0
        }
        
        return today.balanceScore
    }
    
    func getTodaysProgress() -> (calories: Double, protein: Double, carbs: Double, fat: Double) {
        guard let today = dailyData.first(where: { Calendar.current.isDateInToday($0.date) }) else {
            return (0, 0, 0, 0)
        }
        
        return (
            calories: Double(today.calories) / Double(nutritionGoals.calories),
            protein: today.protein / nutritionGoals.protein,
            carbs: today.carbs / nutritionGoals.carbs,
            fat: today.fat / nutritionGoals.fat
        )
    }
    
    // Get nutrition data summary for specified period
    func getNutritionData(days: Int) -> NutritionDataSummary {
        let calendar = Calendar.current
        let cutoffDate = calendar.date(byAdding: .day, value: -days, to: Date())!
        
        let periodData = dailyData.filter { $0.date >= cutoffDate }
        
        guard !periodData.isEmpty else {
            return NutritionDataSummary(
                averageCalories: nil,
                averageProtein: nil,
                averageCarbs: nil,
                averageFat: nil,
                totalDays: 0
            )
        }
        
        let totalCalories = periodData.reduce(0) { $0 + $1.calories }
        let totalProtein = periodData.reduce(0.0) { $0 + $1.protein }
        let totalCarbs = periodData.reduce(0.0) { $0 + $1.carbs }
        let totalFat = periodData.reduce(0.0) { $0 + $1.fat }
        
        return NutritionDataSummary(
            averageCalories: totalCalories / periodData.count,
            averageProtein: totalProtein / Double(periodData.count),
            averageCarbs: totalCarbs / Double(periodData.count),
            averageFat: totalFat / Double(periodData.count),
            totalDays: periodData.count
        )
    }
    
    func getTodaysCalories() -> Int {
        guard let today = dailyData.first(where: { Calendar.current.isDateInToday($0.date) }) else {
            return 0
        }
        return today.calories
    }
    
    func getAverageWaterIntake(days: Int) -> Double {
        let calendar = Calendar.current
        let cutoffDate = calendar.date(byAdding: .day, value: -days, to: Date())!
        
        let periodData = dailyData.filter { $0.date >= cutoffDate }
        guard !periodData.isEmpty else { return 0 }
        
        let totalWater = periodData.reduce(0.0) { $0 + $1.waterIntake }
        return totalWater / Double(periodData.count)
    }
    
    func getAverageMealTimes() -> [String: TimeInterval] {
        // This would need meal time data - simplified for now
        return [:]
    }
    
    // MARK: - Data Persistence
    
    private func saveAnalyticsData() {
        if let encoded = try? JSONEncoder().encode(dailyData) {
            userDefaults.set(encoded, forKey: analyticsKey)
        }
    }
    
    private func loadAnalyticsData() {
        if let data = userDefaults.data(forKey: analyticsKey),
           let decoded = try? JSONDecoder().decode([DailyNutritionData].self, from: data) {
            dailyData = decoded
        }
        
        currentStreak = userDefaults.integer(forKey: streakKey)
        bestStreak = userDefaults.integer(forKey: bestStreakKey)
        
        updateChartData()
        generateWeeklyInsights()
    }
    
    // MARK: - Demo Data Generation
    
    private func generateDemoData() {
        // Only generate if no data exists
        guard dailyData.isEmpty else { return }
        
        let calendar = Calendar.current
        
        for i in 0..<14 {
            let date = calendar.date(byAdding: .day, value: -i, to: Date())!
            let dayStart = calendar.startOfDay(for: date)
            
            let demoData = DailyNutritionData(
                date: dayStart,
                calories: Int.random(in: 1600...2400),
                protein: Double.random(in: 40...80),
                carbs: Double.random(in: 180...320),
                fat: Double.random(in: 50...90),
                mealCount: Int.random(in: 2...4),
                waterIntake: Double.random(in: 1.5...3.0)
            )
            
            dailyData.append(demoData)
        }
        
        totalMealsLogged = dailyData.reduce(0) { $0 + $1.mealCount }
        updateStreaks()
        updateChartData()
        generateWeeklyInsights()
        saveAnalyticsData()
    }
}