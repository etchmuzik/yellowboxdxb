//
//  NutritionCoach.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  AI-powered personalized nutrition coaching system
//

import SwiftUI
import Foundation

// MARK: - Coach Models

struct CoachMessage: Identifiable {
    let id = UUID()
    let content: String
    let type: MessageType
    let timestamp = Date()
    let suggestions: [CoachSuggestion]?
    
    enum MessageType {
        case user
        case coach
        case system
    }
}

struct CoachSuggestion: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let action: SuggestionAction
    
    enum SuggestionAction {
        case adjustGoals(calories: Int, protein: Double, carbs: Double, fat: Double)
        case viewMealPlan(planId: String)
        case logFood(foodName: String)
        case viewRecipe(recipeId: String)
        case scheduleReminder(time: Date, message: String)
        case viewProgress(metric: String)
    }
}

struct CoachingInsight: Identifiable {
    let id = UUID()
    let category: InsightCategory
    let title: String
    let message: String
    let priority: Priority
    let recommendations: [String]
    let dataPoints: [DataPoint]
    
    enum InsightCategory: String, CaseIterable {
        case nutrition = "Nutrition Balance"
        case timing = "Meal Timing"
        case hydration = "Hydration"
        case goals = "Goal Progress"
        case habits = "Eating Habits"
        case trends = "Trends"
    }
    
    enum Priority: String {
        case high = "High"
        case medium = "Medium"
        case low = "Low"
        
        var color: Color {
            switch self {
            case .high: return .red
            case .medium: return .orange
            case .low: return .green
            }
        }
    }
    
    struct DataPoint {
        let label: String
        let value: String
        let trend: TrendDirection
    }
}

struct NutritionAdvice {
    let topic: String
    let content: String
    let sources: [String]
    let relatedFoods: [String]
}

// MARK: - AI Nutrition Coach

@MainActor
class NutritionCoach: ObservableObject {
    static let shared = NutritionCoach()
    
    @Published var messages: [CoachMessage] = []
    @Published var insights: [CoachingInsight] = []
    @Published var isTyping = false
    @Published var currentTopic: CoachTopic?
    @Published var personalizedAdvice: [NutritionAdvice] = []
    
    enum CoachTopic: String, CaseIterable {
        case general = "General Nutrition"
        case weightLoss = "Weight Loss"
        case muscleGain = "Muscle Gain"
        case healthyEating = "Healthy Eating"
        case mealTiming = "Meal Timing"
        case supplements = "Supplements"
        case hydration = "Hydration"
        case specialDiets = "Special Diets"
    }
    
    private let userProfileManager = UserProfileManager()
    private let analyticsManager = AnalyticsManager.shared
    private let mealPlanningManager = MealPlanningManager.shared
    
    init() {
        loadInitialInsights()
        setupWelcomeMessage()
    }
    
    // MARK: - Public Methods
    
    func sendMessage(_ text: String) {
        let userMessage = CoachMessage(
            content: text,
            type: .user,
            suggestions: nil
        )
        messages.append(userMessage)
        
        // Process message and generate response
        Task {
            await generateCoachResponse(for: text)
        }
    }
    
    func generateDailyCheckIn() async {
        let checkIn = await createDailyCheckIn()
        
        await MainActor.run {
            messages.append(checkIn)
        }
    }
    
