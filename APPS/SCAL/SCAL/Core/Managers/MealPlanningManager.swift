//
//  MealPlanningManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  AI-powered meal planning and recommendation system
//

import SwiftUI
import Foundation

// MARK: - Meal Planning Models

struct MealPlan: Identifiable, Codable {
    let id = UUID()
    let name: String
    let description: String
    let duration: Int // days
    let targetCalories: Int
    let targetProtein: Double
    let targetCarbs: Double
    let targetFat: Double
    let meals: [PlannedMeal]
    let tags: [String]
    let difficulty: PlanDifficulty
    let cuisineType: CuisineType
    let createdDate: Date
    
    var dailyMeals: [[PlannedMeal]] {
        meals.chunked(into: meals.count / duration)
    }
    
    var averagePreparationTime: Int {
        meals.isEmpty ? 0 : meals.reduce(0) { $0 + $1.preparationTime } / meals.count
    }
}

struct PlannedMeal: Identifiable, Codable {
    let id = UUID()
    let name: String
    let description: String
    let mealType: MealType
    let calories: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let ingredients: [String]
    let instructions: [String]
    let preparationTime: Int // minutes
    let servings: Int
    let imageURL: String?
    let tags: [String]
    let allergens: [Allergen]
    
    var nutritionScore: Double {
        // Calculate based on macro balance and ingredient quality
        let proteinRatio = min(protein / 25.0, 1.0) // Target ~25g per meal
        let balanceScore = 1.0 - abs(0.5 - (carbs / (carbs + fat + protein))) // Favor balanced macros
        return (proteinRatio + balanceScore) / 2.0 * 100
    }
}

enum MealType: String, CaseIterable, Codable {
    case breakfast = "Breakfast"
    case lunch = "Lunch"
    case dinner = "Dinner"
    case snack = "Snack"
    
    var icon: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.fill"
        case .snack: return "leaf.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .breakfast: return .orange
        case .lunch: return .yellow
        case .dinner: return .purple
        case .snack: return .green
        }
    }
}

enum PlanDifficulty: String, CaseIterable, Codable {
    case beginner = "Beginner"
    case intermediate = "Intermediate"
    case advanced = "Advanced"
    
    var description: String {
        switch self {
        case .beginner: return "Simple recipes with basic ingredients"
        case .intermediate: return "Moderate complexity with some prep work"
        case .advanced: return "Complex recipes requiring cooking skills"
        }
    }
    
    var maxPrepTime: Int {
        switch self {
        case .beginner: return 30
        case .intermediate: return 60
        case .advanced: return 120
        }
    }
}

enum CuisineType: String, CaseIterable, Codable {
    case mediterranean = "Mediterranean"
    case middleEastern = "Middle Eastern"
    case asian = "Asian"
    case american = "American"
    case mexican = "Mexican"
    case indian = "Indian"
    case mixed = "Mixed"
    
    var flag: String {
        switch self {
        case .mediterranean: return "🇒🇺"
        case .middleEastern: return "🇦🇪"
        case .asian: return "🇯🇵"
        case .american: return "🇺🇸"
        case .mexican: return "🇲🇽"
        case .indian: return "🇮🇳"
        case .mixed: return "🌍"
        }
    }
}

enum Allergen: String, CaseIterable, Codable {
    case dairy = "Dairy"
    case nuts = "Nuts"
    case gluten = "Gluten"
    case shellfish = "Shellfish"
    case eggs = "Eggs"
    case soy = "Soy"
    
    var icon: String {
        switch self {
        case .dairy: return "🦬"
        case .nuts: return "🥜"
        case .gluten: return "🌾"
        case .shellfish: return "🦐"
        case .eggs: return "🥚"
        case .soy: return "🌱"
        }
    }
}

struct MealPlanPreferences: Codable {
    var targetCalories: Int = 2000
    var targetProtein: Double = 150
    var targetCarbs: Double = 250
    var targetFat: Double = 65
    var preferredCuisines: [CuisineType] = [.middleEastern, .mediterranean]
    var allergens: [Allergen] = []
    var maxPrepTime: Int = 60
    var mealsPerDay: Int = 3
    var preferredDifficulty: PlanDifficulty = .intermediate
    var includeSnacks: Bool = true
    var vegetarian: Bool = false
    var localFoodPreference: Bool = true
}

// MARK: - Meal Planning Manager

@MainActor
class MealPlanningManager: ObservableObject {
    static let shared = MealPlanningManager()
    
    @Published var availablePlans: [MealPlan] = []
    @Published var currentPlan: MealPlan?
    @Published var preferences = MealPlanPreferences()
    @Published var isGenerating = false
    @Published var recommendations: [PlannedMeal] = []
    
