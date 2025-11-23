//
//  WorkoutExerciseLibrary.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Pre-defined exercise database for workout generation
//

import Foundation

struct WorkoutExerciseLibrary {
    static let shared = WorkoutExerciseLibrary()
    
    // MARK: - Strength Exercises
    
    static let strengthExercises: [WorkoutExercise] = [
        // Chest
        WorkoutExercise(
            name: "Push-ups",
            sets: 3,
            reps: 12,
            muscleGroup: .chest,
            notes: "Keep core engaged"
        ),
        WorkoutExercise(
            name: "Chest Press (Dumbbell)",
            sets: 3,
            reps: 10,
            weight: 0, // Will be personalized
            muscleGroup: .chest
        ),
        WorkoutExercise(
            name: "Incline Push-ups",
            sets: 3,
            reps: 12,
            muscleGroup: .chest
        ),
        
        // Back
        WorkoutExercise(
            name: "Pull-ups",
            sets: 3,
            reps: 8,
            muscleGroup: .back
        ),
        WorkoutExercise(
            name: "Bent-over Rows",
            sets: 3,
            reps: 10,
            weight: 0,
            muscleGroup: .back
        ),
        WorkoutExercise(
            name: "Superman",
            sets: 3,
            reps: 15,
            muscleGroup: .back
        ),
        
        // Shoulders
        WorkoutExercise(
            name: "Shoulder Press",
            sets: 3,
            reps: 10,
            weight: 0,
            muscleGroup: .shoulders
        ),
        WorkoutExercise(
            name: "Lateral Raises",
            sets: 3,
            reps: 12,
            weight: 0,
            muscleGroup: .shoulders
        ),
        WorkoutExercise(
            name: "Pike Push-ups",
            sets: 3,
            reps: 10,
            muscleGroup: .shoulders
        ),
        
        // Arms
        WorkoutExercise(
            name: "Bicep Curls",
            sets: 3,
            reps: 12,
            weight: 0,
            muscleGroup: .biceps
        ),
        WorkoutExercise(
            name: "Tricep Dips",
            sets: 3,
            reps: 12,
            muscleGroup: .triceps
        ),
        WorkoutExercise(
            name: "Hammer Curls",
            sets: 3,
            reps: 12,
            weight: 0,
            muscleGroup: .biceps
        ),
        
        // Legs
        WorkoutExercise(
            name: "Squats",
            sets: 3,
            reps: 15,
            muscleGroup: .legs
        ),
        WorkoutExercise(
            name: "Lunges",
            sets: 3,
            reps: 12,
            muscleGroup: .legs
        ),
        WorkoutExercise(
            name: "Leg Press",
            sets: 3,
            reps: 12,
            weight: 0,
            muscleGroup: .legs
        ),
        WorkoutExercise(
            name: "Deadlifts",
            sets: 3,
            reps: 8,
            weight: 0,
            muscleGroup: .legs
        ),
        
        // Glutes
        WorkoutExercise(
            name: "Hip Thrusts",
            sets: 3,
            reps: 12,
            muscleGroup: .glutes
        ),
        WorkoutExercise(
            name: "Glute Bridges",
            sets: 3,
            reps: 15,
            muscleGroup: .glutes
        ),
        WorkoutExercise(
            name: "Bulgarian Split Squats",
            sets: 3,
            reps: 10,
            muscleGroup: .glutes
        ),
        
        // Core
        WorkoutExercise(
            name: "Plank",
            sets: 3,
            duration: 60,
            restSeconds: 30,
            muscleGroup: .core
        ),
        WorkoutExercise(
            name: "Crunches",
            sets: 3,
            reps: 20,
            muscleGroup: .core
        ),
        WorkoutExercise(
            name: "Russian Twists",
            sets: 3,
            reps: 20,
            muscleGroup: .core
        ),
        WorkoutExercise(
            name: "Mountain Climbers",
            sets: 3,
            reps: 30,
            muscleGroup: .core
        ),
        
        // Full Body
        WorkoutExercise(
            name: "Burpees",
            sets: 3,
            reps: 10,
            muscleGroup: .fullBody
        ),
        WorkoutExercise(
            name: "Jumping Jacks",
            sets: 3,
            reps: 30,
            muscleGroup: .fullBody
        )
    ]
    
    // MARK: - Cardio Exercises
    
    static let cardioExercises: [WorkoutExercise] = [
        WorkoutExercise(
            name: "Running",
            sets: 1,
            duration: 1800, // 30 minutes
            muscleGroup: .cardio
        ),
        WorkoutExercise(
            name: "Cycling",
            sets: 1,
            duration: 1800,
            muscleGroup: .cardio
        ),
        WorkoutExercise(
            name: "Jump Rope",
            sets: 5,
            duration: 60,
            restSeconds: 30,
            muscleGroup: .cardio
        ),
        WorkoutExercise(
            name: "High Knees",
            sets: 4,
            duration: 45,
            restSeconds: 15,
            muscleGroup: .cardio
        ),
        WorkoutExercise(
            name: "Butt Kicks",
            sets: 4,
            duration: 45,
            restSeconds: 15,
            muscleGroup: .cardio
        ),
        WorkoutExercise(
            name: "Brisk Walking",
            sets: 1,
            duration: 2400, // 40 minutes
            muscleGroup: .cardio
        )
    ]
    
    // MARK: - HIIT Exercises
    
