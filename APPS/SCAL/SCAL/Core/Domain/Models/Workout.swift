//
//  Workout.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Workout data models for exercise plans and routines
//

import Foundation

// MARK: - Workout Plan

struct WorkoutPlan: Identifiable, Codable {
    let id = UUID()
    let name: String
    let type: WorkoutType
    let difficulty: WorkoutDifficulty
    let goal: WorkoutGoal
    let exercises: [WorkoutExercise]
    let estimatedDuration: Int // minutes
    let estimatedCaloriesBurned: Int
    let equipmentNeeded: [Equipment]
    let muscleGroups: [MuscleGroup]
    let description: String?
    let createdAt: Date
    
    var totalSets: Int {
        exercises.reduce(0) { $0 + $1.sets }
    }
    
    init(
        name: String,
        type: WorkoutType,
        difficulty: WorkoutDifficulty,
        goal: WorkoutGoal,
        exercises: [WorkoutExercise],
        estimatedDuration: Int,
        estimatedCaloriesBurned: Int,
        equipmentNeeded: [Equipment] = [],
        muscleGroups: [MuscleGroup] = [],
        description: String? = nil,
        createdAt: Date = Date()
    ) {
        self.name = name
        self.type = type
        self.difficulty = difficulty
        self.goal = goal
        self.exercises = exercises
        self.estimatedDuration = estimatedDuration
        self.estimatedCaloriesBurned = estimatedCaloriesBurned
        self.equipmentNeeded = equipmentNeeded
        self.muscleGroups = muscleGroups
        self.description = description
        self.createdAt = createdAt
    }
}

// MARK: - Workout Exercise

struct WorkoutExercise: Identifiable, Codable {
    let id = UUID()
    let name: String
    let sets: Int
    let reps: Int? // For strength exercises
    let weight: Double? // Optional weight in kg
    let duration: Int? // Duration in seconds for cardio/timed exercises
    let restSeconds: Int // Rest between sets
    let muscleGroup: MuscleGroup?
    let notes: String?
    
    init(
        name: String,
        sets: Int,
        reps: Int? = nil,
        weight: Double? = nil,
        duration: Int? = nil,
        restSeconds: Int = 60,
        muscleGroup: MuscleGroup? = nil,
        notes: String? = nil
    ) {
        self.name = name
        self.sets = sets
        self.reps = reps
        self.weight = weight
        self.duration = duration
        self.restSeconds = restSeconds
        self.muscleGroup = muscleGroup
        self.notes = notes
    }
}

// MARK: - Workout Type

enum WorkoutType: String, Codable, CaseIterable {
    case strength = "Strength Training"
    case cardio = "Cardio"
    case hiit = "HIIT"
    case yoga = "Yoga"
    case stretching = "Stretching"
    case mixed = "Mixed"
    
    var icon: String {
        switch self {
        case .strength: return "figure.strengthtraining.traditional"
        case .cardio: return "figure.run"
        case .hiit: return "flame.fill"
        case .yoga: return "figure.yoga"
        case .stretching: return "figure.flexibility"
        case .mixed: return "figure.mixed.cardio"
        }
    }
    
    var description: String {
        switch self {
        case .strength: return "Build muscle and strength"
        case .cardio: return "Improve cardiovascular fitness"
        case .hiit: return "High-intensity interval training"
        case .yoga: return "Flexibility and mindfulness"
        case .stretching: return "Improve flexibility and recovery"
        case .mixed: return "Combination workout"
        }
    }
}

// MARK: - Workout Difficulty

enum WorkoutDifficulty: String, Codable, CaseIterable {
    case beginner = "Beginner"
    case intermediate = "Intermediate"
    case advanced = "Advanced"
    
    var multiplier: Double {
        switch self {
        case .beginner: return 0.8
        case .intermediate: return 1.0
        case .advanced: return 1.3
        }
    }
}

// MARK: - Workout Goal

enum WorkoutGoal: String, Codable, CaseIterable {
    case burnCalories = "Burn Calories"
    case buildMuscle = "Build Muscle"
    case improveCardio = "Improve Cardio"
    case flexibility = "Flexibility"
    case general = "General Fitness"
    
    var icon: String {
        switch self {
        case .burnCalories: return "flame.fill"
        case .buildMuscle: return "figure.strengthtraining.traditional"
        case .improveCardio: return "heart.fill"
        case .flexibility: return "figure.flexibility"
        case .general: return "star.fill"
        }
    }
}

// MARK: - Equipment

enum Equipment: String, Codable, CaseIterable {
    case bodyweight = "Bodyweight"
    case dumbbells = "Dumbbells"
    case barbell = "Barbell"
    case resistanceBands = "Resistance Bands"
    case kettlebell = "Kettlebell"
    case gym = "Gym Equipment"
    case yogaMat = "Yoga Mat"
    case none = "No Equipment"
}

// MARK: - Muscle Group

enum MuscleGroup: String, Codable, CaseIterable {
    case chest = "Chest"
    case back = "Back"
    case shoulders = "Shoulders"
    case biceps = "Biceps"
    case triceps = "Triceps"
    case legs = "Legs"
    case glutes = "Glutes"
    case core = "Core"
    case calves = "Calves"
    case fullBody = "Full Body"
    case cardio = "Cardio"
}

// MARK: - Workout Recommendation

struct WorkoutRecommendation: Identifiable {
    let id = UUID()
    let priority: RecommendationPriority
    let reason: String
    let suggestedWorkoutType: WorkoutType
    let suggestedGoal: WorkoutGoal
    let estimatedCalories: Int
    let reasoning: String
    
    enum RecommendationPriority {
        case high
        case medium
        case low
    }
}

// MARK: - Workout Statistics

struct WorkoutStats {
    let totalWorkouts: Int
    let totalCaloriesBurned: Int
    let averageWorkoutDuration: Int // minutes
    let mostCommonType: WorkoutType?
    let workoutsThisWeek: Int
    let averageCaloriesPerWorkout: Int
}

