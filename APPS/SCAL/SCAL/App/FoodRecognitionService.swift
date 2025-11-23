import Foundation
import UIKit
import MLKitImageLabeling
import MLKitImageLabelingCommon
import MLKitVision

class FoodRecognitionService {
    static let shared = FoodRecognitionService()
    
    private let labeler: ImageLabeler
    private let usdaClient = USDAAPIClient.shared
    private let heuristics = FoodLabelHeuristics()
    private let cacheQueue = DispatchQueue(label: "com.scal.foodRecognition.cache", attributes: .concurrent)
    private var cachedResults: [String: [RecognizedFood]] = [:]
    
    private init() {
        let options = ImageLabelerOptions()
        options.confidenceThreshold = 0.55
        self.labeler = ImageLabeler.imageLabeler(options: options)
    }
    
    // MARK: - Main Recognition Flow
    func recognizeFood(from image: UIImage) async throws -> [RecognizedFood] {
        let visionImage = VisionImage(image: image)
        visionImage.orientation = image.imageOrientation
        
        let labels = try await detectLabels(in: visionImage)
        let normalizedLabels = labels.map {
            FoodLabelHeuristics.RecognizedLabel(text: $0.text, confidence: Double($0.confidence))
        }
        let candidates = heuristics.makeCandidates(from: normalizedLabels)
        
        guard !candidates.isEmpty else {
            throw FoodRecognitionError.noFoodDetected
        }
        
        var recognizedFoods: [RecognizedFood] = []
        
        for candidate in candidates.prefix(6) {
            if let cached = cachedFoods(for: candidate.canonicalQuery), !cached.isEmpty {
                recognizedFoods.append(contentsOf: cached)
                continue
            }
            
            var resolved: [RecognizedFood] = []
            
            if let profile = heuristics.profile(for: candidate.canonicalQuery) {
                resolved.append(recognizedFood(from: profile, candidate: candidate))
            }
            
            if candidate.shouldQueryRemote || resolved.isEmpty {
                if let remote = try? await searchUSDAForFood(candidate.canonicalQuery, candidate: candidate) {
                    resolved.append(contentsOf: remote)
                }
            }
            
            if resolved.isEmpty {
                resolved.append(createGenericRecognizedFood(for: candidate))
            }
            
            storeFoods(resolved, for: candidate.canonicalQuery)
            recognizedFoods.append(contentsOf: resolved)
        }
        
        let rankedFoods = rankRecognizedFoods(recognizedFoods)
        
        guard !rankedFoods.isEmpty else {
            throw FoodRecognitionError.noFoodDetected
        }
        
        return rankedFoods
    }
    
    // MARK: - ML Kit Label Detection
    private func detectLabels(in image: VisionImage) async throws -> [ImageLabel] {
        return try await withCheckedThrowingContinuation { continuation in
            labeler.process(image) { labels, error in
                if let error = error {
                    continuation.resume(throwing: FoodRecognitionError.mlKitError(error))
                    return
                }
                
                guard let labels = labels else {
                    continuation.resume(throwing: FoodRecognitionError.noLabelsDetected)
                    return
                }
                
                continuation.resume(returning: labels)
            }
        }
    }
    
    // MARK: - Cache Helpers
    private func cachedFoods(for query: String) -> [RecognizedFood]? {
        cacheQueue.sync { cachedResults[query.lowercased()] }
    }
    
    private func storeFoods(_ foods: [RecognizedFood], for query: String) {
        cacheQueue.async(flags: .barrier) {
            self.cachedResults[query.lowercased()] = foods
        }
    }
    
    // MARK: - Resolution Helpers
    private func recognizedFood(from profile: FoodProfile, candidate: FoodLabelCandidate) -> RecognizedFood {
        let food = Food(
            name: profile.canonicalName,
            nutritionInfo: profile.nutrition,
            servingSize: profile.serving,
            recognitionConfidence: candidate.overallScore,
            recognizedLabels: [candidate.originalText],
            dataSource: .aiRecognition
        )
        
        return RecognizedFood(
            food: food,
            confidence: candidate.overallScore,
            source: .mlKit
        )
    }
    
