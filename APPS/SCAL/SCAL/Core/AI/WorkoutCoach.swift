//
//  WorkoutCoach.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  AI-powered workout companion that generates personalized workouts
//  based on nutrition analysis, user goals, and activity level
//

import SwiftUI
import Foundation

// MARK: - Workout Coach Message

struct WorkoutMessage: Identifiable {
    let id = UUID()
    let content: String
    let type: MessageType
    let timestamp = Date()
    let workoutPlan: WorkoutPlan?
    
    enum MessageType {
        case user
        case coach
        case system
    }
}

// MARK: - AI Workout Coach

@MainActor
class WorkoutCoach: ObservableObject {
    static let shared = WorkoutCoach()
    
    @Published var messages: [WorkoutMessage] = []
    @Published var currentWorkoutPlan: WorkoutPlan?
    @Published var isTyping = false
    @Published var recommendations: [WorkoutRecommendation] = []
    
    private let userProfileManager = UserProfileManager()
    private let analyticsManager = AnalyticsManager.shared
    private let healthKitManager = HealthKitManager.shared
    private let exerciseLibrary = WorkoutExerciseLibrary.shared
    
    init() {
        setupWelcomeMessage()
    }
    
    // MARK: - Public Methods
    
    func sendMessage(_ text: String) {
        let userMessage = WorkoutMessage(
            content: text,
            type: .user,
            workoutPlan: nil
        )
        messages.append(userMessage)
        
        // Process message and generate response
        Task {
            await generateCoachResponse(for: text)
        }
    }
    
    func generateTodayWorkout() async {
        await MainActor.run {
            isTyping = true
        }
        
        // Analyze nutrition and generate workout
        let workoutPlan = await generateWorkoutPlanBasedOnNutrition()
        
        await MainActor.run {
            self.currentWorkoutPlan = workoutPlan
            
            let message = WorkoutMessage(
                content: """
                💪 **Your Personalized Workout for Today**
                
                \(workoutPlan.description ?? "")
                
                **Duration**: \(workoutPlan.estimatedDuration) minutes
                **Estimated Calories**: ~\(workoutPlan.estimatedCaloriesBurned) kcal
                **Type**: \(workoutPlan.type.rawValue)
                **Difficulty**: \(workoutPlan.difficulty.rawValue)
                
                Ready to get started? Let me know if you'd like to adjust anything!
                """,
                type: .coach,
                workoutPlan: workoutPlan
            )
            
            messages.append(message)
            isTyping = false
        }
    }
    
    // MARK: - Workout Generation
    
    func generateWorkoutPlanBasedOnNutrition() async -> WorkoutPlan {
        // Get today's nutrition data
        let todayCalories = analyticsManager.getTodaysCalories()
        let recentData = analyticsManager.getNutritionData(days: 7)
        
        // Get user goals
        let calorieGoal = userProfileManager.calorieGoal
        let proteinGoal = userProfileManager.proteinGoal
        let activityLevel = userProfileManager.activityLevel
        
        // Analyze workout needs
        let recommendation = analyzeWorkoutNeeds(
            todaysCalories: todayCalories,
            calorieGoal: calorieGoal,
            recentData: recentData,
            proteinGoal: proteinGoal
        )
        
        // Generate workout plan
        return await generateWorkoutPlan(
            for: recommendation.suggestedGoal,
            type: recommendation.suggestedWorkoutType,
            duration: calculateWorkoutDuration(activityLevel: activityLevel),
            difficulty: determineDifficulty(activityLevel: activityLevel)
        )
    }
    