    func analyzeNutritionPattern() async -> [CoachingInsight] {
        // Analyze recent nutrition data
        let recentData = analyticsManager.getNutritionData(days: 7)
        var newInsights: [CoachingInsight] = []
        
        // Check protein intake
        if let avgProtein = recentData.averageProtein {
            let proteinGoal = userProfileManager.proteinGoal
            let proteinRatio = avgProtein / proteinGoal
            
            if proteinRatio < 0.8 {
                newInsights.append(CoachingInsight(
                    category: .nutrition,
                    title: "Low Protein Intake",
                    message: "Your protein intake is \(Int((1 - proteinRatio) * 100))% below your goal",
                    priority: .high,
                    recommendations: [
                        "Add a protein source to each meal",
                        "Consider protein-rich snacks like Greek yogurt",
                        "Try incorporating lean meats, fish, or legumes"
                    ],
                    dataPoints: [
                        CoachingInsight.DataPoint(
                            label: "Current",
                            value: "\(Int(avgProtein))g",
                            trend: .down
                        ),
                        CoachingInsight.DataPoint(
                            label: "Goal",
                            value: "\(Int(proteinGoal))g",
                            trend: .stable
                        )
                    ]
                ))
            }
        }
        
        // Check meal timing patterns
        let mealTimes = analyzeMealTiming()
        if let timingInsight = mealTimes {
            newInsights.append(timingInsight)
        }
        
        // Check hydration
        if let hydrationInsight = analyzeHydration() {
            newInsights.append(hydrationInsight)
        }
        
        await MainActor.run {
            self.insights = newInsights
        }
        
        return newInsights
    }
    
    // MARK: - AI Response Generation
    
    private func generateCoachResponse(for input: String) async {
        await MainActor.run {
            isTyping = true
        }
        
        // Simulate AI processing delay
        try? await Task.sleep(nanoseconds: 1_500_000_000)
        
        // Analyze input intent
        let intent = analyzeIntent(input)
        let response = await generateResponseForIntent(intent, input: input)
        
        await MainActor.run {
            messages.append(response)
            isTyping = false
        }
    }
    
    private func analyzeIntent(_ input: String) -> UserIntent {
        let lowercased = input.lowercased()
        
        if lowercased.contains("protein") || lowercased.contains("carb") || lowercased.contains("fat") {
            return .macroQuestion
        } else if lowercased.contains("weight") || lowercased.contains("lose") || lowercased.contains("gain") {
            return .weightGoals
        } else if lowercased.contains("meal") || lowercased.contains("food") || lowercased.contains("eat") {
            return .mealAdvice
        } else if lowercased.contains("water") || lowercased.contains("hydrat") {
            return .hydration
        } else if lowercased.contains("progress") || lowercased.contains("how am i doing") {
            return .progressCheck
        } else {
            return .general
        }
    }
    
    private func generateResponseForIntent(_ intent: UserIntent, input: String) async -> CoachMessage {
        switch intent {
        case .macroQuestion:
            return generateMacroAdvice()
        case .weightGoals:
            return generateWeightAdvice()
        case .mealAdvice:
            return await generateMealAdvice()
        case .hydration:
            return generateHydrationAdvice()
        case .progressCheck:
            return generateProgressReport()
        case .general:
            return generateGeneralAdvice(for: input)
        }
    }
    
    // MARK: - Specific Advice Generators
    
    private func generateMacroAdvice() -> CoachMessage {
        let recentData = analyticsManager.getNutritionData(days: 7)
        let proteinGoal = userProfileManager.proteinGoal
        let carbGoal = userProfileManager.carbGoal
        let fatGoal = userProfileManager.fatGoal
        
        var message = "Based on your recent nutrition data:\n\n"
        var suggestions: [CoachSuggestion] = []
        
        // Protein analysis
        if let avgProtein = recentData.averageProtein {
            let proteinRatio = avgProtein / proteinGoal
            if proteinRatio < 0.8 {
                message += "📉 **Protein**: You're averaging \(Int(avgProtein))g per day, which is below your goal of \(Int(proteinGoal))g.\n"
                suggestions.append(CoachSuggestion(
                    title: "Boost Protein",
                    description: "Add 20-30g more protein daily",
                    icon: "bolt.fill",
                    action: .viewMealPlan(planId: "high-protein")
                ))
            } else {
                message += "✅ **Protein**: Great job! You're meeting your protein goals.\n"
            }
        }
        
        // Carbs analysis
        if let avgCarbs = recentData.averageCarbs {
            let carbRatio = avgCarbs / carbGoal
            if carbRatio > 1.2 {
                message += "📈 **Carbs**: You're averaging \(Int(avgCarbs))g per day, above your goal of \(Int(carbGoal))g.\n"
            } else {
                message += "✅ **Carbs**: Your carb intake is well-balanced.\n"
            }
        }
        
        // Fat analysis
        if let avgFat = recentData.averageFat {
            message += "\n💧 **Fats**: You're getting \(Int(avgFat))g of healthy fats daily."
        }
        
        return CoachMessage(
            content: message,
            type: .coach,
            suggestions: suggestions.isEmpty ? nil : suggestions
        )
    }
    
