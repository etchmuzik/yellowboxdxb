//
//  SimpleMeal.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Core meal data model
//

import Foundation

struct SimpleMeal: Identifiable, Codable {
    let id: UUID
    let name: String
    let calories: Int
    let time: String
    var protein: Double = 0
    var carbs: Double = 0
    var fat: Double = 0
    
    init(id: UUID = UUID(), name: String, calories: Int, time: String, protein: Double = 0, carbs: Double = 0, fat: Double = 0) {
        self.id = id
        self.name = name
        self.calories = calories
        self.time = time
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }
}