    // Recipe database
    private var recipeDatabase: [PlannedMeal] = []
    
    private let userDefaults = UserDefaults.standard
    private let plansKey = "mealPlans"
    private let currentPlanKey = "currentMealPlan"
    private let preferencesKey = "mealPlanPreferences"
    
    init() {
        loadData()
        generateRecipeDatabase()
        generateSamplePlans()
    }
    
    // MARK: - Plan Generation
    
    func generateMealPlan(
        duration: Int = 7,
        preferences: MealPlanPreferences? = nil
    ) async {
        isGenerating = true
        
        let prefs = preferences ?? self.preferences
        
        // Simulate AI processing time
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
        
        let plan = await createOptimizedPlan(duration: duration, preferences: prefs)
        
        await MainActor.run {
            self.availablePlans.append(plan)
            self.currentPlan = plan
            self.isGenerating = false
            self.saveData()
        }
    }
    
    private func createOptimizedPlan(
        duration: Int,
        preferences: MealPlanPreferences
    ) async -> MealPlan {
        var plannedMeals: [PlannedMeal] = []
        
        for day in 0..<duration {
            // Generate meals for each day based on preferences
            let dailyMeals = generateDailyMeals(preferences: preferences)
            plannedMeals.append(contentsOf: dailyMeals)
        }
        
        let totalCalories = plannedMeals.reduce(0) { $0 + $1.calories }
        let avgCalories = totalCalories / duration
        
        let totalProtein = plannedMeals.reduce(0) { $0 + $1.protein }
        let avgProtein = totalProtein / Double(duration)
        
        let totalCarbs = plannedMeals.reduce(0) { $0 + $1.carbs }
        let avgCarbs = totalCarbs / Double(duration)
        
        let totalFat = plannedMeals.reduce(0) { $0 + $1.fat }
        let avgFat = totalFat / Double(duration)
        
        return MealPlan(
            name: "AI Generated Plan - \(duration) Days",
            description: "Personalized meal plan optimized for your goals and preferences",
            duration: duration,
            targetCalories: avgCalories,
            targetProtein: avgProtein,
            targetCarbs: avgCarbs,
            targetFat: avgFat,
            meals: plannedMeals,
            tags: generatePlanTags(preferences: preferences),
            difficulty: preferences.preferredDifficulty,
            cuisineType: preferences.preferredCuisines.first ?? .mixed,
            createdDate: Date()
        )
    }
    
    private func generateDailyMeals(preferences: MealPlanPreferences) -> [PlannedMeal] {
        var meals: [PlannedMeal] = []
        
        // Distribute calories across meals
        let caloriesPerMeal = preferences.targetCalories / preferences.mealsPerDay
        let proteinPerMeal = preferences.targetProtein / Double(preferences.mealsPerDay)
        let carbsPerMeal = preferences.targetCarbs / Double(preferences.mealsPerDay)
        let fatPerMeal = preferences.targetFat / Double(preferences.mealsPerDay)
        
        // Generate meals for each meal type
        let mealTypes: [MealType] = preferences.mealsPerDay == 3 ? 
            [.breakfast, .lunch, .dinner] : 
            [.breakfast, .lunch, .dinner, .snack]
        
        for mealType in mealTypes {
            if let meal = findOptimalMeal(
                type: mealType,
                targetCalories: caloriesPerMeal,
                targetProtein: proteinPerMeal,
                targetCarbs: carbsPerMeal,
                targetFat: fatPerMeal,
                preferences: preferences
            ) {
                meals.append(meal)
            }
        }
        
        return meals
    }
    
    private func findOptimalMeal(
        type: MealType,
        targetCalories: Int,
        targetProtein: Double,
        targetCarbs: Double,
        targetFat: Double,
        preferences: MealPlanPreferences
    ) -> PlannedMeal? {
        let suitableMeals = recipeDatabase.filter { meal in
            meal.mealType == type &&
            meal.preparationTime <= preferences.maxPrepTime &&
            !meal.allergens.contains { preferences.allergens.contains($0) } &&
            (preferences.vegetarian ? !meal.tags.contains("meat") : true)
        }
        
        // Score meals based on how close they are to targets
        let scoredMeals = suitableMeals.map { meal in
            let calorieScore = 1.0 - abs(Double(meal.calories - targetCalories)) / Double(targetCalories)
            let proteinScore = 1.0 - abs(meal.protein - targetProtein) / targetProtein
            let carbsScore = 1.0 - abs(meal.carbs - targetCarbs) / targetCarbs
            let fatScore = 1.0 - abs(meal.fat - targetFat) / targetFat
            
            let totalScore = (calorieScore + proteinScore + carbsScore + fatScore) / 4.0
            
            return (meal, totalScore)
        }
        
        return scoredMeals.max { $0.1 < $1.1 }?.0
    }
    