    private func generateWeightAdvice() -> CoachMessage {
        let weightGoal = userProfileManager.weightGoal
        let currentWeight = userProfileManager.currentWeight
        let goalType = userProfileManager.goalType
        
        var message = ""
        var suggestions: [CoachSuggestion] = []
        
        switch goalType {
        case .loseWeight:
            let deficit = userProfileManager.calculateDailyCalorieDeficit()
            message = """
            For your weight loss goal, here's what I recommend:
            
            🎯 **Target**: Lose \(abs(Int(currentWeight - weightGoal))) kg
            📉 **Calorie Deficit**: Aim for \(deficit) calories below maintenance
            🥗 **Strategy**: Focus on high-volume, low-calorie foods
            💪 **Preserve Muscle**: Keep protein at \(Int(userProfileManager.proteinGoal))g daily
            
            Remember: Sustainable weight loss is 0.5-1 kg per week.
            """
            
            suggestions = [
                CoachSuggestion(
                    title: "Weight Loss Meal Plan",
                    description: "7-day deficit-friendly meals",
                    icon: "chart.line.downtrend.xyaxis",
                    action: .viewMealPlan(planId: "weight-loss")
                ),
                CoachSuggestion(
                    title: "Track Progress",
                    description: "View your weight trend",
                    icon: "chart.bar.fill",
                    action: .viewProgress(metric: "weight")
                )
            ]
            
        case .gainMuscle:
            message = """
            For muscle gain, focus on:
            
            💪 **Protein**: 1.6-2.2g per kg body weight
            📈 **Calorie Surplus**: 300-500 calories above maintenance
            🏋️ **Timing**: Protein within 2 hours post-workout
            🥛 **Recovery**: Prioritize sleep and hydration
            
            Aim for 0.25-0.5 kg gain per week to minimize fat gain.
            """
            
            suggestions = [
                CoachSuggestion(
                    title: "Muscle Building Plan",
                    description: "High-protein meal ideas",
                    icon: "figure.strengthtraining.traditional",
                    action: .viewMealPlan(planId: "muscle-gain")
                )
            ]
            
        case .maintainWeight:
            message = """
            Great job maintaining your weight! Here's how to stay consistent:
            
            ⚖️ **Balance**: Keep calories at maintenance level
            📊 **Monitor**: Weekly weigh-ins at the same time
            🎯 **Focus**: Improve body composition
            ✨ **Variety**: Try new healthy recipes
            """
        }
        
        return CoachMessage(
            content: message,
            type: .coach,
            suggestions: suggestions.isEmpty ? nil : suggestions
        )
    }
    
