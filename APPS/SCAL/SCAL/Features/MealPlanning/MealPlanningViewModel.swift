//
//  MealPlanningViewModel.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Meal planning view model for AI-powered meal recommendations
//

import SwiftUI
import Combine

@MainActor
class MealPlanningViewModel: ObservableObject {
    @Published var selectedTab: PlanningTab = .overview
    @Published var showingPlanGenerator = false
    @Published var showingPreferences = false
    @Published var showingMealDetail = false
    @Published var selectedMeal: PlannedMeal?
    @Published var generationProgress: Double = 0
    
    // Plan generation
    @Published var planDuration = 7
    @Published var planName = ""
    @Published var customCalories = 2000
    @Published var customProtein = 150.0
    @Published var customCarbs = 250.0
    @Published var customFat = 65.0
    
    // Filters and options
    @Published var selectedCuisines: Set<CuisineType> = [.middleEastern]
    @Published var selectedDifficulty: PlanDifficulty = .intermediate
    @Published var maxPrepTime = 60
    @Published var includeSnacks = true
    @Published var vegetarianOnly = false
    
    // Dependencies
    private let mealPlanning = MealPlanningManager.shared
    private let userProfile: UserProfileManager
    private var cancellables = Set<AnyCancellable>()
    
    init(userProfileManager: UserProfileManager) {
        self.userProfile = userProfileManager
        setupBindings()
        loadUserPreferences()
    }
    
    private func setupBindings() {
        mealPlanning.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.objectWillChange.send()
            }
            .store(in: &cancellables)
    }
    
    private func loadUserPreferences() {
        customCalories = userProfile.calorieGoal
        customProtein = userProfile.proteinGoal
        customCarbs = userProfile.carbsGoal
        customFat = userProfile.fatGoal
    }
    
    // MARK: - Plan Generation
    
    func generateNewPlan() {
        showingPlanGenerator = true
    }
    
    func startPlanGeneration() {
        let preferences = MealPlanPreferences(
            targetCalories: customCalories,
            targetProtein: customProtein,
            targetCarbs: customCarbs,
            targetFat: customFat,
            preferredCuisines: Array(selectedCuisines),
            allergens: [], // Could be expanded
            maxPrepTime: maxPrepTime,
            mealsPerDay: includeSnacks ? 4 : 3,
            preferredDifficulty: selectedDifficulty,
            includeSnacks: includeSnacks,
            vegetarian: vegetarianOnly,
            localFoodPreference: userProfile.preferLocalFood
        )
        
        mealPlanning.updatePreferences(preferences)
        
        Task {
            // Simulate progress updates
            await updateGenerationProgress()
            
            await mealPlanning.generateMealPlan(
                duration: planDuration,
                preferences: preferences
            )
            
            await MainActor.run {
                self.showingPlanGenerator = false
                self.generationProgress = 0
            }
        }
    }
    
    private func updateGenerationProgress() async {
        let steps = ["Analyzing preferences", "Finding optimal recipes", "Balancing nutrition", "Finalizing plan"]
        
        for (index, _) in steps.enumerated() {
            await MainActor.run {
                self.generationProgress = Double(index + 1) / Double(steps.count)
            }
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        }
    }
    
    // MARK: - Plan Management
    
    func selectPlan(_ plan: MealPlan) {
        mealPlanning.selectPlan(plan)
    }
    
    func deletePlan(_ plan: MealPlan) {
        mealPlanning.deletePlan(plan)
    }
    
    func duplicatePlan(_ plan: MealPlan) {
        let duplicatedPlan = MealPlan(
            name: "\(plan.name) (Copy)",
            description: plan.description,
            duration: plan.duration,
            targetCalories: plan.targetCalories,
            targetProtein: plan.targetProtein,
            targetCarbs: plan.targetCarbs,
            targetFat: plan.targetFat,
            meals: plan.meals,
            tags: plan.tags + ["Copy"],
            difficulty: plan.difficulty,
            cuisineType: plan.cuisineType,
            createdDate: Date()
        )
        
        // Add to available plans (would need to modify MealPlanningManager)
        // For now, just select the original plan
        selectPlan(plan)
    }
    
    // MARK: - Meal Actions
    
    func showMealDetail(_ meal: PlannedMeal) {
        selectedMeal = meal
        showingMealDetail = true
    }
    
    func addMealToToday(_ meal: PlannedMeal) {
        // Convert PlannedMeal to SimpleMeal and add to today's meals
        let simpleMeal = SimpleMeal(
            name: meal.name,
            calories: meal.calories,
            time: Date().formatted(date: .omitted, time: .shortened),
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat
        )
        
        // This would need to be connected to MealDataManager
        // For now, just show feedback
        print("Added \(meal.name) to today's meals")
    }
    
    func generateRecommendations(for mealType: MealType) {
        mealPlanning.generateRecommendations(for: mealType)
    }
    
    // MARK: - Navigation
    
    func selectTab(_ tab: PlanningTab) {
        selectedTab = tab
    }
    
    func showPreferences() {
        showingPreferences = true
    }
    
    // MARK: - Statistics and Insights
    
    func getPlanStatistics() -> PlanStatistics {
        guard let currentPlan = mealPlanning.currentPlan else {
            return PlanStatistics(
                totalMeals: 0,
                averageCalories: 0,
                averagePrepTime: 0,
                cuisineDistribution: [:],
                nutritionBalance: NutritionBalance(protein: 0, carbs: 0, fat: 0)
            )
        }
        
        let cuisineDistribution = Dictionary(grouping: currentPlan.meals) { $0.tags.first ?? "Other" }
            .mapValues { $0.count }
        
        let totalCalories = currentPlan.meals.reduce(0) { $0 + $1.calories }
        let totalProtein = currentPlan.meals.reduce(0) { $0 + $1.protein }
        let totalCarbs = currentPlan.meals.reduce(0) { $0 + $1.carbs }
        let totalFat = currentPlan.meals.reduce(0) { $0 + $1.fat }
        
        let proteinCalories = totalProtein * 4
        let carbsCalories = totalCarbs * 4
        let fatCalories = totalFat * 9
        let totalMacroCalories = proteinCalories + carbsCalories + fatCalories
        
        return PlanStatistics(
            totalMeals: currentPlan.meals.count,
            averageCalories: totalCalories / currentPlan.meals.count,
            averagePrepTime: currentPlan.averagePreparationTime,
            cuisineDistribution: cuisineDistribution,
            nutritionBalance: NutritionBalance(
                protein: totalMacroCalories > 0 ? proteinCalories / totalMacroCalories : 0,
                carbs: totalMacroCalories > 0 ? carbsCalories / totalMacroCalories : 0,
                fat: totalMacroCalories > 0 ? fatCalories / totalMacroCalories : 0
            )
        )
    }
    
    func getTodaysPlannedMeals() -> [PlannedMeal] {
        guard let currentPlan = mealPlanning.currentPlan else { return [] }
        
        let calendar = Calendar.current
        let daysSinceStart = calendar.dateComponents([.day], 
                                                    from: currentPlan.createdDate, 
                                                    to: Date()).day ?? 0
        
        let dayIndex = daysSinceStart % currentPlan.duration
        let mealsPerDay = currentPlan.meals.count / currentPlan.duration
        
        let startIndex = dayIndex * mealsPerDay
        let endIndex = min(startIndex + mealsPerDay, currentPlan.meals.count)
        
        return Array(currentPlan.meals[startIndex..<endIndex])
    }
    
    // MARK: - Getters
    
    func getMealPlanningManager() -> MealPlanningManager {
        return mealPlanning
    }
    
    func getUserProfileManager() -> UserProfileManager {
        return userProfile
    }
}

