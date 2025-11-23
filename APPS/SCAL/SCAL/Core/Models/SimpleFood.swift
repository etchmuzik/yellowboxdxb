//
//  SimpleFood.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Core food data model
//

import Foundation

struct SimpleFood: Identifiable, Codable {
    let id = UUID()
    let name: String
    let brand: String?
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double
    let fdcId: Int?
    var confidence: Float? = nil  // ML Kit confidence score
}

// USDA API Response Models
struct USDAResponse: Codable {
    let foods: [USDAFood]
}

struct USDAFood: Codable {
    let fdcId: Int
    let description: String
    let brandOwner: String?
    let brandName: String?
    let foodNutrients: [USDANutrient]?
}

struct USDANutrient: Codable {
    let nutrientId: Int
    let value: Double?
}