//
//  SimpleFoodSearchService.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Food search service with USDA API and GCC food database
//

import Alamofire
import SwiftUI

// MARK: - GCC Food Database
struct GCCFoodDatabase {
    static let commonFoods: [SimpleFood] = [
        // Arabic Breakfast
        SimpleFood(name: "Foul Medames (فول مدمس)", brand: "Local", calories: 340, protein: 18, carbs: 48, fat: 8, fdcId: nil),
        SimpleFood(name: "Hummus (حمص)", brand: "Local", calories: 177, protein: 8, carbs: 20, fat: 8, fdcId: nil),
        SimpleFood(name: "Labneh (لبنة)", brand: "Local", calories: 85, protein: 5, carbs: 4, fat: 6, fdcId: nil),
        SimpleFood(name: "Zaatar Manakeesh (مناقيش زعتر)", brand: "Local", calories: 290, protein: 8, carbs: 45, fat: 10, fdcId: nil),
        SimpleFood(name: "Cheese Fatayer (فطاير جبنة)", brand: "Local", calories: 320, protein: 12, carbs: 38, fat: 14, fdcId: nil),
        SimpleFood(name: "Shakshuka (شكشوكة)", brand: "Local", calories: 185, protein: 13, carbs: 12, fat: 11, fdcId: nil),
        
        // Main Dishes
        SimpleFood(name: "Chicken Shawarma (شاورما دجاج)", brand: "Local", calories: 475, protein: 35, carbs: 40, fat: 20, fdcId: nil),
        SimpleFood(name: "Beef Shawarma (شاورما لحم)", brand: "Local", calories: 520, protein: 38, carbs: 40, fat: 25, fdcId: nil),
        SimpleFood(name: "Lamb Kebab (كباب لحم)", brand: "Local", calories: 340, protein: 25, carbs: 5, fat: 26, fdcId: nil),
        SimpleFood(name: "Chicken Machboos (مجبوس دجاج)", brand: "Local", calories: 580, protein: 35, carbs: 65, fat: 18, fdcId: nil),
        SimpleFood(name: "Fish Sayadieh (صيادية سمك)", brand: "Local", calories: 420, protein: 32, carbs: 45, fat: 12, fdcId: nil),
        SimpleFood(name: "Lamb Biryani (برياني لحم)", brand: "Local", calories: 620, protein: 28, carbs: 70, fat: 24, fdcId: nil),
        SimpleFood(name: "Chicken Mandi (مندي دجاج)", brand: "Local", calories: 550, protein: 32, carbs: 68, fat: 16, fdcId: nil),
        SimpleFood(name: "Mixed Grill (مشاوي مشكلة)", brand: "Local", calories: 680, protein: 45, carbs: 15, fat: 48, fdcId: nil),
        
        // Sandwiches & Wraps
        SimpleFood(name: "Falafel Sandwich (ساندويش فلافل)", brand: "Local", calories: 350, protein: 14, carbs: 48, fat: 12, fdcId: nil),
        SimpleFood(name: "Karak Chai (شاي كرك)", brand: "Local", calories: 120, protein: 3, carbs: 18, fat: 4, fdcId: nil),
        SimpleFood(name: "Arabic Coffee (قهوة عربية)", brand: "Local", calories: 5, protein: 0, carbs: 1, fat: 0, fdcId: nil),
        
        // Desserts
        SimpleFood(name: "Umm Ali (ام علي)", brand: "Local", calories: 380, protein: 8, carbs: 45, fat: 18, fdcId: nil),
        SimpleFood(name: "Knafeh (كنافة)", brand: "Local", calories: 420, protein: 8, carbs: 52, fat: 22, fdcId: nil),
        SimpleFood(name: "Baklava (بقلاوة)", brand: "Local", calories: 290, protein: 4, carbs: 35, fat: 16, fdcId: nil),
        SimpleFood(name: "Luqaimat (لقيمات)", brand: "Local", calories: 320, protein: 4, carbs: 48, fat: 12, fdcId: nil),
        SimpleFood(name: "Basbousa (بسبوسة)", brand: "Local", calories: 340, protein: 4, carbs: 58, fat: 10, fdcId: nil),
        
        // Drinks
        SimpleFood(name: "Laban (لبن)", brand: "Local", calories: 60, protein: 3, carbs: 4, fat: 3, fdcId: nil),
        SimpleFood(name: "Jallab (جلاب)", brand: "Local", calories: 140, protein: 1, carbs: 35, fat: 0, fdcId: nil),
        SimpleFood(name: "Tamar Hindi (تمر هندي)", brand: "Local", calories: 120, protein: 1, carbs: 30, fat: 0, fdcId: nil),
        
        // Fast Food Chains (Popular in Dubai)
        SimpleFood(name: "Al Baik Chicken Meal", brand: "Al Baik", calories: 720, protein: 45, carbs: 65, fat: 32, fdcId: nil),
        SimpleFood(name: "Zinger Burger", brand: "KFC Arabia", calories: 580, protein: 28, carbs: 52, fat: 28, fdcId: nil),
        SimpleFood(name: "McArabia Chicken", brand: "McDonald's", calories: 420, protein: 27, carbs: 45, fat: 14, fdcId: nil),
        
        // Popular Dubai Restaurant Items
        SimpleFood(name: "Butter Chicken", brand: "Restaurant", calories: 438, protein: 30, carbs: 16, fat: 28, fdcId: nil),
        SimpleFood(name: "Chicken Tikka Masala", brand: "Restaurant", calories: 395, protein: 32, carbs: 18, fat: 22, fdcId: nil),
        SimpleFood(name: "Mutton Rogan Josh", brand: "Restaurant", calories: 520, protein: 35, carbs: 12, fat: 38, fdcId: nil),
        SimpleFood(name: "Palak Paneer", brand: "Restaurant", calories: 340, protein: 16, carbs: 15, fat: 26, fdcId: nil),
        
        // Common Iftar Items
        SimpleFood(name: "Dates (تمر)", brand: "Local", calories: 23, protein: 0.2, carbs: 6, fat: 0, fdcId: nil),
        SimpleFood(name: "Sambousek Cheese (سمبوسك جبنة)", brand: "Local", calories: 180, protein: 6, carbs: 18, fat: 10, fdcId: nil),
        SimpleFood(name: "Harees (هريس)", brand: "Local", calories: 320, protein: 18, carbs: 42, fat: 8, fdcId: nil),
        SimpleFood(name: "Thareed (ثريد)", brand: "Local", calories: 380, protein: 22, carbs: 45, fat: 12, fdcId: nil),
        
        // Juices & Beverages
        SimpleFood(name: "Fresh Orange Juice", brand: "Local", calories: 112, protein: 1.7, carbs: 26, fat: 0.5, fdcId: nil),
        SimpleFood(name: "Avocado Shake", brand: "Local", calories: 280, protein: 4, carbs: 32, fat: 16, fdcId: nil),
        SimpleFood(name: "Mango Lassi", brand: "Local", calories: 210, protein: 5, carbs: 38, fat: 4, fdcId: nil)
    ]
    
