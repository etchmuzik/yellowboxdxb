//
//  WorkoutView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Workout AI companion view with chat interface and workout plans
//

import SwiftUI

struct WorkoutView: View {
    @EnvironmentObject var dataManager: MealDataManager
    @EnvironmentObject var profileManager: UserProfileManager
    @StateObject private var workoutCoach = WorkoutCoach.shared
    @State private var inputText = ""
    
    var body: some View {
        ZStack {
            Color.calBackground.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Glass Navigation Bar
                Text("WORKOUTS")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.calTextPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top)
                
                // Quick action buttons
                quickActionButtons
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                
                // Messages and workout plans
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(workoutCoach.messages) { message in
                                WorkoutMessageBubble(message: message)
                                    .id(message.id)
                            }
                            
                            if workoutCoach.isTyping {
                                TypingIndicator()
                                    .id("typing")
                            }
                        }
                        .padding()
                    }
                    .onChange(of: workoutCoach.messages.count) { _, _ in
                        withAnimation {
                            if workoutCoach.isTyping {
                                proxy.scrollTo("typing", anchor: .bottom)
                            } else if let lastId = workoutCoach.messages.last?.id {
                                proxy.scrollTo(lastId, anchor: .bottom)
                            }
                        }
                    }
                }
                
                // Input area with glass effect
                HStack(spacing: 12) {
                    TextField("Ask about workouts...", text: $inputText)
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                )
                        )
                        .foregroundColor(.white)
                        .onSubmit {
                            sendMessage()
                        }
                    
                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill")
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .calCard()
                            .opacity(inputText.isEmpty ? 0.5 : 1)
                    }
                    .disabled(inputText.isEmpty)
                }
                .padding()
                .background(
                    ZStack {
                        Rectangle()
                            .fill(.ultraThinMaterial)
                        
                        VStack {
                            Rectangle()
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            Color.white.opacity(0.2),
                                            Color.white.opacity(0.05)
                                        ],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .frame(height: 1)
                            Spacer()
                        }
                    }
                )
            }
        }
        .onAppear {
            // Load initial workout recommendation if needed
            if workoutCoach.messages.isEmpty {
                // Welcome message is already set in WorkoutCoach init
            }
        }
    }
    
    // MARK: - Quick Action Buttons
    
    private var quickActionButtons: some View {
        HStack(spacing: 12) {
            Button(action: {
                Task {
                    await workoutCoach.generateTodayWorkout()
                }
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                    Text("Generate Workout")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .calCard()
            }
            
            Button(action: {
                workoutCoach.sendMessage("Show me workout history")
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "clock.fill")
                    Text("History")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .calCard()
            }
        }
    }
    
    // MARK: - Message Sending
    
    private func sendMessage() {
        guard !inputText.isEmpty else { return }
        
        workoutCoach.sendMessage(inputText)
        inputText = ""
    }
}

// MARK: - Workout Message Bubble

struct WorkoutMessageBubble: View {
    let message: WorkoutMessage
    
    var body: some View {
        VStack(alignment: message.type == .user ? .trailing : .leading, spacing: 8) {
            HStack {
                if message.type == .user { Spacer() }
                
                VStack(alignment: message.type == .user ? .trailing : .leading, spacing: 0) {
                    Text(message.content)
                        .padding(12)
                        .foregroundColor(.white)
                        .background(
                            Group {
                                if message.type == .user {
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(
                                            LinearGradient(
                                                colors: [Color.calPrimary, Color.calPrimary.opacity(0.8)],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            )
                                        )
                                } else {
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(.ultraThinMaterial)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 16)
                                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                        )
                                }
                            }
                        )
                        .frame(maxWidth: 300, alignment: message.type == .user ? .trailing : .leading)
                    
                    // Workout plan card if present
                    if let workout = message.workoutPlan {
                        WorkoutPlanCard(workout: workout)
                            .padding(.top, 8)
                    }
                }
                
                if message.type != .user { Spacer() }
            }
        }
    }
}

// MARK: - Workout Plan Card

struct WorkoutPlanCard: View {
    let workout: WorkoutPlan
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: workout.type.icon)
                    .font(.title2)
                    .foregroundColor(.calPrimary)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(workout.name)
                        .font(.headline)
                        .foregroundColor(.calTextPrimary)
                    
                    Text("\(workout.difficulty.rawValue) • \(workout.estimatedDuration) min")
                        .font(.caption)
                        .foregroundColor(.calTextSecondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(workout.estimatedCaloriesBurned)")
                        .font(.headline)
                        .foregroundColor(.calPrimary)
                    Text("kcal")
                        .font(.caption2)
                        .foregroundColor(.calTextSecondary)
                }
            }
            
            Divider()
                .background(Color.white.opacity(0.2))
            
            // Exercises list
            VStack(alignment: .leading, spacing: 8) {
                Text("Exercises")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.calTextPrimary)
                
                ForEach(Array(workout.exercises.prefix(5))) { exercise in
                    ExerciseRow(exercise: exercise)
                }
                
                if workout.exercises.count > 5 {
                    Text("+ \(workout.exercises.count - 5) more exercises")
                        .font(.caption)
                        .foregroundColor(.calTextSecondary)
                        .padding(.top, 4)
                }
            }
            
            // Action button
            Button(action: {
                // Save workout to HealthKit
                Task {
                    await HealthKitManager.shared.saveWorkout(workout)
                }
            }) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Start Workout")
                }
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                colors: [Color.calPrimary, Color.calPrimary.opacity(0.8)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                )
            }
            .padding(.top, 4)
        }
        .padding()
        .calCard()
    }
}

// MARK: - Exercise Row

struct ExerciseRow: View {
    let exercise: WorkoutExercise
    
    var body: some View {
        HStack(spacing: 12) {
            // Exercise icon
            Image(systemName: exerciseIcon(for: exercise.muscleGroup))
                .foregroundColor(.calPrimary)
                .frame(width: 24)
            
            // Exercise details
            VStack(alignment: .leading, spacing: 2) {
                Text(exercise.name)
                    .font(.subheadline)
                    .foregroundColor(.calTextPrimary)
                
                HStack(spacing: 8) {
                    if let reps = exercise.reps {
                        Text("\(exercise.sets) sets × \(reps) reps")
                            .font(.caption)
                            .foregroundColor(.calTextSecondary)
                    } else if let duration = exercise.duration {
                        Text("\(exercise.sets) sets × \(duration)s")
                            .font(.caption)
                            .foregroundColor(.calTextSecondary)
                    } else {
                        Text("\(exercise.sets) sets")
                            .font(.caption)
                            .foregroundColor(.calTextSecondary)
                    }
                    
                    if let weight = exercise.weight, weight > 0 {
                        Text("• \(Int(weight))kg")
                            .font(.caption)
                            .foregroundColor(.calTextSecondary)
                    }
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
    
    private func exerciseIcon(for muscleGroup: MuscleGroup?) -> String {
        guard let muscleGroup = muscleGroup else { return "figure.strengthtraining.traditional" }
        
        switch muscleGroup {
        case .chest: return "figure.strengthtraining.traditional"
        case .back: return "figure.rower"
        case .shoulders: return "figure.strengthtraining.functional"
        case .biceps, .triceps: return "figure.flexibility"
        case .legs, .glutes, .calves: return "figure.run"
        case .core: return "figure.core.training"
        case .cardio: return "heart.fill"
        case .fullBody: return "figure.mixed.cardio"
        }
    }
}