    private func searchUSDAForFood(_ query: String, candidate: FoodLabelCandidate) async throws -> [RecognizedFood] {
        let response = try await usdaClient.searchFoods(query: query, pageSize: 5)
        
        return response.foods.compactMap { usdaFood in
            guard let food = usdaClient.convertToFood(usdaFood) else { return nil }
            let usdaConfidence = min(usdaFood.score ?? 65.0, 100.0) / 100.0
            let boosted = min(1.0, (usdaConfidence * 0.6) + (candidate.overallScore * 0.4))
            let combinedLabels = Array(Set(food.recognizedLabels + [candidate.originalText]))
            
            let enrichedFood = Food(
                id: food.id,
                name: food.name,
                brand: food.brand,
                barcode: food.barcode,
                nutritionInfo: food.nutritionInfo,
                servingSize: food.servingSize,
                recognitionConfidence: boosted,
                imageData: food.imageData,
                recognizedLabels: combinedLabels,
                usdaFoodId: food.usdaFoodId,
                dataSource: .usda,
                customServingSize: food.customServingSize,
                notes: food.notes,
                createdAt: food.createdAt,
                updatedAt: Date()
            )
            
            return RecognizedFood(
                food: enrichedFood,
                confidence: boosted,
                source: .usda
            )
        }
    }
    
    // MARK: - Barcode Scanning
    func recognizeFoodFromBarcode(_ barcode: String) async throws -> RecognizedFood? {
        let searchResponse = try await usdaClient.searchByBarcode(barcode)
        
        guard let firstResult = searchResponse.foods.first,
              let food = usdaClient.convertToFood(firstResult) else {
            throw FoodRecognitionError.barcodeNotFound
        }
        
        return RecognizedFood(
            food: food,
            confidence: 1.0,
            source: .barcode
        )
    }
    
    // MARK: - Generic Fallbacks
    private func createGenericRecognizedFood(for candidate: FoodLabelCandidate) -> RecognizedFood {
        let nutrition = heuristics.estimateNutrition(for: candidate.tokens)
        let food = Food(
            name: candidate.canonicalQuery.capitalized,
            nutritionInfo: nutrition,
            servingSize: ServingSize(amount: 1, unit: .serving, gramsPerServing: 150),
            recognitionConfidence: candidate.overallScore,
            recognizedLabels: [candidate.originalText],
            dataSource: .aiRecognition
        )
        
        return RecognizedFood(
            food: food,
            confidence: candidate.overallScore,
            source: .mlKit
        )
    }
    
    private func rankRecognizedFoods(_ foods: [RecognizedFood]) -> [RecognizedFood] {
        var bestByName: [String: RecognizedFood] = [:]
        
        for result in foods {
            let key = result.food.name.lowercased()
            if let existing = bestByName[key] {
                if result.confidence > existing.confidence ||
                    (abs(result.confidence - existing.confidence) < 0.05 && result.source.priority < existing.source.priority) {
                    bestByName[key] = result
                }
            } else {
                bestByName[key] = result
            }
        }
        
        return bestByName
            .values
            .sorted { lhs, rhs in
                if lhs.confidence == rhs.confidence {
                    return lhs.source.priority < rhs.source.priority
                }
                return lhs.confidence > rhs.confidence
            }
            .prefix(5)
            .map { $0 }
    }
}

// MARK: - Result Types
struct RecognizedFood {
    let food: Food
    let confidence: Double
    let source: RecognitionSource
}

enum RecognitionSource {
    case mlKit
    case usda
    case barcode
    case manual
}

private extension RecognitionSource {
    var priority: Int {
        switch self {
        case .barcode: return 0
        case .usda: return 1
        case .mlKit: return 2
        case .manual: return 3
        }
    }
}

// MARK: - Error Types
enum FoodRecognitionError: LocalizedError {
    case mlKitError(Error)
    case noLabelsDetected
    case noFoodDetected
    case barcodeNotFound
    case usdaSearchFailed(Error)
    
    var errorDescription: String? {
        switch self {
        case .mlKitError(let error):
            return "Image processing failed: \(error.localizedDescription)"
        case .noLabelsDetected:
            return "Could not detect any objects in the image"
        case .noFoodDetected:
            return "No food items detected in the image"
        case .barcodeNotFound:
            return "Product not found in database"
        case .usdaSearchFailed(let error):
            return "Food search failed: \(error.localizedDescription)"
        }
    }
}

// MARK: - Label Heuristics
struct FoodLabelCandidate: Hashable {
    let originalText: String
    let tokens: [String]
    let canonicalQuery: String
    let mlConfidence: Double
    let lexicalConfidence: Double
    let prefersLocalProfile: Bool
    
    var overallScore: Double {
        min(1.0, (mlConfidence * 0.7) + (lexicalConfidence * 0.3))
    }
    