    static func searchLocal(_ query: String) -> [SimpleFood] {
        let lowercasedQuery = query.lowercased()
        
        // Search in both English and Arabic names
        return commonFoods.filter { food in
            food.name.lowercased().contains(lowercasedQuery) ||
            food.name.components(separatedBy: "(").first?.lowercased().contains(lowercasedQuery) ?? false
        }
    }
}

// Simple Food Search Service
@MainActor
class SimpleFoodSearchService: ObservableObject {
    static let shared = SimpleFoodSearchService()
    
    @Published var searchResults: [SimpleFood] = []
    @Published var isSearching = false
    @Published var useLocalDatabase = true  // Prioritize local foods
    
    private let apiKey = AppConstants.usdaAPIKey
    private let baseURL = "https://api.nal.usda.gov/fdc/v1"
    
    func searchFood(query: String) async {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            searchResults = []
            return
        }
        
        isSearching = true
        
        // First, search local GCC database
        let localResults = GCCFoodDatabase.searchLocal(query)
        
        if !localResults.isEmpty && useLocalDatabase {
            searchResults = localResults
            isSearching = false
            return
        }
        
        // If no local results or disabled, search USDA
        let parameters: [String: Any] = [
            "query": query,
            "pageSize": 10,
            "api_key": apiKey
        ]
        
        do {
            let response = try await AF.request("\(baseURL)/foods/search", parameters: parameters)
                .serializingDecodable(USDAResponse.self)
                .value
            
            var usdaResults = response.foods.compactMap { food in
                guard let nutrients = food.foodNutrients else { return nil }
                
                var calories: Double = 0
                var protein: Double = 0
                var carbs: Double = 0
                var fat: Double = 0
                
                for nutrient in nutrients {
                    switch nutrient.nutrientId {
                    case 1008: calories = nutrient.value ?? 0
                    case 1003: protein = nutrient.value ?? 0
                    case 1005: carbs = nutrient.value ?? 0
                    case 1004: fat = nutrient.value ?? 0
                    default: break
                    }
                }
                
                return SimpleFood(
                    name: food.description,
                    brand: food.brandOwner ?? food.brandName,
                    calories: calories,
                    protein: protein,
                    carbs: carbs,
                    fat: fat,
                    fdcId: food.fdcId
                )
            }
            
            // Combine local and USDA results, prioritizing local
            searchResults = localResults + usdaResults
            isSearching = false
        } catch {
            print("Search error: \(error)")
            // If USDA fails, at least show local results
            searchResults = localResults
            isSearching = false
        }
    }
    
    func searchByBarcode(_ barcode: String) async {
        // USDA uses GTINs (barcodes) in the query
        await searchFood(query: "gtinUpc:\(barcode)")
    }
}