    func analyzeWorkoutNeeds(
        todaysCalories: Int,
        calorieGoal: Int,
        recentData: NutritionDataSummary,
        proteinGoal: Double
    ) -> WorkoutRecommendation {
        let calorieDifference = todaysCalories - calorieGoal
        let proteinRatio = recentData.averageProtein.map { $0 / proteinGoal } ?? 1.0
        let carbRatio = recentData.averageCarbs.map { $0 / userProfileManager.carbsGoal } ?? 1.0
        
        var workoutType: WorkoutType = .mixed
        var workoutGoal: WorkoutGoal = .general
        var priority: WorkoutRecommendation.RecommendationPriority = .medium
        var reason: String = ""
        var reasoning: String = ""
        var estimatedCalories: Int = 300
        
        // Rule 1: High calorie surplus → Cardio/HIIT to burn excess
        if calorieDifference > 300 {
            workoutType = .hiit
            workoutGoal = .burnCalories
            priority = .high
            reason = "High calorie intake detected"
            reasoning = "You've consumed \(calorieDifference) calories above your goal. High-intensity cardio will help burn the excess."
            estimatedCalories = min(600, calorieDifference)
        }
        // Rule 2: Low protein → Light strength to preserve muscle
        else if proteinRatio < 0.8 {
            workoutType = .strength
            workoutGoal = .buildMuscle
            priority = .high
            reason = "Low protein intake"
            reasoning = "Your protein intake is \(Int((1 - proteinRatio) * 100))% below goal. Light strength training will help preserve muscle mass."
            estimatedCalories = 250
        }
        // Rule 3: High carbs → Intensive workout to utilize energy
        else if carbRatio > 1.2 {
            workoutType = .hiit
            workoutGoal = .improveCardio
            priority = .medium
            reason = "High carb intake"
            reasoning = "You have plenty of energy from carbs! Perfect time for an intensive workout."
            estimatedCalories = 450
        }
        // Rule 4: Calorie deficit → Moderate cardio + light strength
        else if calorieDifference < -200 {
            workoutType = .mixed
            workoutGoal = .general
            priority = .medium
            reason = "Calorie deficit"
            reasoning = "You're in a calorie deficit. Moderate cardio plus light strength will help preserve lean mass while burning calories."
            estimatedCalories = 350
        }
        // Rule 5: Balanced nutrition → General fitness workout
        else {
            workoutType = .mixed
            workoutGoal = .general
            priority = .low
            reason = "Balanced nutrition"
            reasoning = "Your nutrition looks balanced! A general fitness workout will help maintain your progress."
            estimatedCalories = 300
        }
        
        // Check meal timing - adjust if needed
        let hour = Calendar.current.component(.hour, from: Date())
        if hour >= 18 && hour <= 20 {
            // Evening workout - lighter intensity
            if workoutType == .hiit {
                workoutType = .cardio
                estimatedCalories = Int(Double(estimatedCalories) * 0.8)
                reasoning += " (Lighter evening workout for better sleep)"
            }
        }
        
        // Check if already worked out today (avoid overtraining)
        let todaysWorkoutCalories = healthKitManager.todaysWorkoutCalories
        if todaysWorkoutCalories > 400 {
            workoutType = .yoga
            workoutGoal = .flexibility
            priority = .low
            reason = "Already worked out today"
            reasoning = "You've already burned \(todaysWorkoutCalories) calories today. A light stretching/yoga session would be perfect for recovery."
            estimatedCalories = 100
        }
        
        return WorkoutRecommendation(
            priority: priority,
            reason: reason,
            suggestedWorkoutType: workoutType,
            suggestedGoal: workoutGoal,
            estimatedCalories: estimatedCalories,
            reasoning: reasoning
        )
    }
    
    func generateWorkoutPlan(
        for goal: WorkoutGoal,
        type: WorkoutType,
        duration: Int,
        difficulty: WorkoutDifficulty
    ) async -> WorkoutPlan {
        // Get exercises from library
        let exercises = exerciseLibrary.getExercises(for: type, difficulty: difficulty, goal: goal)
        
        // Select exercises based on duration
        let exercisesNeeded = max(4, duration / 10) // ~10 minutes per exercise
        let selectedExercises = Array(exercises.prefix(exercisesNeeded))
        
        // Ensure we have exercises
        var finalExercises = selectedExercises
        if finalExercises.isEmpty {
            // Fallback to basic exercises
            finalExercises = [
                WorkoutExercise(name: "Warm-up Walk", sets: 1, duration: 300, muscleGroup: .cardio),
                WorkoutExercise(name: "Bodyweight Squats", sets: 3, reps: 15, muscleGroup: .legs),
                WorkoutExercise(name: "Push-ups", sets: 3, reps: 12, muscleGroup: .chest),
                WorkoutExercise(name: "Plank", sets: 3, duration: 60, muscleGroup: .core)
            ]
        }
        
        // Calculate estimated calories
        let estimatedCalories = calculateEstimatedCalories(
            exercises: finalExercises,
            workoutType: type,
            userWeight: userProfileManager.weight
        )
        
        // Determine equipment needed
        let equipment = extractEquipmentNeeded(from: finalExercises)
        
        // Determine muscle groups
        let muscleGroups = Array(Set(finalExercises.compactMap { $0.muscleGroup }))
        
        let workoutName = generateWorkoutName(type: type, goal: goal, difficulty: difficulty)
        
        let description = """
        This \(difficulty.rawValue.lowercased()) workout focuses on \(goal.rawValue.lowercased()) through \(type.rawValue.lowercased()).
        
        \(reasoningForWorkout(type: type, goal: goal))
        """
        
        return WorkoutPlan(
            name: workoutName,
            type: type,
            difficulty: difficulty,
            goal: goal,
            exercises: finalExercises,
            estimatedDuration: duration,
            estimatedCaloriesBurned: estimatedCalories,
            equipmentNeeded: equipment,
            muscleGroups: muscleGroups,
            description: description
        )
    }
    