// MARK: - Supporting Models

enum PlanningTab: String, CaseIterable {
    case overview = "Overview"
    case currentPlan = "Current Plan"
    case recommendations = "Recommendations"
    case library = "Library"
    
    var icon: String {
        switch self {
        case .overview: return "chart.pie.fill"
        case .currentPlan: return "calendar"
        case .recommendations: return "star.fill"
        case .library: return "books.vertical.fill"
        }
    }
}

struct PlanStatistics {
    let totalMeals: Int
    let averageCalories: Int
    let averagePrepTime: Int
    let cuisineDistribution: [String: Int]
    let nutritionBalance: NutritionBalance
}

struct NutritionBalance {
    let protein: Double // As percentage
    let carbs: Double   // As percentage
    let fat: Double     // As percentage
    
    var isBalanced: Bool {
        // Consider balanced if protein is 20-35%, carbs 45-65%, fat 20-35%
        return (0.20...0.35).contains(protein) &&
               (0.45...0.65).contains(carbs) &&
               (0.20...0.35).contains(fat)
    }
    
    var balanceScore: Double {
        let proteinScore = (0.20...0.35).contains(protein) ? 1.0 : 0.5
        let carbsScore = (0.45...0.65).contains(carbs) ? 1.0 : 0.5
        let fatScore = (0.20...0.35).contains(fat) ? 1.0 : 0.5
        
        return (proteinScore + carbsScore + fatScore) / 3.0
    }
}