    private func generatePlanTags(preferences: MealPlanPreferences) -> [String] {
        var tags: [String] = []
        
        if preferences.vegetarian {
            tags.append("Vegetarian")
        }
        
        if preferences.localFoodPreference {
            tags.append("Local Cuisine")
        }
        
        if preferences.maxPrepTime <= 30 {
            tags.append("Quick Meals")
        }
        
        tags.append("AI Generated")
        tags.append("Personalized")
        
        return tags
    }
    
    // MARK: - Recommendations
    
    func generateRecommendations(for mealType: MealType) {
        let suitable = recipeDatabase.filter { meal in
            meal.mealType == mealType &&
            meal.preparationTime <= preferences.maxPrepTime &&
            !meal.allergens.contains { preferences.allergens.contains($0) }
        }
        
        recommendations = Array(suitable.shuffled().prefix(5))
    }
    
    func getMealSuggestion(basedOn history: [SimpleMeal]) -> PlannedMeal? {
        // Analyze user's meal history and suggest similar meals
        let commonIngredients = extractCommonIngredients(from: history)
        
        let similarMeals = recipeDatabase.filter { meal in
            meal.ingredients.contains { ingredient in
                commonIngredients.contains { $0.lowercased().contains(ingredient.lowercased()) }
            }
        }
        
        return similarMeals.randomElement()
    }
    
    private func extractCommonIngredients(from history: [SimpleMeal]) -> [String] {
        // Extract common food words from meal names
        let foodWords = history.flatMap { meal in
            meal.name.lowercased().components(separatedBy: .whitespacesAndNewlines)
        }
        
        let commonWords = ["chicken", "rice", "bread", "cheese", "egg", "beef", "fish", "vegetable"]
        
        return foodWords.filter { word in
            commonWords.contains { $0.contains(word) || word.contains($0) }
        }
    }
    
    // MARK: - Plan Management
    
    func selectPlan(_ plan: MealPlan) {
        currentPlan = plan
        saveData()
    }
    
    func deletePlan(_ plan: MealPlan) {
        availablePlans.removeAll { $0.id == plan.id }
        if currentPlan?.id == plan.id {
            currentPlan = nil
        }
        saveData()
    }
    
    func updatePreferences(_ newPreferences: MealPlanPreferences) {
        preferences = newPreferences
        saveData()
    }
    
    // MARK: - Data Persistence
    
    private func saveData() {
        // Save plans
        if let encoded = try? JSONEncoder().encode(availablePlans) {
            userDefaults.set(encoded, forKey: plansKey)
        }
        
        // Save current plan
        if let currentPlan = currentPlan,
           let encoded = try? JSONEncoder().encode(currentPlan) {
            userDefaults.set(encoded, forKey: currentPlanKey)
        }
        
        // Save preferences
        if let encoded = try? JSONEncoder().encode(preferences) {
            userDefaults.set(encoded, forKey: preferencesKey)
        }
    }
    
    private func loadData() {
        // Load plans
        if let data = userDefaults.data(forKey: plansKey),
           let decoded = try? JSONDecoder().decode([MealPlan].self, from: data) {
            availablePlans = decoded
        }
        
        // Load current plan
        if let data = userDefaults.data(forKey: currentPlanKey),
           let decoded = try? JSONDecoder().decode(MealPlan.self, from: data) {
            currentPlan = decoded
        }
        
        // Load preferences
        if let data = userDefaults.data(forKey: preferencesKey),
           let decoded = try? JSONDecoder().decode(MealPlanPreferences.self, from: data) {
            preferences = decoded
        }
    }
    
    // MARK: - Recipe Database
    