    // MARK: - Helper Methods
    
    private func calculateWorkoutDuration(activityLevel: String) -> Int {
        switch activityLevel.lowercased() {
        case "sedentary":
            return 20 // Shorter for beginners
        case "light":
            return 30
        case "moderate":
            return 40
        case "active":
            return 45
        case "very active":
            return 60
        default:
            return 30
        }
    }
    
    private func determineDifficulty(activityLevel: String) -> WorkoutDifficulty {
        switch activityLevel.lowercased() {
        case "sedentary", "light":
            return .beginner
        case "moderate", "active":
            return .intermediate
        case "very active":
            return .advanced
        default:
            return .intermediate
        }
    }
    
    private func calculateEstimatedCalories(
        exercises: [WorkoutExercise],
        workoutType: WorkoutType,
        userWeight: Double
    ) -> Int {
        // Base MET values by workout type
        let metValue: Double
        switch workoutType {
        case .strength: metValue = 3.0
        case .cardio: metValue = 7.0
        case .hiit: metValue = 10.0
        case .yoga: metValue = 2.5
        case .stretching: metValue = 2.0
        case .mixed: metValue = 5.0
        }
        
        // Total duration in hours
        let totalSeconds = exercises.reduce(0) { total, exercise in
            total + (exercise.duration ?? (exercise.reps ?? 0) * 2) * exercise.sets + exercise.restSeconds * (exercise.sets - 1)
        }
        let durationHours = Double(totalSeconds) / 3600.0
        
        // Calories = MET × weight(kg) × duration(hours)
        let calories = metValue * userWeight * durationHours
        
        return Int(calories.rounded())
    }
    
    private func extractEquipmentNeeded(from exercises: [WorkoutExercise]) -> [Equipment] {
        // Determine equipment based on exercise names (simplified)
        var equipment: Set<Equipment> = [.bodyweight] // Always have bodyweight option
        
        // This is simplified - in production, exercises would have equipment metadata
        let exerciseNames = exercises.map { $0.name.lowercased() }
        
        if exerciseNames.contains(where: { $0.contains("dumbbell") || $0.contains("press") }) {
            equipment.insert(.dumbbells)
        }
        
        return Array(equipment)
    }
    
    private func generateWorkoutName(type: WorkoutType, goal: WorkoutGoal, difficulty: WorkoutDifficulty) -> String {
        let difficultyStr = difficulty.rawValue
        let typeStr = type.rawValue
        
        return "\(difficultyStr) \(typeStr) - \(goal.rawValue)"
    }
    
    private func reasoningForWorkout(type: WorkoutType, goal: WorkoutGoal) -> String {
        switch goal {
        case .burnCalories:
            return "This workout is designed to maximize calorie burn through high-intensity movements."
        case .buildMuscle:
            return "Focus on progressive overload and proper form to build strength and muscle mass."
        case .improveCardio:
            return "This session will improve your cardiovascular endurance and heart health."
        case .flexibility:
            return "Take your time with each stretch, breathing deeply to enhance flexibility and recovery."
        case .general:
            return "A well-rounded workout that combines strength, cardio, and mobility for overall fitness."
        }
    }
    
    // MARK: - Chat Interface
    
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
    
