//
//  UserProfileManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  User profile and preferences manager
//

import SwiftUI

class UserProfileManager: ObservableObject {
    @Published var userName: String = ""
    @Published var calorieGoal: Int = 2000
    @Published var proteinGoal: Double = 50
    @Published var carbsGoal: Double = 250
    @Published var fatGoal: Double = 65
    @Published var weight: Double = 70
    @Published var height: Double = 170
    @Published var age: Int = 25
    @Published var gender: String = "Other"
    @Published var activityLevel: String = "Moderate"
    @Published var preferLocalFood: Bool = true  // Default to GCC foods
    @Published var location: String = "Dubai"     // User location
    
    private let userDefaults = UserDefaults.standard
    
    init() {
        loadProfile()
    }
    
    func loadProfile() {
        userName = userDefaults.string(forKey: "userName") ?? ""
        calorieGoal = userDefaults.integer(forKey: "calorieGoal")
        if calorieGoal == 0 { calorieGoal = 2000 }
        proteinGoal = userDefaults.double(forKey: "proteinGoal")
        if proteinGoal == 0 { proteinGoal = 50 }
        carbsGoal = userDefaults.double(forKey: "carbsGoal")
        if carbsGoal == 0 { carbsGoal = 250 }
        fatGoal = userDefaults.double(forKey: "fatGoal")
        if fatGoal == 0 { fatGoal = 65 }
        weight = userDefaults.double(forKey: "weight")
        if weight == 0 { weight = 70 }
        height = userDefaults.double(forKey: "height")
        if height == 0 { height = 170 }
        age = userDefaults.integer(forKey: "age")
        if age == 0 { age = 25 }
        gender = userDefaults.string(forKey: "gender") ?? "Other"
        activityLevel = userDefaults.string(forKey: "activityLevel") ?? "Moderate"
        preferLocalFood = userDefaults.bool(forKey: "preferLocalFood")
        if !userDefaults.bool(forKey: "hasSetFoodPreference") {
            preferLocalFood = true  // Default to true for new users
            userDefaults.set(true, forKey: "hasSetFoodPreference")
        }
        location = userDefaults.string(forKey: "location") ?? "Dubai"
    }
    
    func saveProfile() {
        userDefaults.set(userName, forKey: "userName")
        userDefaults.set(calorieGoal, forKey: "calorieGoal")
        userDefaults.set(proteinGoal, forKey: "proteinGoal")
        userDefaults.set(carbsGoal, forKey: "carbsGoal")
        userDefaults.set(fatGoal, forKey: "fatGoal")
        userDefaults.set(weight, forKey: "weight")
        userDefaults.set(height, forKey: "height")
        userDefaults.set(age, forKey: "age")
        userDefaults.set(gender, forKey: "gender")
        userDefaults.set(activityLevel, forKey: "activityLevel")
        userDefaults.set(preferLocalFood, forKey: "preferLocalFood")
        userDefaults.set(location, forKey: "location")
    }
}