    private func generateRecipeDatabase() {
        recipeDatabase = [
            // Breakfast options
            PlannedMeal(
                name: "Foul Medames with Pita",
                description: "Traditional Egyptian breakfast with fava beans",
                mealType: .breakfast,
                calories: 340,
                protein: 18,
                carbs: 48,
                fat: 8,
                ingredients: ["Fava beans", "Olive oil", "Garlic", "Lemon", "Pita bread"],
                instructions: ["Soak beans overnight", "Cook with garlic", "Season with lemon and olive oil"],
                preparationTime: 20,
                servings: 1,
                imageURL: nil,
                tags: ["Middle Eastern", "High Protein", "Vegetarian"],
                allergens: [.gluten]
            ),
            
            PlannedMeal(
                name: "Shakshuka",
                description: "Eggs poached in spiced tomato sauce",
                mealType: .breakfast,
                calories: 285,
                protein: 15,
                carbs: 12,
                fat: 18,
                ingredients: ["Eggs", "Tomatoes", "Bell peppers", "Onion", "Spices"],
                instructions: ["Sauté vegetables", "Add tomatoes and spices", "Crack eggs into sauce"],
                preparationTime: 25,
                servings: 1,
                imageURL: nil,
                tags: ["Middle Eastern", "High Protein"],
                allergens: [.eggs]
            ),
            
            // Lunch options
            PlannedMeal(
                name: "Chicken Shawarma Bowl",
                description: "Grilled chicken with rice and vegetables",
                mealType: .lunch,
                calories: 520,
                protein: 38,
                carbs: 45,
                fat: 18,
                ingredients: ["Chicken breast", "Basmati rice", "Cucumber", "Tomatoes", "Tahini"],
                instructions: ["Marinate and grill chicken", "Cook rice", "Prepare vegetables", "Assemble bowl"],
                preparationTime: 35,
                servings: 1,
                imageURL: nil,
                tags: ["Middle Eastern", "High Protein", "meat"],
                allergens: []
            ),
            
            PlannedMeal(
                name: "Hummus and Vegetable Wrap",
                description: "Fresh vegetables with creamy hummus in a whole wheat wrap",
                mealType: .lunch,
                calories: 380,
                protein: 16,
                carbs: 52,
                fat: 12,
                ingredients: ["Whole wheat tortilla", "Hummus", "Cucumber", "Tomatoes", "Lettuce", "Red onion"],
                instructions: ["Spread hummus on tortilla", "Add fresh vegetables", "Roll tightly"],
                preparationTime: 10,
                servings: 1,
                imageURL: nil,
                tags: ["Vegetarian", "Quick", "Mediterranean"],
                allergens: [.gluten]
            ),
            
            // Dinner options
            PlannedMeal(
                name: "Grilled Salmon with Quinoa",
                description: "Omega-3 rich salmon with protein-packed quinoa",
                mealType: .dinner,
                calories: 485,
                protein: 35,
                carbs: 32,
                fat: 22,
                ingredients: ["Salmon fillet", "Quinoa", "Broccoli", "Lemon", "Olive oil"],
                instructions: ["Season and grill salmon", "Cook quinoa", "Steam broccoli", "Serve with lemon"],
                preparationTime: 30,
                servings: 1,
                imageURL: nil,
                tags: ["High Protein", "Omega-3", "Gluten-Free"],
                allergens: []
            ),
            
            PlannedMeal(
                name: "Lamb Machboos",
                description: "Traditional Gulf rice dish with spiced lamb",
                mealType: .dinner,
                calories: 620,
                protein: 32,
                carbs: 68,
                fat: 20,
                ingredients: ["Lamb", "Basmati rice", "Onions", "Tomatoes", "Baharat spice"],
                instructions: ["Brown lamb", "Sauté onions", "Add rice and spices", "Simmer until tender"],
                preparationTime: 75,
                servings: 1,
                imageURL: nil,
                tags: ["Middle Eastern", "Traditional", "meat"],
                allergens: []
            ),
            
            // Snack options
            PlannedMeal(
                name: "Dates and Nuts",
                description: "Traditional Middle Eastern energy snack",
                mealType: .snack,
                calories: 180,
                protein: 4,
                carbs: 28,
                fat: 8,
                ingredients: ["Medjool dates", "Almonds", "Walnuts"],
                instructions: ["Remove pits from dates", "Combine with nuts"],
                preparationTime: 5,
                servings: 1,
                imageURL: nil,
                tags: ["Quick", "Natural", "Traditional"],
                allergens: [.nuts]
            )
        ]
    }
    
    private func generateSamplePlans() {
        // Only generate if no plans exist
        guard availablePlans.isEmpty else { return }
        
        let samplePlan = MealPlan(
            name: "Middle Eastern Favorites - 7 Days",
            description: "A week of traditional Middle Eastern cuisine optimized for balanced nutrition",
            duration: 7,
            targetCalories: 1950,
            targetProtein: 125,
            targetCarbs: 240,
            targetFat: 72,
            meals: Array(recipeDatabase.prefix(21)), // 3 meals per day for 7 days
            tags: ["Middle Eastern", "Balanced", "Traditional"],
            difficulty: .intermediate,
            cuisineType: .middleEastern,
            createdDate: Date()
        )
        
        availablePlans.append(samplePlan)
        saveData()
    }
}

// MARK: - Array Extension

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}