    var shouldQueryRemote: Bool {
        overallScore >= 0.65 || !prefersLocalProfile
    }
}

struct FoodProfile {
    let canonicalName: String
    let aliases: [String]
    let nutrition: NutritionInfo
    let serving: ServingSize
    let cuisineHint: String?
}

struct FoodLabelHeuristics {
    struct RecognizedLabel {
        let text: String
        let confidence: Double
    }
    
    private let stopWords: Set<String> = [
        "food", "meal", "plate", "dining", "table", "kitchen", "cuisine",
        "fork", "spoon", "knife", "dishes", "utensil", "background",
        "surface", "person", "man", "woman", "people", "hand",
        "photography", "container", "glass", "bowl", "tray", "wood",
        "metal", "plastic", "texture", "pattern", "counter", "restaurant",
        "cupboard", "appliance", "shelf", "cloth", "napkin", "napkins",
        "طاولة", "طبق", "مطبخ", "مطعم"
    ]
    
    private let synonyms: [String: String] = [
        "shawarma": "chicken shawarma",
        "shawerma": "chicken shawarma",
        "شاورما": "chicken shawarma",
        "manakeesh": "zaatar manakeesh",
        "manoushe": "zaatar manakeesh",
        "مناقيش": "zaatar manakeesh",
        "machboos": "chicken machboos",
        "مجبوس": "chicken machboos",
        "mandi": "chicken mandi",
        "مندي": "chicken mandi",
        "biryani": "chicken biryani",
        "برياني": "chicken biryani",
        "falafel": "falafel",
        "فلافل": "falafel",
        "hummus": "hummus",
        "حمص": "hummus",
        "knafeh": "knafeh",
        "كنافة": "knafeh",
        "luqaimat": "luqaimat",
        "لقيمات": "luqaimat",
        "karak": "karak chai",
        "arabic coffee": "arabic coffee",
        "قهوة عربية": "arabic coffee",
        "coffee": "arabic coffee",
        "fries": "french fries",
        "chips": "french fries",
        "burger": "hamburger",
        "cheeseburger": "hamburger",
        "cola": "soft drink",
        "soda": "soft drink",
        "shawarmah": "chicken shawarma"
    ]
    
    private let localCuisineKeywords: Set<String> = [
        "shawarma", "شاورما", "machboos", "مجبوس", "mandi", "مندي",
        "biryani", "برياني", "falafel", "فلافل", "hummus", "حمص",
        "knafeh", "كنافة", "luqaimat", "لقيمات", "zaatar", "manakeesh",
        "tabbouleh", "fattoush", "sambousek", "karak", "labneh"
    ]
    
    private let fruitKeywords: Set<String> = [
        "apple", "banana", "orange", "berry", "berries", "grape",
        "mango", "avocado", "fruit", "pineapple", "papaya", "date",
        "تمر"
    ]
    
    private let vegetableKeywords: Set<String> = [
        "salad", "lettuce", "tomato", "cucumber", "pepper", "carrot",
        "vegetable", "broccoli", "spinach", "kale", "cauliflower",
        "okra", "eggplant"
    ]
    
    private let proteinKeywords: Set<String> = [
        "chicken", "beef", "meat", "steak", "fish", "salmon", "tuna",
        "egg", "eggs", "lamb", "kebab", "kebabs", "protein"
    ]
    
    private let grainKeywords: Set<String> = [
        "rice", "pasta", "bread", "wrap", "sandwich", "noodle",
        "noodles", "tortilla", "naan", "chapati", "bun"
    ]
    
    private let dessertKeywords: Set<String> = [
        "cake", "cookie", "dessert", "brownie", "ice", "cream",
        "sweet", "baklava", "knafeh", "luqaimat", "pancake", "waffle",
        "pie"
    ]
    
    private let drinkKeywords: Set<String> = [
        "drink", "juice", "smoothie", "coffee", "tea", "chai", "soda",
        "cola", "water", "latte", "milkshake"
    ]
    
    private let coreFoodVocabulary: Set<String>
    private let localProfiles: [FoodProfile]
    private let profileLookup: [String: FoodProfile]
    
    init() {
        coreFoodVocabulary = fruitKeywords
            .union(vegetableKeywords)
            .union(proteinKeywords)
            .union(grainKeywords)
            .union(dessertKeywords)
            .union(drinkKeywords)
            .union(["pizza", "burger", "shawarma", "falafel", "hummus", "soup", "stew", "curry"])
        
        localProfiles = Self.buildLocalProfiles()
        
        var lookup: [String: FoodProfile] = [:]
        for profile in localProfiles {
            lookup[profile.canonicalName.lowercased()] = profile
            for alias in profile.aliases {
                lookup[alias.lowercased()] = profile
            }
        }
        profileLookup = lookup
    }
    
