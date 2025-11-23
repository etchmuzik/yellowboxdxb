//
//  CoreManagers.swift
//  SCAL
//
//  Bridge file to import Core managers
//  This file ensures all Core/Managers classes are available to the app
//

import Foundation
import SwiftUI
import HealthKit
import Speech
import AVFoundation
import CloudKit

// Import all Core manager files
// Note: These files must be added to the SCAL target in Xcode
// For now, we'll define them here to avoid build issues

// Re-export SimpleMeal model
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

// Placeholder for future Core manager imports
// Once Core files are properly added to Xcode target, we can import them here
// For now, ContentView will continue using its embedded managers
