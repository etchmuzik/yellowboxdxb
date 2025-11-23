//
//  FoodSearchService.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Service for searching and processing food data from multiple sources
//

import Foundation
import Combine

@MainActor
class FoodSearchService: ObservableObject {
    static let shared = FoodSearchService()
    
    @Published var searchResults: [Food] = []
    @Published var isSearching = false
    @Published var searchError: Error?
    
    private let usdaClient = USDAAPIClient.shared
    private var cancellables = Set<AnyCancellable>()
    
    private init() {}
    
    // MARK: - Search Methods
    
    func searchFood(query: String) async {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            searchResults = []
            return
        }
        
        isSearching = true
        searchError = nil
        
        do {
            // Search USDA database
            let response = try await usdaClient.searchFoods(query: query, pageSize: 20)
            
            // Convert to our Food model
            let foods = response.foods.compactMap { usdaFood in
                usdaClient.convertToFood(usdaFood)
            }
            
            // Update results on main thread
            await MainActor.run {
                self.searchResults = foods
                self.isSearching = false
            }
            
        } catch {
            await MainActor.run {
                self.searchError = error
                self.isSearching = false
                self.searchResults = []
            }
            print("Food search error: \(error)")
        }
    }
    
    func searchByBarcode(_ barcode: String) async {
        isSearching = true
        searchError = nil
        
        do {
            // Search USDA by barcode
            let response = try await usdaClient.searchByBarcode(barcode)
            
            if let firstResult = response.foods.first,
               let food = usdaClient.convertToFood(firstResult) {
                await MainActor.run {
                    self.searchResults = [food]
                    self.isSearching = false
                }
            } else {
                // Try Open Food Facts as fallback
                await searchOpenFoodFacts(barcode: barcode)
            }
            
        } catch {
            // Try Open Food Facts as fallback
            await searchOpenFoodFacts(barcode: barcode)
        }
    }
    
    // MARK: - Food Recognition from Labels
    
    func searchFromRecognizedLabels(_ labels: [String]) async {
        // Prioritize food-related labels
        let foodKeywords = labels.filter { label in
            isFoodRelated(label)
        }
        
        // Build search query from keywords
        let query = foodKeywords.isEmpty ? labels.joined(separator: " ") : foodKeywords.joined(separator: " ")
        
        await searchFood(query: query)
    }
    
    private func isFoodRelated(_ label: String) -> Bool {
        let foodTerms = [
            "food", "meal", "dish", "fruit", "vegetable", "meat", "chicken", "beef", "pork",
            "fish", "seafood", "pasta", "rice", "bread", "cheese", "milk", "yogurt", "egg",
            "salad", "soup", "sandwich", "pizza", "burger", "dessert", "snack", "drink",
            "coffee", "tea", "juice", "soda", "water", "apple", "banana", "orange", "berry",
            "tomato", "lettuce", "carrot", "potato", "onion", "pepper", "corn", "bean"
        ]
        
        let lowercasedLabel = label.lowercased()
        return foodTerms.contains { term in
            lowercasedLabel.contains(term)
        }
    }
    
    // MARK: - Open Food Facts Fallback
    
    private func searchOpenFoodFacts(barcode: String) async {
        let urlString = "https://world.openfoodfacts.org/api/v0/product/\(barcode).json"
        
        guard let url = URL(string: urlString) else {
            await MainActor.run {
                self.isSearching = false
                self.searchError = USDAError.networkError(NSError(domain: "Invalid URL", code: 0))
            }
            return
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(OpenFoodFactsResponse.self, from: data)
            
            if response.status == 1, let product = response.product {
                let food = convertOpenFoodFactsToFood(product)
                await MainActor.run {
                    self.searchResults = [food]
                    self.isSearching = false
                }
            } else {
                await MainActor.run {
                    self.searchResults = []
                    self.isSearching = false
                    self.searchError = USDAError.foodNotFound
                }
            }
        } catch {
            await MainActor.run {
                self.searchError = error
                self.isSearching = false
                self.searchResults = []
            }
        }
    }
    
    private func convertOpenFoodFactsToFood(_ product: OpenFoodFactsProduct) -> Food {
        let nutrients = product.nutriments
        
        let nutritionInfo = NutritionInfo(
            calories: nutrients?.energyKcal100g ?? 0,
            protein: nutrients?.proteins100g ?? 0,
            carbohydrates: nutrients?.carbohydrates100g ?? 0,
            fat: nutrients?.fat100g ?? 0,
            fiber: nutrients?.fiber100g,
            sugar: nutrients?.sugars100g,
            saturatedFat: nutrients?.saturatedFat100g,
            sodium: nutrients?.sodium100g != nil ? (nutrients!.sodium100g! * 1000) : nil // Convert g to mg
        )
        
        return Food(
            name: product.productName ?? "Unknown Product",
            brand: product.brands,
            barcode: product.barcode,
            nutritionInfo: nutritionInfo,
            servingSize: ServingSize(amount: 100, unit: .gram, gramsPerServing: 100),
            recognitionConfidence: 0.9,
            recognizedLabels: product.categories?.components(separatedBy: ",") ?? [],
            openFoodFactsId: product.barcode,
            dataSource: .openFoodFacts
        )
    }
    
    // MARK: - Get Detailed Info
    
    func getFoodDetails(fdcId: Int) async throws -> USDAFoodDetail {
        return try await usdaClient.getFoodDetails(fdcId: fdcId)
    }
}

// MARK: - Open Food Facts Models

struct OpenFoodFactsResponse: Codable {
    let status: Int
    let product: OpenFoodFactsProduct?
}

struct OpenFoodFactsProduct: Codable {
    let barcode: String?
    let productName: String?
    let brands: String?
    let categories: String?
    let nutriments: OpenFoodFactsNutriments?
    
    enum CodingKeys: String, CodingKey {
        case barcode = "code"
        case productName = "product_name"
        case brands
        case categories
        case nutriments
    }
}

struct OpenFoodFactsNutriments: Codable {
    let energyKcal100g: Double?
    let proteins100g: Double?
    let carbohydrates100g: Double?
    let fat100g: Double?
    let saturatedFat100g: Double?
    let fiber100g: Double?
    let sugars100g: Double?
    let sodium100g: Double?
    
    enum CodingKeys: String, CodingKey {
        case energyKcal100g = "energy-kcal_100g"
        case proteins100g = "proteins_100g"
        case carbohydrates100g = "carbohydrates_100g"
        case fat100g = "fat_100g"
        case saturatedFat100g = "saturated-fat_100g"
        case fiber100g = "fiber_100g"
        case sugars100g = "sugars_100g"
        case sodium100g = "sodium_100g"
    }
}