    private func analyzeIntent(_ input: String) -> WorkoutIntent {
        let lowercased = input.lowercased()
        
        if lowercased.contains("workout") || lowercased.contains("exercise") || lowercased.contains("train") {
            return .generateWorkout
        } else if lowercased.contains("strength") || lowercased.contains("muscle") {
            return .strengthTraining
        } else if lowercased.contains("cardio") || lowercased.contains("run") {
            return .cardio
        } else if lowercased.contains("hiit") || lowercased.contains("intense") {
            return .hiit
        } else if lowercased.contains("yoga") || lowercased.contains("stretch") {
            return .flexibility
        } else if lowercased.contains("calories") || lowercased.contains("burn") {
            return .burnCalories
        } else {
            return .general
        }
    }
    
    private func generateResponseForIntent(_ intent: WorkoutIntent, input: String) async -> WorkoutMessage {
        switch intent {
        case .generateWorkout:
            let workoutPlan = await generateWorkoutPlanBasedOnNutrition()
            await MainActor.run {
                self.currentWorkoutPlan = workoutPlan
            }
            return WorkoutMessage(
                content: "I've created a personalized workout for you based on your nutrition! Check it out above.",
                type: .coach,
                workoutPlan: workoutPlan
            )
        case .strengthTraining:
            return await generateSpecificWorkout(type: .strength, goal: .buildMuscle)
        case .cardio:
            return await generateSpecificWorkout(type: .cardio, goal: .improveCardio)
        case .hiit:
            return await generateSpecificWorkout(type: .hiit, goal: .burnCalories)
        case .flexibility:
            return await generateSpecificWorkout(type: .yoga, goal: .flexibility)
        case .burnCalories:
            return await generateSpecificWorkout(type: .hiit, goal: .burnCalories)
        case .general:
            return generateGeneralWorkoutAdvice(for: input)
        }
    }
    
    private func generateSpecificWorkout(type: WorkoutType, goal: WorkoutGoal) async -> WorkoutMessage {
        let duration = calculateWorkoutDuration(activityLevel: userProfileManager.activityLevel)
        let difficulty = determineDifficulty(activityLevel: userProfileManager.activityLevel)
        
        let workoutPlan = await generateWorkoutPlan(
            for: goal,
            type: type,
            duration: duration,
            difficulty: difficulty
        )
        
        await MainActor.run {
            self.currentWorkoutPlan = workoutPlan
        }
        
        return WorkoutMessage(
            content: "Here's a \(type.rawValue) workout for you!",
            type: .coach,
            workoutPlan: workoutPlan
        )
    }
    
    private func generateGeneralWorkoutAdvice(for input: String) -> WorkoutMessage {
        let message = """
        I'm your AI Workout Companion! I can help you with:
        
        💪 **Personalized Workouts**: Based on your nutrition and goals
        🔥 **Calorie Burning**: High-intensity workouts when you've had extra calories
        🏋️ **Strength Training**: When your protein is low, to preserve muscle
        🏃 **Cardio**: To improve heart health and endurance
        🧘 **Recovery**: Yoga and stretching for rest days
        
        Just ask me to "generate a workout" or tell me what you're looking for!
        """
        
        return WorkoutMessage(
            content: message,
            type: .coach,
            workoutPlan: nil
        )
    }
    
    private func setupWelcomeMessage() {
        let welcomeMessage = WorkoutMessage(
            content: """
            👋 Hi! I'm your AI Workout Companion.
            
            I create personalized workouts based on your nutrition analysis, goals, and activity level.
            
            I can:
            • Generate workouts based on your daily nutrition
            • Adjust intensity based on your calorie intake
            • Preserve muscle when protein is low
            • Burn excess calories when you've eaten more
            • Help you recover on rest days
            
            Ask me to "generate a workout" to get started!
            """,
            type: .coach,
            workoutPlan: nil
        )
        
        messages.append(welcomeMessage)
    }
}

// MARK: - Workout Intent

private enum WorkoutIntent {
    case generateWorkout
    case strengthTraining
    case cardio
    case hiit
    case flexibility
    case burnCalories
    case general
}

// MARK: - UserProfileManager Extensions

extension UserProfileManager {
    var dailyCalorieGoal: Int {
        calorieGoal
    }
    
    var waterGoal: Double {
        // Default 2.5L per day, can be customized
        return 2.5
    }
}

