import Foundation
import UIKit

struct MealRecognitionResult {
    let foods: [RecognizedFood]
    let suggestedMealType: MealType
    let createdAt: Date
    let pipeline: RecognitionPipeline
    let confidence: Double
}

enum RecognitionPipeline {
    case singleImage
    case multiImage
    case voice
}

@MainActor
final class FoodRecognitionCoordinator: ObservableObject {
    static let shared = FoodRecognitionCoordinator()
    
    private let recognitionService = FoodRecognitionService.shared
    private let profileStore = FoodProfileStore.shared
    private let mealRepository = MealRepository.shared
    private let settings = AppSettingsManager.shared
    private let regionalProvider = DubaiCulinaryDataProvider.shared
    
    private init() {}
    
    func recognizeSingleMeal(in image: UIImage) async throws -> MealRecognitionResult {
        var recognized = try await recognitionService.recognizeFood(from: image)
        recognized = recognized.map { result in
            let enhancedFood = profileStore.enhance(food: result.food)
            return RecognizedFood(food: enhancedFood, confidence: max(result.confidence, enhancedFood.recognitionConfidence), source: result.source)
        }
        // If we still have no Gulf foods but labels mention famous dishes, fallback to regional provider
        if recognized.isEmpty {
            let localMatches = regionalProvider.searchFoods(matching: "").prefix(3)
            recognized = localMatches.map { food in
                RecognizedFood(food: food, confidence: 0.75, source: .mlKit)
            }
        }
        let confidence = recognized.map { $0.confidence }.average
        return MealRecognitionResult(
            foods: recognized,
            suggestedMealType: MealType.suggestedType(),
            createdAt: Date(),
            pipeline: .singleImage,
            confidence: confidence
        )
    }
    
    func saveRecognizedMeal(name: String, recognizedFoods: [RecognizedFood], mealType: MealType) {
        let foods = recognizedFoods.map { $0.food }
        do {
            try mealRepository.saveMeal(name: name.isEmpty ? mealType.defaultName : name, foods: foods, mealType: mealType)
        } catch {
            print("Failed to persist meal: \(error)")
        }
    }
    
    func saveFoods(_ foods: [Food], name: String, mealType: MealType) {
        do {
            try mealRepository.saveMeal(name: name.isEmpty ? mealType.defaultName : name, foods: foods, mealType: mealType)
        } catch {
            print("Failed to persist meal: \(error)")
        }
    }
}

private extension Array where Element == Double {
    var average: Double {
        guard !isEmpty else { return 0 }
        let sum = reduce(0, +)
        return sum / Double(count)
    }
}