    private func generateMealAdvice() async -> CoachMessage {
        let hour = Calendar.current.component(.hour, from: Date())
        let mealType: String
        let suggestions: [CoachSuggestion]
        
        switch hour {
        case 5...10:
            mealType = "breakfast"
            suggestions = [
                CoachSuggestion(
                    title: "Quick Breakfast",
                    description: "Overnight oats with berries",
                    icon: "sun.max.fill",
                    action: .logFood(foodName: "Overnight oats")
                ),
                CoachSuggestion(
                    title: "Protein Breakfast",
                    description: "Scrambled eggs with toast",
                    icon: "flame.fill",
                    action: .logFood(foodName: "Scrambled eggs")
                )
            ]
        case 11...14:
            mealType = "lunch"
            suggestions = [
                CoachSuggestion(
                    title: "Balanced Lunch",
                    description: "Grilled chicken salad",
                    icon: "leaf.fill",
                    action: .logFood(foodName: "Chicken salad")
                )
            ]
        case 17...20:
            mealType = "dinner"
            suggestions = [
                CoachSuggestion(
                    title: "Light Dinner",
                    description: "Salmon with vegetables",
                    icon: "moon.fill",
                    action: .logFood(foodName: "Grilled salmon")
                )
            ]
        default:
            mealType = "snack"
            suggestions = [
                CoachSuggestion(
                    title: "Healthy Snack",
                    description: "Greek yogurt with nuts",
                    icon: "star.fill",
                    action: .logFood(foodName: "Greek yogurt")
                )
            ]
        }
        
        // Get personalized recommendations
        let recommendations = await mealPlanningManager.getQuickMealSuggestions(
            for: mealType,
            preferences: userProfileManager.mealPreferences
        )
        
        let message = """
        Looking for \(mealType) ideas? Here are some suggestions based on your preferences and goals:
        
        🎯 **Calorie Target**: \(userProfileManager.getMealCalorieTarget(for: mealType)) calories
        💪 **Protein Goal**: \(Int(userProfileManager.getMealProteinTarget(for: mealType)))g
        
        Try these options that fit your plan!
        """
        
        return CoachMessage(
            content: message,
            type: .coach,
            suggestions: suggestions
        )
    }
    
    private func generateHydrationAdvice() -> CoachMessage {
        let waterGoal = userProfileManager.waterGoal // in liters
        let recentIntake = analyticsManager.getAverageWaterIntake(days: 7)
        let hydrationRatio = recentIntake / waterGoal
        
        var message = ""
        var suggestions: [CoachSuggestion] = []
        
        if hydrationRatio < 0.8 {
            message = """
            💧 **Hydration Alert**: You're only reaching \(Int(hydrationRatio * 100))% of your daily water goal.
            
            Your body needs adequate hydration for:
            • Nutrient transport
            • Temperature regulation
            • Joint lubrication
            • Optimal metabolism
            
            **Tips to increase water intake:**
            • Start your day with a glass of water
            • Keep a water bottle visible
            • Set hourly reminders
            • Add lemon or cucumber for flavor
            """
            
            suggestions = [
                CoachSuggestion(
                    title: "Set Water Reminder",
                    description: "Every 2 hours",
                    icon: "drop.fill",
                    action: .scheduleReminder(
                        time: Date().addingTimeInterval(7200),
                        message: "Time to hydrate! 💧"
                    )
                )
            ]
        } else {
            message = """
            💧 **Excellent Hydration!** You're consistently meeting your water goals.
            
            You're averaging \(String(format: "%.1f", recentIntake))L per day. Keep it up!
            
            **Pro tip**: Monitor your urine color - pale yellow indicates good hydration.
            """
        }
        
        return CoachMessage(
            content: message,
            type: .coach,
            suggestions: suggestions.isEmpty ? nil : suggestions
        )
    }
    
    private func generateProgressReport() -> CoachMessage {
        let streakDays = analyticsManager.currentStreak
        let weeklyCalories = analyticsManager.getAverageCaloriesForPeriod(7)
        let goalCalories = userProfileManager.dailyCalorieGoal
        let calorieAccuracy = 1.0 - abs(Double(weeklyCalories - goalCalories)) / Double(goalCalories)
        
        let insights = analyticsManager.weeklyInsights
        let consistency = insights?.consistencyScore ?? 0
        
        let message = """
        📊 **Your Weekly Progress Report**
        
        🔥 **Streak**: \(streakDays) days of consistent logging
        🎯 **Calorie Accuracy**: \(Int(calorieAccuracy * 100))% on target
        ⭐ **Consistency Score**: \(Int(consistency))%
        
        **Achievements this week:**
        \(insights?.achievements.map { "• \($0)" }.joined(separator: "\n") ?? "• Keep logging to unlock achievements!")
        
        **Top foods:**
        \(insights?.topFoods.prefix(3).map { "• \($0)" }.joined(separator: "\n") ?? "• No data yet")
        
        You're doing great! Keep up the momentum! 💪
        """
        
        let suggestions = [
            CoachSuggestion(
                title: "View Detailed Analytics",
                description: "See your full progress",
                icon: "chart.line.uptrend.xyaxis",
                action: .viewProgress(metric: "all")
            )
        ]
        
        return CoachMessage(
            content: message,
            type: .coach,
            suggestions: suggestions
        )
    }
    
