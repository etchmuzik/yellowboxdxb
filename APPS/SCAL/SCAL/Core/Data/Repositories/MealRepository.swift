import Foundation
import CoreData
import Combine

@MainActor
final class MealRepository: ObservableObject {
    struct MealEvent {
        let mealId: UUID
        let mealType: MealType
        let foods: [Food]
        let totalCalories: Double
        let consumedAt: Date
    }
    
    static let shared = MealRepository()
    
    private let context: NSManagedObjectContext
    private let eventsSubject = PassthroughSubject<MealEvent, Never>()
    var mealEvents: AnyPublisher<MealEvent, Never> {
        eventsSubject.eraseToAnyPublisher()
    }
    
    private init(context: NSManagedObjectContext = CoreDataStack.shared.viewContext) {
        self.context = context
    }
    
    @discardableResult
    func saveMeal(name: String, foods: [Food], mealType: MealType, consumedAt: Date = Date()) throws -> CDMeal {
        let meal = CDMeal(context: context)
        meal.id = UUID()
        meal.name = name
        meal.mealType = mealType.rawValue
        meal.consumedAt = consumedAt
        meal.createdAt = Date()
        meal.updatedAt = Date()
        
        let cdFoods = foods.map { food -> CDFood in
            let cdFood = CDFood(context: context)
            cdFood.id = food.id
            cdFood.name = food.name
            cdFood.brand = food.brand
            cdFood.calories = food.nutritionInfo.calories
            cdFood.protein = food.nutritionInfo.protein
            cdFood.carbohydrates = food.nutritionInfo.carbohydrates
            cdFood.fat = food.nutritionInfo.fat
            cdFood.fiber = food.nutritionInfo.fiber ?? 0
            cdFood.sugar = food.nutritionInfo.sugar ?? 0
            cdFood.sodium = food.nutritionInfo.sodium ?? 0
            cdFood.servingAmount = food.servingSize.amount
            cdFood.servingUnit = food.servingSize.unit.rawValue
            cdFood.recognitionConfidence = food.recognitionConfidence
            cdFood.dataSource = food.dataSource.rawValue
            cdFood.usdaFoodId = food.usdaFoodId
            cdFood.customServingSize = food.customServingSize
            cdFood.createdAt = Date()
            cdFood.updatedAt = Date()
            cdFood.meal = meal
            return cdFood
        }
        meal.foods = NSOrderedSet(array: cdFoods)
        try context.save()
        
        let totalCalories = foods.reduce(0) { $0 + $1.nutritionInfo.calories }
        eventsSubject.send(MealEvent(
            mealId: meal.id ?? UUID(),
            mealType: mealType,
            foods: foods,
            totalCalories: totalCalories,
            consumedAt: consumedAt
        ))
        
        return meal
    }
}