    func makeCandidates(from labels: [RecognizedLabel]) -> [FoodLabelCandidate] {
        var map: [String: FoodLabelCandidate] = [:]
        
        for label in labels {
            guard label.confidence >= 0.35 else { continue }
            let tokens = normalizeTokens(from: label.text)
            guard !tokens.isEmpty else { continue }
            let canonical = canonicalQuery(from: tokens)
            guard !canonical.isEmpty else { continue }
            let lexical = lexicalConfidence(for: tokens)
            if lexical == 0 && label.confidence < 0.65 { continue }
            let prefersLocal = profileLookup[canonical.lowercased()] != nil ||
                !Set(tokens).isDisjoint(with: localCuisineKeywords)
            let candidate = FoodLabelCandidate(
                originalText: label.text,
                tokens: tokens,
                canonicalQuery: canonical,
                mlConfidence: min(label.confidence, 1.0),
                lexicalConfidence: lexical,
                prefersLocalProfile: prefersLocal
            )
            
            if let existing = map[canonical] {
                if candidate.overallScore > existing.overallScore {
                    map[canonical] = candidate
                }
            } else {
                map[canonical] = candidate
            }
        }
        
        return map.values.sorted { $0.overallScore > $1.overallScore }
    }
    
    func profile(for query: String) -> FoodProfile? {
        profileLookup[query.lowercased()]
    }
    
    func estimateNutrition(for tokens: [String]) -> NutritionInfo {
        let tokenSet = Set(tokens)
        
        if !tokenSet.isDisjoint(with: fruitKeywords) {
            return NutritionInfo(calories: 80, protein: 1, carbohydrates: 20, fat: 0.3)
        }
        if !tokenSet.isDisjoint(with: vegetableKeywords) {
            return NutritionInfo(calories: 45, protein: 2, carbohydrates: 8, fat: 0.4)
        }
        if !tokenSet.isDisjoint(with: proteinKeywords) {
            return NutritionInfo(calories: 220, protein: 25, carbohydrates: 2, fat: 12)
        }
        if !tokenSet.isDisjoint(with: grainKeywords) {
            return NutritionInfo(calories: 260, protein: 8, carbohydrates: 50, fat: 4)
        }
        if !tokenSet.isDisjoint(with: dessertKeywords) {
            return NutritionInfo(calories: 320, protein: 5, carbohydrates: 45, fat: 15)
        }
        if !tokenSet.isDisjoint(with: drinkKeywords) {
            return NutritionInfo(calories: 140, protein: 3, carbohydrates: 25, fat: 3)
        }
        if !tokenSet.isDisjoint(with: localCuisineKeywords) {
            return NutritionInfo(calories: 480, protein: 24, carbohydrates: 45, fat: 20)
        }
        
        return NutritionInfo(calories: 180, protein: 6, carbohydrates: 22, fat: 6)
    }
    
