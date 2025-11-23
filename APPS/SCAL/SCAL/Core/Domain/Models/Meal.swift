import Foundation

struct Meal: Identifiable, Codable {
    let id: UUID
    var name: String
    var foods: [Food]
    let mealType: MealType
    let consumedAt: Date
    var notes: String?
    
    // Location data (optional)
    var locationName: String?
    var latitude: Double?
    var longitude: Double?
    
    // Tracking
    let createdAt: Date
    var updatedAt: Date
    
    init(
        id: UUID = UUID(),
        name: String? = nil,
        foods: [Food] = [],
        mealType: MealType,
        consumedAt: Date = Date(),
        notes: String? = nil,
        locationName: String? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name ?? mealType.defaultName
        self.foods = foods
        self.mealType = mealType
        self.consumedAt = consumedAt
        self.notes = notes
        self.locationName = locationName
        self.latitude = latitude
        self.longitude = longitude
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // Computed nutrition for entire meal
    var totalNutrition: NutritionInfo {
        guard !foods.isEmpty else { return .empty }
        
        let totalCalories = foods.map { $0.adjustedNutrition.calories }.reduce(0, +)
        let totalProtein = foods.map { $0.adjustedNutrition.protein }.reduce(0, +)
        let totalCarbs = foods.map { $0.adjustedNutrition.carbohydrates }.reduce(0, +)
        let totalFat = foods.map { $0.adjustedNutrition.fat }.reduce(0, +)
        
        // Optional nutrients
        let totalFiber = foods.compactMap { $0.adjustedNutrition.fiber }.reduce(0, +)
        let totalSugar = foods.compactMap { $0.adjustedNutrition.sugar }.reduce(0, +)
        let totalSodium = foods.compactMap { $0.adjustedNutrition.sodium }.reduce(0, +)
        
        return NutritionInfo(
            calories: totalCalories,
            protein: totalProtein,
            carbohydrates: totalCarbs,
            fat: totalFat,
            fiber: totalFiber > 0 ? totalFiber : nil,
            sugar: totalSugar > 0 ? totalSugar : nil,
            sodium: totalSodium > 0 ? totalSodium : nil
        )
    }
    
    // Helper to add food
    mutating func addFood(_ food: Food) {
        foods.append(food)
        updatedAt = Date()
    }
    
    // Helper to remove food
    mutating func removeFood(at index: Int) {
        guard foods.indices.contains(index) else { return }
        foods.remove(at: index)
        updatedAt = Date()
    }
    
    // Time-based helpers
    var timeOfDay: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: consumedAt)
    }
    
    var isToday: Bool {
        Calendar.current.isDateInToday(consumedAt)
    }
}

// MARK: - Meal Type
enum MealType: String, Codable, CaseIterable {
    case breakfast = "Breakfast"
    case lunch = "Lunch"
    case dinner = "Dinner"
    case snack = "Snack"
    case other = "Other"
    
    var defaultName: String {
        rawValue
    }
    
    var icon: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.fill"
        case .snack: return "cup.and.saucer.fill"
        case .other: return "fork.knife"
        }
    }
    
    // Typical time ranges for smart suggestions
    var typicalTimeRange: ClosedRange<Int> {
        switch self {
        case .breakfast: return 5...10
        case .lunch: return 11...14
        case .dinner: return 17...21
        case .snack: return 0...23
        case .other: return 0...23
        }
    }
    
    static func suggestedType(for date: Date = Date()) -> MealType {
        let hour = Calendar.current.component(.hour, from: date)
        
        if (5...10).contains(hour) {
            return .breakfast
        } else if (11...14).contains(hour) {
            return .lunch
        } else if (17...21).contains(hour) {
            return .dinner
        } else {
            return .snack
        }
    }
}

// MARK: - Sample Data
extension Meal {
    static let sampleBreakfast = Meal(
        name: "Healthy Breakfast",
        foods: [.sampleApple],
        mealType: .breakfast,
        consumedAt: Date()
    )
}