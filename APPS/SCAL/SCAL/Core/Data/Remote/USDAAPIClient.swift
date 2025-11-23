import Foundation
import Alamofire

// USDA FoodData Central API Client
class USDAAPIClient {
    static let shared = USDAAPIClient()
    
    private let baseURL = "https://api.nal.usda.gov/fdc/v1"
    private let apiKey: String
    private let session: Session
    
    private init() {
        // Get API key from AppConstants
        self.apiKey = AppConstants.usdaAPIKey
        
        // Configure Alamofire session with caching
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.requestCachePolicy = .returnCacheDataElseLoad
        
        self.session = Session(configuration: configuration)
    }
    
    // MARK: - Food Search
    func searchFoods(query: String, pageSize: Int = 25) async throws -> USDASearchResponse {
        let parameters: [String: Any] = [
            "query": query,
            "pageSize": pageSize,
            "api_key": apiKey,
            "dataType": ["Branded", "Survey (FNDDS)", "Foundation"]
        ]
        
        return try await withCheckedThrowingContinuation { continuation in
            session.request("\(baseURL)/foods/search", parameters: parameters)
                .validate()
                .responseDecodable(of: USDASearchResponse.self) { response in
                    switch response.result {
                    case .success(let searchResponse):
                        continuation.resume(returning: searchResponse)
                    case .failure(let error):
                        continuation.resume(throwing: USDAError.networkError(error))
                    }
                }
        }
    }
    
    // MARK: - Get Food Details
    func getFoodDetails(fdcId: Int) async throws -> USDAFoodDetail {
        let parameters = ["api_key": apiKey]
        
        return try await withCheckedThrowingContinuation { continuation in
            session.request("\(baseURL)/food/\(fdcId)", parameters: parameters)
                .validate()
                .responseDecodable(of: USDAFoodDetail.self) { response in
                    switch response.result {
                    case .success(let foodDetail):
                        continuation.resume(returning: foodDetail)
                    case .failure(let error):
                        continuation.resume(throwing: USDAError.networkError(error))
                    }
                }
        }
    }
    
    // MARK: - Search by Barcode
    func searchByBarcode(_ barcode: String) async throws -> USDASearchResponse {
        // USDA uses GTINs (barcodes) in the query
        return try await searchFoods(query: "gtinUpc:\(barcode)")
    }
    
    // MARK: - Convert USDA to our Food model
    func convertToFood(_ usdaFood: USDASearchResult) -> Food? {
        guard let nutrients = parseNutrients(from: usdaFood.foodNutrients) else {
            return nil
        }
        
        let servingSize = parseServingSize(from: usdaFood)
        
        return Food(
            name: usdaFood.description,
            brand: usdaFood.brandName ?? usdaFood.brandOwner,
            barcode: usdaFood.gtinUpc,
            nutritionInfo: nutrients,
            servingSize: servingSize,
            recognitionConfidence: 1.0, // High confidence from USDA
            recognizedLabels: usdaFood.foodCategory?.components(separatedBy: ",") ?? [],
            usdaFoodId: String(usdaFood.fdcId),
            dataSource: .usda
        )
    }
    
    private func parseNutrients(from nutrients: [USDANutrient]?) -> NutritionInfo? {
        guard let nutrients = nutrients else { return nil }
        
        var calories: Double = 0
        var protein: Double = 0
        var carbs: Double = 0
        var fat: Double = 0
        var fiber: Double?
        var sugar: Double?
        var sodium: Double?
        var saturatedFat: Double?
        var cholesterol: Double?
        
        for nutrient in nutrients {
            switch nutrient.nutrientId {
            case 1008: // Energy (kcal)
                calories = nutrient.value ?? 0
            case 1003: // Protein
                protein = nutrient.value ?? 0
            case 1005: // Carbohydrate
                carbs = nutrient.value ?? 0
            case 1004: // Total fat
                fat = nutrient.value ?? 0
            case 1079: // Fiber
                fiber = nutrient.value
            case 2000: // Sugars
                sugar = nutrient.value
            case 1093: // Sodium
                sodium = nutrient.value
            case 1258: // Saturated fat
                saturatedFat = nutrient.value
            case 1253: // Cholesterol
                cholesterol = nutrient.value
            default:
                break
            }
        }
        
        return NutritionInfo(
            calories: calories,
            protein: protein,
            carbohydrates: carbs,
            fat: fat,
            fiber: fiber,
            sugar: sugar,
            saturatedFat: saturatedFat,
            sodium: sodium,
            cholesterol: cholesterol
        )
    }
    
    private func parseServingSize(from food: USDASearchResult) -> ServingSize {
        // Default to 100g if no serving size info
        let amount = food.servingSize ?? 100
        let unit = food.servingSizeUnit ?? "g"
        
        let servingUnit: ServingUnit
        switch unit.lowercased() {
        case "g", "gram", "grams":
            servingUnit = .gram
        case "oz", "ounce", "ounces":
            servingUnit = .ounce
        case "cup", "cups":
            servingUnit = .cup
        case "tbsp", "tablespoon", "tablespoons":
            servingUnit = .tablespoon
        case "tsp", "teaspoon", "teaspoons":
            servingUnit = .teaspoon
        default:
            servingUnit = .serving
        }
        
        return ServingSize(
            amount: amount,
            unit: servingUnit,
            gramsPerServing: food.servingSize
        )
    }
}

// MARK: - USDA API Models
struct USDASearchResponse: Codable {
    let foods: [USDASearchResult]
    let totalHits: Int
    let currentPage: Int
    let totalPages: Int
}

struct USDASearchResult: Codable {
    let fdcId: Int
    let description: String
    let dataType: String?
    let gtinUpc: String?
    let brandOwner: String?
    let brandName: String?
    let ingredients: String?
    let marketCountry: String?
    let foodCategory: String?
    let allHighlightFields: String?
    let score: Double?
    let servingSize: Double?
    let servingSizeUnit: String?
    let foodNutrients: [USDANutrient]?
}

struct USDAFoodDetail: Codable {
    let fdcId: Int
    let description: String
    let dataType: String?
    let gtinUpc: String?
    let brandOwner: String?
    let brandName: String?
    let ingredients: String?
    let marketCountry: String?
    let foodCategory: String?
    let servingSize: Double?
    let servingSizeUnit: String?
    let foodNutrients: [USDANutrientDetail]?
}

struct USDANutrient: Codable {
    let nutrientId: Int
    let nutrientName: String?
    let nutrientNumber: String?
    let unitName: String?
    let value: Double?
}

struct USDANutrientDetail: Codable {
    let nutrient: USDANutrientInfo
    let amount: Double?
}

struct USDANutrientInfo: Codable {
    let id: Int
    let name: String
    let number: String
    let unitName: String
}

// MARK: - Error Types
enum USDAError: LocalizedError {
    case invalidAPIKey
    case networkError(Error)
    case decodingError(Error)
    case noNutritionData
    case foodNotFound
    
    var errorDescription: String? {
        switch self {
        case .invalidAPIKey:
            return "Invalid USDA API key"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .noNutritionData:
            return "No nutrition data available for this food"
        case .foodNotFound:
            return "Food not found in USDA database"
        }
    }
}