    private func normalizeTokens(from text: String) -> [String] {
        text
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty && !stopWords.contains($0) }
    }
    
    private func canonicalQuery(from tokens: [String]) -> String {
        let joined = tokens.joined(separator: " ")
        if let profile = profileLookup[joined.lowercased()] {
            return profile.canonicalName
        }
        if let synonym = synonyms[joined] {
            return synonym.capitalized
        }
        for token in tokens {
            if let profile = profileLookup[token.lowercased()] {
                return profile.canonicalName
            }
            if let synonym = synonyms[token] {
                return synonym.capitalized
            }
        }
        return joined
    }
    
    private func lexicalConfidence(for tokens: [String]) -> Double {
        var score: Double = 0
        for token in tokens {
            if coreFoodVocabulary.contains(token) {
                score += 0.2
            }
            if localCuisineKeywords.contains(token) {
                score += 0.35
            }
        }
        if tokens.count > 1 {
            score += 0.1
        }
        return min(1.0, score)
    }
    
    private static func buildLocalProfiles() -> [FoodProfile] {
        return [
            FoodProfile(
                canonicalName: "Chicken Shawarma",
                aliases: ["shawarma", "shawerma", "شاورما", "chicken shawarma"],
                nutrition: NutritionInfo(calories: 475, protein: 35, carbohydrates: 40, fat: 20),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 250),
                cuisineHint: "shawarma"
            ),
            FoodProfile(
                canonicalName: "Beef Shawarma",
                aliases: ["beef shawarma", "shawarma beef"],
                nutrition: NutritionInfo(calories: 520, protein: 34, carbohydrates: 38, fat: 25),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 260),
                cuisineHint: "shawarma"
            ),
            FoodProfile(
                canonicalName: "Falafel",
                aliases: ["falafel", "فلافل"],
                nutrition: NutritionInfo(calories: 360, protein: 14, carbohydrates: 32, fat: 22),
                serving: ServingSize(amount: 5, unit: .piece, gramsPerServing: 150),
                cuisineHint: "falafel"
            ),
            FoodProfile(
                canonicalName: "Hummus",
                aliases: ["hummus", "حمص"],
                nutrition: NutritionInfo(calories: 166, protein: 7.9, carbohydrates: 14.3, fat: 9.6),
                serving: ServingSize(amount: 0.5, unit: .cup, gramsPerServing: 120),
                cuisineHint: "hummus"
            ),
            FoodProfile(
                canonicalName: "Zaatar Manakeesh",
                aliases: ["zaatar", "manakeesh", "manoushe", "مناقيش"],
                nutrition: NutritionInfo(calories: 320, protein: 10, carbohydrates: 45, fat: 12),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 180),
                cuisineHint: "zaatar"
            ),
            FoodProfile(
                canonicalName: "Chicken Machboos",
                aliases: ["machboos", "مجبوس", "kabsa"],
                nutrition: NutritionInfo(calories: 560, protein: 32, carbohydrates: 65, fat: 18),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 320),
                cuisineHint: "machboos"
            ),
            FoodProfile(
                canonicalName: "Chicken Mandi",
                aliases: ["mandi", "مندي"],
                nutrition: NutritionInfo(calories: 530, protein: 30, carbohydrates: 62, fat: 17),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 300),
                cuisineHint: "mandi"
            ),
            FoodProfile(
                canonicalName: "Chicken Biryani",
                aliases: ["biryani", "برياني"],
                nutrition: NutritionInfo(calories: 600, protein: 28, carbohydrates: 72, fat: 20),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 320),
                cuisineHint: "biryani"
            ),
            FoodProfile(
                canonicalName: "Karak Chai",
                aliases: ["karak", "karak chai"],
                nutrition: NutritionInfo(calories: 120, protein: 3, carbohydrates: 18, fat: 4),
                serving: ServingSize(amount: 1, unit: .cup, gramsPerServing: 240),
                cuisineHint: "karak"
            ),
            FoodProfile(
                canonicalName: "Knafeh",
                aliases: ["knafeh", "kunafa", "كنافة"],
                nutrition: NutritionInfo(calories: 420, protein: 9, carbohydrates: 48, fat: 22),
                serving: ServingSize(amount: 1, unit: .slice, gramsPerServing: 150),
                cuisineHint: "knafeh"
            ),
            FoodProfile(
                canonicalName: "Arabic Coffee",
                aliases: ["arabic coffee", "قهوة عربية"],
                nutrition: NutritionInfo(calories: 5, protein: 0, carbohydrates: 1, fat: 0),
                serving: ServingSize(amount: 1, unit: .cup, gramsPerServing: 60),
                cuisineHint: "coffee"
            ),
            FoodProfile(
                canonicalName: "Luqaimat",
                aliases: ["luqaimat", "لقيمات"],
                nutrition: NutritionInfo(calories: 340, protein: 5, carbohydrates: 48, fat: 14),
                serving: ServingSize(amount: 4, unit: .piece, gramsPerServing: 120),
                cuisineHint: "luqaimat"
            ),
            FoodProfile(
                canonicalName: "Mixed Salad",
                aliases: ["salad", "fattoush", "tabbouleh"],
                nutrition: NutritionInfo(calories: 210, protein: 5, carbohydrates: 18, fat: 14),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 180),
                cuisineHint: "salad"
            )
        ]
    }
}

// MARK: - UIImage Extension
extension UIImage {
    var imageOrientation: ImageOrientation {
        switch self.imageOrientation {
        case .up:
            return .topLeft
        case .down:
            return .bottomRight
        case .left:
            return .leftBottom
        case .right:
            return .rightTop
        case .upMirrored:
            return .topRight
        case .downMirrored:
            return .bottomLeft
        case .leftMirrored:
            return .leftTop
        case .rightMirrored:
            return .rightBottom
        @unknown default:
            return .topLeft
        }
    }
}