    static let hiitExercises: [WorkoutExercise] = [
        WorkoutExercise(
            name: "Burpees",
            sets: 4,
            duration: 30,
            restSeconds: 30,
            muscleGroup: .fullBody
        ),
        WorkoutExercise(
            name: "Mountain Climbers",
            sets: 4,
            duration: 30,
            restSeconds: 30,
            muscleGroup: .core
        ),
        WorkoutExercise(
            name: "Jump Squats",
            sets: 4,
            reps: 15,
            restSeconds: 45,
            muscleGroup: .legs
        ),
        WorkoutExercise(
            name: "Jumping Jacks",
            sets: 4,
            duration: 30,
            restSeconds: 30,
            muscleGroup: .fullBody
        ),
        WorkoutExercise(
            name: "High Knees",
            sets: 4,
            duration: 30,
            restSeconds: 30,
            muscleGroup: .cardio
        ),
        WorkoutExercise(
            name: "Plank Jacks",
            sets: 4,
            duration: 30,
            restSeconds: 30,
            muscleGroup: .core
        )
    ]
    
    // MARK: - Yoga/Stretching Exercises
    
    static let yogaExercises: [WorkoutExercise] = [
        WorkoutExercise(
            name: "Downward Dog",
            sets: 1,
            duration: 60,
            muscleGroup: .fullBody,
            notes: "Hold and breathe"
        ),
        WorkoutExercise(
            name: "Warrior I",
            sets: 1,
            duration: 45,
            muscleGroup: .legs
        ),
        WorkoutExercise(
            name: "Warrior II",
            sets: 1,
            duration: 45,
            muscleGroup: .legs
        ),
        WorkoutExercise(
            name: "Child's Pose",
            sets: 1,
            duration: 60,
            muscleGroup: .fullBody
        ),
        WorkoutExercise(
            name: "Cat-Cow Stretch",
            sets: 1,
            reps: 10,
            muscleGroup: .back
        ),
        WorkoutExercise(
            name: "Sun Salutation",
            sets: 3,
            reps: 1,
            muscleGroup: .fullBody
        )
    ]
    
    // MARK: - Helper Methods
    
    func getExercises(for type: WorkoutType, difficulty: WorkoutDifficulty, goal: WorkoutGoal) -> [WorkoutExercise] {
        var exercises: [WorkoutExercise] = []
        
        switch type {
        case .strength:
            exercises = Self.strengthExercises
        case .cardio:
            exercises = Self.cardioExercises
        case .hiit:
            exercises = Self.hiitExercises
        case .yoga, .stretching:
            exercises = Self.yogaExercises
        case .mixed:
            // Combine exercises from multiple types
            exercises = Array(Self.strengthExercises.prefix(6)) + 
                       Array(Self.cardioExercises.prefix(3)) +
                       Array(Self.hiitExercises.prefix(2))
        }
        
        // Filter by goal
        if goal == .buildMuscle {
            exercises = exercises.filter { $0.muscleGroup != .cardio }
        } else if goal == .improveCardio {
            exercises = exercises.filter { $0.muscleGroup == .cardio || $0.muscleGroup == .fullBody }
        } else if goal == .flexibility {
            exercises = Self.yogaExercises
        }
        
        // Adjust for difficulty
        return adjustForDifficulty(exercises, difficulty: difficulty)
    }
    
    private func adjustForDifficulty(_ exercises: [WorkoutExercise], difficulty: WorkoutDifficulty) -> [WorkoutExercise] {
        exercises.map { exercise in
            var adjusted = exercise
            
            switch difficulty {
            case .beginner:
                if let reps = exercise.reps {
                    adjusted = WorkoutExercise(
                        name: exercise.name,
                        sets: max(2, exercise.sets - 1),
                        reps: max(8, reps - 4),
                        weight: exercise.weight,
                        duration: exercise.duration != nil ? exercise.duration! / 2 : nil,
                        restSeconds: exercise.restSeconds + 30,
                        muscleGroup: exercise.muscleGroup,
                        notes: exercise.notes
                    )
                } else if let duration = exercise.duration {
                    adjusted = WorkoutExercise(
                        name: exercise.name,
                        sets: max(2, exercise.sets - 1),
                        reps: exercise.reps,
                        weight: exercise.weight,
                        duration: duration / 2,
                        restSeconds: exercise.restSeconds + 30,
                        muscleGroup: exercise.muscleGroup,
                        notes: exercise.notes
                    )
                }
            case .intermediate:
                // Keep as is
                break
            case .advanced:
                if let reps = exercise.reps {
                    adjusted = WorkoutExercise(
                        name: exercise.name,
                        sets: exercise.sets + 1,
                        reps: reps + 5,
                        weight: exercise.weight,
                        duration: exercise.duration != nil ? exercise.duration! + 30 : nil,
                        restSeconds: max(15, exercise.restSeconds - 15),
                        muscleGroup: exercise.muscleGroup,
                        notes: exercise.notes
                    )
                } else if let duration = exercise.duration {
                    adjusted = WorkoutExercise(
                        name: exercise.name,
                        sets: exercise.sets + 1,
                        reps: exercise.reps,
                        weight: exercise.weight,
                        duration: duration + 30,
                        restSeconds: max(15, exercise.restSeconds - 15),
                        muscleGroup: exercise.muscleGroup,
                        notes: exercise.notes
                    )
                }
            }
            
            return adjusted
        }
    }
    
    func getRandomExercise(for type: WorkoutType, muscleGroup: MuscleGroup? = nil) -> WorkoutExercise? {
        let exercises = getExercises(for: type, difficulty: .intermediate, goal: .general)
        
        if let muscleGroup = muscleGroup {
            return exercises.filter { $0.muscleGroup == muscleGroup }.randomElement()
        }
        
        return exercises.randomElement()
    }
}

