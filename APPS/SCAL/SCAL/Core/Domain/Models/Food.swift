import Foundation
import UIKit

struct Food: Identifiable, Codable {
    let id: UUID
    let name: String
    let brand: String?
    let barcode: String?
    
    // Nutrition per serving
    let nutritionInfo: NutritionInfo
    let servingSize: ServingSize
    
    // Recognition metadata
    let recognitionConfidence: Double // 0.0 to 1.0
    let imageData: Data?
    let recognizedLabels: [String]
    
    // USDA Data
    let usdaFoodId: String?
    let dataSource: DataSource
    
    // User customization
    var customServingSize: Double // Multiplier for nutrition
    var notes: String?
    
    // Timestamps
    let createdAt: Date
    let updatedAt: Date
    
    init(
        id: UUID = UUID(),
        name: String,
        brand: String? = nil,
        barcode: String? = nil,
        nutritionInfo: NutritionInfo,
        servingSize: ServingSize,
        recognitionConfidence: Double = 1.0,
        imageData: Data? = nil,
        recognizedLabels: [String] = [],
        usdaFoodId: String? = nil,
        dataSource: DataSource = .manual,
        customServingSize: Double = 1.0,
        notes: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.brand = brand
        self.barcode = barcode
        self.nutritionInfo = nutritionInfo
        self.servingSize = servingSize
        self.recognitionConfidence = recognitionConfidence
        self.imageData = imageData
        self.recognizedLabels = recognizedLabels
        self.usdaFoodId = usdaFoodId
        self.dataSource = dataSource
        self.customServingSize = customServingSize
        self.notes = notes
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // Computed nutrition based on custom serving size
    var adjustedNutrition: NutritionInfo {
        nutritionInfo.scaled(by: customServingSize)
    }
    
    // Display helpers
    var displayName: String {
        if let brand = brand {
            return "\(name) - \(brand)"
        }
        return name
    }
    
    var confidenceLevel: ConfidenceLevel {
        switch recognitionConfidence {
        case 0.9...1.0:
            return .high
        case 0.7..<0.9:
            return .medium
        default:
            return .low
        }
    }
}

// MARK: - Supporting Types
struct ServingSize: Codable {
    let amount: Double
    let unit: ServingUnit
    let gramsPerServing: Double?
    
    var displayText: String {
        if amount == 1 {
            return "1 \(unit.singular)"
        } else {
            return "\(amount.formatted()) \(unit.plural)"
        }
    }
}

enum ServingUnit: String, Codable, CaseIterable {
    case gram = "g"
    case ounce = "oz"
    case cup = "cup"
    case tablespoon = "tbsp"
    case teaspoon = "tsp"
    case piece = "piece"
    case slice = "slice"
    case serving = "serving"
    case small = "small"
    case medium = "medium"
    case large = "large"
    
    var singular: String {
        switch self {
        case .gram: return "gram"
        case .ounce: return "ounce"
        case .cup: return "cup"
        case .tablespoon: return "tablespoon"
        case .teaspoon: return "teaspoon"
        case .piece: return "piece"
        case .slice: return "slice"
        case .serving: return "serving"
        case .small: return "small"
        case .medium: return "medium"
        case .large: return "large"
        }
    }
    
    var plural: String {
        switch self {
        case .gram: return "grams"
        case .ounce: return "ounces"
        case .cup: return "cups"
        case .tablespoon: return "tablespoons"
        case .teaspoon: return "teaspoons"
        case .piece: return "pieces"
        case .slice: return "slices"
        case .serving: return "servings"
        case .small: return "small"
        case .medium: return "medium"
        case .large: return "large"
        }
    }
}

enum DataSource: String, Codable {
    case usda = "USDA"
    case openFoodFacts = "OpenFoodFacts"
    case aiRecognition = "AI"
    case barcode = "Barcode"
    case manual = "Manual"
    case custom = "Custom"
}

enum ConfidenceLevel {
    case high
    case medium
    case low
    
    var color: UIColor {
        switch self {
        case .high: return .systemGreen
        case .medium: return .systemYellow
        case .low: return .systemRed
        }
    }
    
    var description: String {
        switch self {
        case .high: return "High confidence"
        case .medium: return "Medium confidence"
        case .low: return "Low confidence"
        }
    }
}

// MARK: - Sample Data
extension Food {
    static let sampleApple = Food(
        name: "Apple",
        brand: nil,
        nutritionInfo: .sampleApple,
        servingSize: ServingSize(amount: 1, unit: .medium, gramsPerServing: 182),
        recognitionConfidence: 0.95,
        recognizedLabels: ["apple", "fruit", "food"],
        dataSource: .aiRecognition
    )
}