    private func generateGeneralAdvice(for input: String) -> CoachMessage {
        let message = """
        I'm here to help you with your nutrition journey! I can assist with:
        
        📊 **Nutrition Analysis**: Understanding your macros and calories
        🎯 **Goal Setting**: Weight loss, muscle gain, or maintenance
        🥗 **Meal Planning**: Personalized meal suggestions
        💧 **Hydration**: Water intake tracking and reminders
        📈 **Progress Tracking**: Weekly reports and insights
        
        What would you like to know more about?
        """
        
        let suggestions = [
            CoachSuggestion(
                title: "Check Progress",
                description: "View your stats",
                icon: "chart.bar.fill",
                action: .viewProgress(metric: "overview")
            ),
            CoachSuggestion(
                title: "Meal Ideas",
                description: "Get suggestions",
                icon: "fork.knife",
                action: .viewMealPlan(planId: "suggestions")
            )
        ]
        
        return CoachMessage(
            content: message,
            type: .coach,
            suggestions: suggestions
        )
    }
    
    // MARK: - Helper Methods
    
    private func setupWelcomeMessage() {
        let welcomeMessage = CoachMessage(
            content: """
            👋 Hi! I'm your AI Nutrition Coach.
            
            I'm here to help you reach your health goals through personalized nutrition guidance. I can:
            • Analyze your eating patterns
            • Suggest balanced meals
            • Track your progress
            • Answer nutrition questions
            
            What would you like to work on today?
            """,
            type: .coach,
            suggestions: [
                CoachSuggestion(
                    title: "Analyze My Nutrition",
                    description: "Get insights on your recent meals",
                    icon: "chart.pie.fill",
                    action: .viewProgress(metric: "nutrition")
                ),
                CoachSuggestion(
                    title: "Meal Suggestions",
                    description: "Get personalized meal ideas",
                    icon: "fork.knife.circle.fill",
                    action: .viewMealPlan(planId: "today")
                )
            ]
        )
        
        messages.append(welcomeMessage)
    }
    
    private func loadInitialInsights() {
        Task {
            _ = await analyzeNutritionPattern()
        }
    }
    
    private func createDailyCheckIn() async -> CoachMessage {
        let hour = Calendar.current.component(.hour, from: Date())
        let timeOfDay = getTimeOfDay(hour: hour)
        let todaysCalories = analyticsManager.getTodaysCalories()
        let remainingCalories = userProfileManager.dailyCalorieGoal - todaysCalories
        
        let message = """
        Good \(timeOfDay)! 🌟
        
        **Daily Check-in:**
        • Calories so far: \(todaysCalories)
        • Remaining: \(remainingCalories)
        • Water: Don't forget to stay hydrated!
        
        How are you feeling today? Any questions about your nutrition?
        """
        
        return CoachMessage(
            content: message,
            type: .coach,
            suggestions: [
                CoachSuggestion(
                    title: "Log Water",
                    description: "Track hydration",
                    icon: "drop.fill",
                    action: .logFood(foodName: "Water")
                )
            ]
        )
    }
    
    private func getTimeOfDay(hour: Int) -> String {
        switch hour {
        case 5...11: return "morning"
        case 12...16: return "afternoon"
        case 17...20: return "evening"
        default: return "night"
        }
    }
    
