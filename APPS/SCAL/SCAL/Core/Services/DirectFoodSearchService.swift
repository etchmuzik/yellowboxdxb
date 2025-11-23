//
//  DirectFoodSearchService.swift
//  SCAL
//
//  Direct food search service that bypasses ML Kit and uses only USDA API
//

import Foundation
import UIKit

class DirectFoodSearchService: ObservableObject {
    @Published var searchResults: [SimpleFood] = []
    @Published var isSearching = false
    @Published var searchError: String?
    
    private let usdaClient = USDAAPIClient()
    private let localDatabase = LocalFoodDatabase()
    
    // Search for food by name (user input or confirmed label)
    func searchFood(query: String) async {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            await MainActor.run {
                self.searchError = "Please enter a food name"
            }
            return
        }
        
        await MainActor.run {
            self.isSearching = true
            self.searchError = nil
            self.searchResults = []
        }
        
        do {
            // First check local database for common foods
            let localResults = localDatabase.search(query: query)
            
            if !localResults.isEmpty {
                await MainActor.run {
                    self.searchResults = localResults
                    self.isSearching = false
                }
                return
            }
            
            // If not found locally, search USDA
            let usdaResults = try await usdaClient.searchFoods(query: query, pageSize: 10)
            
            await MainActor.run {
                self.searchResults = usdaResults
                self.isSearching = false
            }
            
        } catch {
            await MainActor.run {
                self.searchError = "Search failed: \(error.localizedDescription)"
                self.isSearching = false
            }
        }
    }
    
    // Get nutrition for a specific food by FDC ID
    func getFoodDetails(fdcId: String) async -> SimpleFood? {
        do {
            return try await usdaClient.getFoodDetails(fdcId: fdcId)
        } catch {
            print("Failed to get food details: \(error)")
            return nil
        }
    }
    
    // Search by barcode
    func searchByBarcode(_ barcode: String) async {
        await searchFood(query: barcode)
    }
}

// Simple local database for common foods
class LocalFoodDatabase {
    private let commonFoods: [SimpleFood] = [
        // Popular snacks
        SimpleFood(name: "Popcorn, air-popped", brand: nil, calories: 31, protein: 1.0, carbs: 6.2, fat: 0.4, servingSize: "1 cup", servingUnit: "cup", fdcId: "167950"),
        SimpleFood(name: "Popcorn, oil-popped", brand: nil, calories: 55, protein: 1.0, carbs: 6.3, fat: 3.1, servingSize: "1 cup", servingUnit: "cup", fdcId: "167951"),
        SimpleFood(name: "Popcorn, caramel", brand: nil, calories: 122, protein: 1.1, carbs: 22.4, fat: 3.6, servingSize: "1 oz", servingUnit: "oz", fdcId: "168882"),
        
        // Common fruits
        SimpleFood(name: "Apple", brand: nil, calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, servingSize: "100", servingUnit: "g", fdcId: "171688"),
        SimpleFood(name: "Banana", brand: nil, calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, servingSize: "100", servingUnit: "g", fdcId: "173944"),
        SimpleFood(name: "Orange", brand: nil, calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, servingSize: "100", servingUnit: "g", fdcId: "169097"),
        
        // Common meals
        SimpleFood(name: "Pizza, cheese", brand: nil, calories: 266, protein: 11.4, carbs: 33.3, fat: 10.1, servingSize: "100", servingUnit: "g", fdcId: "173292"),
        SimpleFood(name: "Hamburger", brand: nil, calories: 295, protein: 17.0, carbs: 24.0, fat: 14.0, servingSize: "1 sandwich", servingUnit: "sandwich", fdcId: "174275"),
        SimpleFood(name: "French fries", brand: nil, calories: 312, protein: 3.4, carbs: 41.4, fat: 14.7, servingSize: "100", servingUnit: "g", fdcId: "170698"),
        
        // Add more common foods as needed
    ]
    
    func search(query: String) -> [SimpleFood] {
        let lowercaseQuery = query.lowercased()
        return commonFoods.filter { food in
            food.name.lowercased().contains(lowercaseQuery)
        }
    }
}

// Updated scan result to focus on user input
struct DirectScanResult {
    let image: UIImage
    let userQuery: String?
    let suggestedFoods: [SimpleFood]
    
    init(image: UIImage, userQuery: String? = nil, suggestedFoods: [SimpleFood] = []) {
        self.image = image
        self.userQuery = userQuery
        self.suggestedFoods = suggestedFoods
    }
}