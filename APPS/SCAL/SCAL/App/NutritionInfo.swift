import Foundation

struct NutritionInfo: Codable, Equatable {
    // Macronutrients (in grams)
    let calories: Double
    let protein: Double
    let carbohydrates: Double
    let fat: Double
    let fiber: Double?
    let sugar: Double?
    let saturatedFat: Double?
    let transFat: Double?
    
    // Micronutrients (optional)
    let sodium: Double? // mg
    let cholesterol: Double? // mg
    let vitaminA: Double? // mcg
    let vitaminC: Double? // mg
    let calcium: Double? // mg
    let iron: Double? // mg
    
    // Calculated properties
    var totalCalories: Int {
        Int(calories.rounded())
    }
    
    var macroBreakdown: (proteinPercent: Double, carbPercent: Double, fatPercent: Double) {
        let totalMacroCalories = (protein * 4) + (carbohydrates * 4) + (fat * 9)
        guard totalMacroCalories > 0 else { return (0, 0, 0) }
        
        let proteinPercent = (protein * 4) / totalMacroCalories * 100
        let carbPercent = (carbohydrates * 4) / totalMacroCalories * 100
        let fatPercent = (fat * 9) / totalMacroCalories * 100
        
        return (proteinPercent, carbPercent, fatPercent)
    }
    
    // Initialize with required macros only
    init(calories: Double, protein: Double, carbohydrates: Double, fat: Double) {
        self.calories = calories
        self.protein = protein
        self.carbohydrates = carbohydrates
        self.fat = fat
        self.fiber = nil
        self.sugar = nil
        self.saturatedFat = nil
        self.transFat = nil
        self.sodium = nil
        self.cholesterol = nil
        self.vitaminA = nil
        self.vitaminC = nil
        self.calcium = nil
        self.iron = nil
    }
    
    // Full initializer
    init(
        calories: Double,
        protein: Double,
        carbohydrates: Double,
        fat: Double,
        fiber: Double? = nil,
        sugar: Double? = nil,
        saturatedFat: Double? = nil,
        transFat: Double? = nil,
        sodium: Double? = nil,
        cholesterol: Double? = nil,
        vitaminA: Double? = nil,
        vitaminC: Double? = nil,
        calcium: Double? = nil,
        iron: Double? = nil
    ) {
        self.calories = calories
        self.protein = protein
        self.carbohydrates = carbohydrates
        self.fat = fat
        self.fiber = fiber
        self.sugar = sugar
        self.saturatedFat = saturatedFat
        self.transFat = transFat
        self.sodium = sodium
        self.cholesterol = cholesterol
        self.vitaminA = vitaminA
        self.vitaminC = vitaminC
        self.calcium = calcium
        self.iron = iron
    }
    
    // Multiply nutrition by serving size
    func scaled(by factor: Double) -> NutritionInfo {
        NutritionInfo(
            calories: calories * factor,
            protein: protein * factor,
            carbohydrates: carbohydrates * factor,
            fat: fat * factor,
            fiber: fiber.map { $0 * factor },
            sugar: sugar.map { $0 * factor },
            saturatedFat: saturatedFat.map { $0 * factor },
            transFat: transFat.map { $0 * factor },
            sodium: sodium.map { $0 * factor },
            cholesterol: cholesterol.map { $0 * factor },
            vitaminA: vitaminA.map { $0 * factor },
            vitaminC: vitaminC.map { $0 * factor },
            calcium: calcium.map { $0 * factor },
            iron: iron.map { $0 * factor }
        )
    }
}

// MARK: - Sample Data
extension NutritionInfo {
    static let empty = NutritionInfo(calories: 0, protein: 0, carbohydrates: 0, fat: 0)
    
    static let sampleApple = NutritionInfo(
        calories: 95,
        protein: 0.5,
        carbohydrates: 25,
        fat: 0.3,
        fiber: 4.4,
        sugar: 19
    )
}