//
//  ProfileViewModel.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Profile view model for user settings and preferences
//

import SwiftUI
import Combine

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var isEditing = false
    @Published var showingGoalEditor = false
    @Published var showingHealthKitSync = false
    @Published var showingExportData = false
    @Published var exportMessage = ""
    
    // Temporary editing values
    @Published var tempUserName = ""
    @Published var tempCalorieGoal = 2000
    @Published var tempProteinGoal = 50.0
    @Published var tempCarbsGoal = 250.0
    @Published var tempFatGoal = 65.0
    @Published var tempWeight = 70.0
    @Published var tempHeight = 170.0
    @Published var tempAge = 25
    @Published var tempGender = "Other"
    @Published var tempActivityLevel = "Moderate"
    @Published var tempPreferLocalFood = true
    @Published var tempLocation = "Dubai"
    
    // Computed properties
    var bmi: Double {
        let heightInMeters = userProfile.height / 100
        return userProfile.weight / (heightInMeters * heightInMeters)
    }
    
    var bmiCategory: String {
        switch bmi {
        case ..<18.5: return "Underweight"
        case 18.5..<25: return "Normal"
        case 25..<30: return "Overweight"
        default: return "Obese"
        }
    }
    
    var recommendedCalories: Int {
        // Harris-Benedict equation
        let bmr: Double
        if userProfile.gender == "Male" {
            bmr = 88.362 + (13.397 * userProfile.weight) + (4.799 * userProfile.height) - (5.677 * Double(userProfile.age))
        } else {
            bmr = 447.593 + (9.247 * userProfile.weight) + (3.098 * userProfile.height) - (4.330 * Double(userProfile.age))
        }
        
        let activityMultiplier: Double
        switch userProfile.activityLevel {
        case "Sedentary": activityMultiplier = 1.2
        case "Light": activityMultiplier = 1.375
        case "Moderate": activityMultiplier = 1.55
        case "Active": activityMultiplier = 1.725
        case "Very Active": activityMultiplier = 1.9
        default: activityMultiplier = 1.55
        }
        
        return Int(bmr * activityMultiplier)
    }
    
    // Dependencies
    private let userProfile: UserProfileManager
    private let healthKit = HealthKitManager.shared
    private let mealData: MealDataManager
    private var cancellables = Set<AnyCancellable>()
    
    init(userProfileManager: UserProfileManager, mealDataManager: MealDataManager) {
        self.userProfile = userProfileManager
        self.mealData = mealDataManager
        loadTempValues()
        setupBindings()
    }
    
    private func setupBindings() {
        userProfile.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.objectWillChange.send()
                self?.loadTempValues()
            }
            .store(in: &cancellables)
    }
    
    private func loadTempValues() {
        tempUserName = userProfile.userName
        tempCalorieGoal = userProfile.calorieGoal
        tempProteinGoal = userProfile.proteinGoal
        tempCarbsGoal = userProfile.carbsGoal
        tempFatGoal = userProfile.fatGoal
        tempWeight = userProfile.weight
        tempHeight = userProfile.height
        tempAge = userProfile.age
        tempGender = userProfile.gender
        tempActivityLevel = userProfile.activityLevel
        tempPreferLocalFood = userProfile.preferLocalFood
        tempLocation = userProfile.location
    }
    
    // MARK: - Actions
    
    func startEditing() {
        loadTempValues()
        isEditing = true
    }
    
    func cancelEditing() {
        loadTempValues()
        isEditing = false
    }
    
    func saveChanges() {
        userProfile.userName = tempUserName
        userProfile.calorieGoal = tempCalorieGoal
        userProfile.proteinGoal = tempProteinGoal
        userProfile.carbsGoal = tempCarbsGoal
        userProfile.fatGoal = tempFatGoal
        userProfile.weight = tempWeight
        userProfile.height = tempHeight
        userProfile.age = tempAge
        userProfile.gender = tempGender
        userProfile.activityLevel = tempActivityLevel
        userProfile.preferLocalFood = tempPreferLocalFood
        userProfile.location = tempLocation
        
        userProfile.saveProfile()
        isEditing = false
    }
    
    func calculateRecommendedGoals() {
        tempCalorieGoal = recommendedCalories
        tempProteinGoal = Double(recommendedCalories) * 0.15 / 4 // 15% of calories from protein
        tempCarbsGoal = Double(recommendedCalories) * 0.50 / 4 // 50% of calories from carbs
        tempFatGoal = Double(recommendedCalories) * 0.35 / 9 // 35% of calories from fat
    }
    
    func syncWithHealthKit() {
        showingHealthKitSync = true
        healthKit.requestAuthorization()
    }
    
    func exportMealData() {
        showingExportData = true
        
        // Create CSV data from meals
        var csvContent = "Date,Meal,Calories,Protein,Carbs,Fat\n"
        
        for meal in mealData.todaysMeals {
            csvContent += "\(Date().formatted(date: .abbreviated, time: .omitted)),\(meal.name),\(meal.calories),\(meal.protein),\(meal.carbs),\(meal.fat)\n"
        }
        
        // Save to documents or share
        if let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let fileURL = documentsPath.appendingPathComponent("SCAL_Meals_\(Date().formatted(date: .abbreviated, time: .omitted)).csv")
            
            do {
                try csvContent.write(to: fileURL, atomically: true, encoding: .utf8)
                exportMessage = "Data exported to Documents folder"
            } catch {
                exportMessage = "Export failed: \(error.localizedDescription)"
            }
        }
    }
    
    func resetAllData() {
        // Clear all user data
        UserDefaults.standard.removeObject(forKey: "todaysMeals")
        UserDefaults.standard.removeObject(forKey: "lastSavedDate")
        
        // Reset profile to defaults
        userProfile.userName = ""
        userProfile.calorieGoal = 2000
        userProfile.proteinGoal = 50
        userProfile.carbsGoal = 250
        userProfile.fatGoal = 65
        userProfile.weight = 70
        userProfile.height = 170
        userProfile.age = 25
        userProfile.gender = "Other"
        userProfile.activityLevel = "Moderate"
        userProfile.preferLocalFood = true
        userProfile.location = "Dubai"
        
        userProfile.saveProfile()
        
        // Reload meal data
        mealData.loadTodaysMeals()
    }
    
    // MARK: - Getters
    
    func getUserProfileManager() -> UserProfileManager {
        return userProfile
    }
    
    func getHealthKitManager() -> HealthKitManager {
        return healthKit
    }
    
    func getMealDataManager() -> MealDataManager {
        return mealData
    }
}