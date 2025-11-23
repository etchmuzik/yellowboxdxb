import Foundation

struct User: Codable {
    let id: UUID
    var name: String
    var email: String?
    
    // Profile
    var age: Int?
    var gender: Gender?
    var height: Double? // in cm
    var weight: Double? // in kg
    var activityLevel: ActivityLevel
    
    // Goals
    var dailyCalorieGoal: Int?
    var proteinGoal: Double? // grams
    var carbGoal: Double? // grams
    var fatGoal: Double? // grams
    
    // Preferences
    var dietaryRestrictions: Set<DietaryRestriction>
    var allergens: Set<Allergen>
    var measurementSystem: MeasurementSystem
    
    // Settings
    var enableVoiceLogging: Bool
    var enableSmartSuggestions: Bool
    var reminderTimes: [ReminderTime]
    
    // Stats
    let createdAt: Date
    var updatedAt: Date
    var lastActiveAt: Date
    
    init(
        id: UUID = UUID(),
        name: String,
        email: String? = nil,
        age: Int? = nil,
        gender: Gender? = nil,
        height: Double? = nil,
        weight: Double? = nil,
        activityLevel: ActivityLevel = .moderate,
        dailyCalorieGoal: Int? = nil,
        proteinGoal: Double? = nil,
        carbGoal: Double? = nil,
        fatGoal: Double? = nil,
        dietaryRestrictions: Set<DietaryRestriction> = [],
        allergens: Set<Allergen> = [],
        measurementSystem: MeasurementSystem = .metric,
        enableVoiceLogging: Bool = true,
        enableSmartSuggestions: Bool = true,
        reminderTimes: [ReminderTime] = [],
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        lastActiveAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.age = age
        self.gender = gender
        self.height = height
        self.weight = weight
        self.activityLevel = activityLevel
        self.dailyCalorieGoal = dailyCalorieGoal
        self.proteinGoal = proteinGoal
        self.carbGoal = carbGoal
        self.fatGoal = fatGoal
        self.dietaryRestrictions = dietaryRestrictions
        self.allergens = allergens
        self.measurementSystem = measurementSystem
        self.enableVoiceLogging = enableVoiceLogging
        self.enableSmartSuggestions = enableSmartSuggestions
        self.reminderTimes = reminderTimes
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.lastActiveAt = lastActiveAt
    }
    
    // BMI calculation
    var bmi: Double? {
        guard let height = height, let weight = weight, height > 0 else { return nil }
        let heightInMeters = height / 100
        return weight / (heightInMeters * heightInMeters)
    }
    
    // BMR calculation (Mifflin-St Jeor Equation)
    var bmr: Double? {
        guard let weight = weight, let height = height, let age = age else { return nil }
        
        let baseBMR: Double
        switch gender {
        case .male:
            baseBMR = (10 * weight) + (6.25 * height) - (5 * Double(age)) + 5
        case .female:
            baseBMR = (10 * weight) + (6.25 * height) - (5 * Double(age)) - 161
        case .other, .none:
            // Use average of male and female
            let maleBMR = (10 * weight) + (6.25 * height) - (5 * Double(age)) + 5
            let femaleBMR = (10 * weight) + (6.25 * height) - (5 * Double(age)) - 161
            baseBMR = (maleBMR + femaleBMR) / 2
        }
        
        return baseBMR
    }
    
    // TDEE calculation
    var tdee: Double? {
        guard let bmr = bmr else { return nil }
        return bmr * activityLevel.multiplier
    }
    
    // Suggested calorie goal if not set
    var suggestedCalorieGoal: Int? {
        guard let tdee = tdee else { return nil }
        return Int(tdee.rounded())
    }
}

// MARK: - Supporting Types
enum Gender: String, Codable, CaseIterable {
    case male = "Male"
    case female = "Female"
    case other = "Other"
}

enum ActivityLevel: String, Codable, CaseIterable {
    case sedentary = "Sedentary"
    case light = "Lightly Active"
    case moderate = "Moderately Active"
    case active = "Active"
    case veryActive = "Very Active"
    
    var multiplier: Double {
        switch self {
        case .sedentary: return 1.2
        case .light: return 1.375
        case .moderate: return 1.55
        case .active: return 1.725
        case .veryActive: return 1.9
        }
    }
    
    var description: String {
        switch self {
        case .sedentary: return "Little to no exercise"
        case .light: return "Exercise 1-3 days/week"
        case .moderate: return "Exercise 3-5 days/week"
        case .active: return "Exercise 6-7 days/week"
        case .veryActive: return "Physical job or 2x/day training"
        }
    }
}

enum DietaryRestriction: String, Codable, CaseIterable {
    case vegetarian = "Vegetarian"
    case vegan = "Vegan"
    case pescatarian = "Pescatarian"
    case keto = "Keto"
    case paleo = "Paleo"
    case glutenFree = "Gluten-Free"
    case dairyFree = "Dairy-Free"
    case halal = "Halal"
    case kosher = "Kosher"
    case lowCarb = "Low Carb"
    case lowFat = "Low Fat"
    case lowSodium = "Low Sodium"
}

enum Allergen: String, Codable, CaseIterable {
    case milk = "Milk"
    case eggs = "Eggs"
    case fish = "Fish"
    case shellfish = "Shellfish"
    case treeNuts = "Tree Nuts"
    case peanuts = "Peanuts"
    case wheat = "Wheat"
    case soy = "Soy"
    case sesame = "Sesame"
}

enum MeasurementSystem: String, Codable {
    case metric = "Metric"
    case imperial = "Imperial"
}

struct ReminderTime: Codable {
    let id: UUID
    let time: Date
    let mealType: MealType
    let enabled: Bool
    
    init(id: UUID = UUID(), time: Date, mealType: MealType, enabled: Bool = true) {
        self.id = id
        self.time = time
        self.mealType = mealType
        self.enabled = enabled
    }
}

// MARK: - Sample Data
extension User {
    static let sampleUser = User(
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        gender: .male,
        height: 180,
        weight: 80,
        activityLevel: .moderate,
        dailyCalorieGoal: 2400
    )
}