    private func analyzeMealTiming() -> CoachingInsight? {
        // Analyze meal timing patterns
        let mealTimes = analyticsManager.getAverageMealTimes()
        
        // Check for irregular eating patterns
        if let breakfastTime = mealTimes["breakfast"],
           let lunchTime = mealTimes["lunch"],
           let dinnerTime = mealTimes["dinner"] {
            
            let gapBetweenMeals = (lunchTime - breakfastTime, dinnerTime - lunchTime)
            
            if gapBetweenMeals.0 > 6 || gapBetweenMeals.1 > 6 {
                return CoachingInsight(
                    category: .timing,
                    title: "Long Gaps Between Meals",
                    message: "You have gaps longer than 6 hours between meals",
                    priority: .medium,
                    recommendations: [
                        "Add a healthy snack between meals",
                        "Consider more frequent, smaller meals",
                        "Keep protein-rich snacks handy"
                    ],
                    dataPoints: [
                        CoachingInsight.DataPoint(
                            label: "Breakfast-Lunch",
                            value: "\(Int(gapBetweenMeals.0))h",
                            trend: .stable
                        ),
                        CoachingInsight.DataPoint(
                            label: "Lunch-Dinner",
                            value: "\(Int(gapBetweenMeals.1))h",
                            trend: .stable
                        )
                    ]
                )
            }
        }
        
        return nil
    }
    
    private func analyzeHydration() -> CoachingInsight? {
        let avgWater = analyticsManager.getAverageWaterIntake(days: 7)
        let waterGoal = userProfileManager.waterGoal
        
        if avgWater < waterGoal * 0.7 {
            return CoachingInsight(
                category: .hydration,
                title: "Low Water Intake",
                message: "Your hydration levels are below recommended",
                priority: .high,
                recommendations: [
                    "Set hourly water reminders",
                    "Keep a water bottle with you",
                    "Drink a glass before each meal",
                    "Try flavored water or herbal teas"
                ],
                dataPoints: [
                    CoachingInsight.DataPoint(
                        label: "Current",
                        value: "\(String(format: "%.1f", avgWater))L",
                        trend: .down
                    ),
                    CoachingInsight.DataPoint(
                        label: "Goal",
                        value: "\(String(format: "%.1f", waterGoal))L",
                        trend: .stable
                    )
                ]
            )
        }
        
        return nil
    }
}

// MARK: - User Intent

private enum UserIntent {
    case macroQuestion
    case weightGoals
    case mealAdvice
    case hydration
    case progressCheck
    case general
}

// MARK: - Extensions

extension UserProfileManager {
    func getMealCalorieTarget(for meal: String) -> Int {
        let dailyCalories = dailyCalorieGoal
        
        switch meal.lowercased() {
        case "breakfast":
            return Int(Double(dailyCalories) * 0.25)
        case "lunch":
            return Int(Double(dailyCalories) * 0.35)
        case "dinner":
            return Int(Double(dailyCalories) * 0.3)
        case "snack":
            return Int(Double(dailyCalories) * 0.1)
        default:
            return Int(Double(dailyCalories) * 0.25)
        }
    }
    
    func getMealProteinTarget(for meal: String) -> Double {
        let dailyProtein = proteinGoal
        
        switch meal.lowercased() {
        case "breakfast":
            return dailyProtein * 0.25
        case "lunch":
            return dailyProtein * 0.35
        case "dinner":
            return dailyProtein * 0.3
        case "snack":
            return dailyProtein * 0.1
        default:
            return dailyProtein * 0.25
        }
    }
    
    func calculateDailyCalorieDeficit() -> Int {
        switch goalType {
        case .loseWeight:
            // 500 calorie deficit for 1 lb/week loss
            return 500
        case .gainMuscle:
            // 300 calorie surplus for lean gains
            return -300
        case .maintainWeight:
            return 0
        }
    }
}