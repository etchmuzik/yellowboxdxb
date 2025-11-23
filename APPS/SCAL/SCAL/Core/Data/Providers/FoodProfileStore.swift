import Foundation

struct FoodProfileEntry {
    enum Cuisine: String {
        case emirati
        case levantine
        case indian
        case mediterranean
        case international
    }
    
    let canonicalName: String
    let synonyms: [String]
    let cuisine: Cuisine
    let nutrition: NutritionInfo
    let serving: ServingSize
    let description: String
    
    func makeFood(confidence: Double = 0.92) -> Food {
        Food(
            name: canonicalName,
            brand: nil,
            nutritionInfo: nutrition,
            servingSize: serving,
            recognitionConfidence: confidence,
            recognizedLabels: synonyms,
            dataSource: .aiRecognition
        )
    }
}

@MainActor
final class FoodProfileStore: ObservableObject {
    static let shared = FoodProfileStore()
    
    private let profiles: [FoodProfileEntry]
    private var index: [String: FoodProfileEntry] = [:]
    
    private init() {
        self.profiles = FoodProfileStore.seedProfiles
        for profile in profiles {
            index[profile.canonicalName.lowercased()] = profile
            for synonym in profile.synonyms {
                index[synonym.lowercased()] = profile
            }
        }
    }
    
    func profile(matching name: String) -> FoodProfileEntry? {
        index[name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()]
    }
    
    func enhance(food: Food) -> Food {
        guard let profile = profile(matching: food.name) ?? food.recognizedLabels.compactMap({ profile(matching: $0) }).first else {
            return food
        }
        return Food(
            id: food.id,
            name: profile.canonicalName,
            brand: food.brand,
            barcode: food.barcode,
            nutritionInfo: profile.nutrition,
            servingSize: profile.serving,
            recognitionConfidence: max(food.recognitionConfidence, 0.9),
            imageData: food.imageData,
            recognizedLabels: Array(Set(food.recognizedLabels + profile.synonyms)),
            usdaFoodId: food.usdaFoodId,
            dataSource: .aiRecognition,
            customServingSize: food.customServingSize,
            notes: food.notes,
            createdAt: food.createdAt,
            updatedAt: Date()
        )
    }
    
    func searchProfiles(containing query: String) -> [FoodProfileEntry] {
        guard !query.isEmpty else { return profiles }
        let lower = query.lowercased()
        return profiles.filter { entry in
            entry.canonicalName.lowercased().contains(lower) ||
            entry.synonyms.contains(where: { $0.lowercased().contains(lower) })
        }
    }
}

private extension FoodProfileStore {
    static var seedProfiles: [FoodProfileEntry] {
        [
            FoodProfileEntry(
                canonicalName: "Chicken Shawarma",
                synonyms: ["shawarma", "shawerma", "شاورما", "arabic shawarma"],
                cuisine: .levantine,
                nutrition: NutritionInfo(calories: 475, protein: 35, carbohydrates: 40, fat: 20),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 250),
                description: "Rotisserie chicken wrap with garlic sauce and pickles"
            ),
            FoodProfileEntry(
                canonicalName: "Beef Shawarma",
                synonyms: ["beef shawarma", "shawarma lahm"],
                cuisine: .levantine,
                nutrition: NutritionInfo(calories: 520, protein: 34, carbohydrates: 38, fat: 25),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 260),
                description: "Beef wrap with tahini sauce"
            ),
            FoodProfileEntry(
                canonicalName: "Chicken Machboos",
                synonyms: ["machboos", "kabsa", "مجبوس"],
                cuisine: .emirati,
                nutrition: NutritionInfo(calories: 560, protein: 32, carbohydrates: 65, fat: 18),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 320),
                description: "Fragrant spiced rice with chicken"
            ),
            FoodProfileEntry(
                canonicalName: "Chicken Mandi",
                synonyms: ["mandi", "مندي"],
                cuisine: .emirati,
                nutrition: NutritionInfo(calories: 530, protein: 30, carbohydrates: 62, fat: 17),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 300),
                description: "Smoky rice dish popular in UAE"
            ),
            FoodProfileEntry(
                canonicalName: "Falafel",
                synonyms: ["falafel", "فلافل"],
                cuisine: .levantine,
                nutrition: NutritionInfo(calories: 360, protein: 14, carbohydrates: 32, fat: 22),
                serving: ServingSize(amount: 5, unit: .piece, gramsPerServing: 150),
                description: "Fried chickpea patties"
            ),
            FoodProfileEntry(
                canonicalName: "Hummus",
                synonyms: ["hummus", "حمص"],
                cuisine: .levantine,
                nutrition: NutritionInfo(calories: 166, protein: 7.9, carbohydrates: 14.3, fat: 9.6),
                serving: ServingSize(amount: 0.5, unit: .cup, gramsPerServing: 120),
                description: "Chickpea dip"
            ),
            FoodProfileEntry(
                canonicalName: "Zaatar Manakeesh",
                synonyms: ["zaatar", "manakeesh", "manoushe", "مناقيش"],
                cuisine: .levantine,
                nutrition: NutritionInfo(calories: 320, protein: 10, carbohydrates: 45, fat: 12),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 180),
                description: "Flatbread with zaatar"
            ),
            FoodProfileEntry(
                canonicalName: "Knafeh",
                synonyms: ["knafeh", "kunafa", "كنافة"],
                cuisine: .levantine,
                nutrition: NutritionInfo(calories: 420, protein: 9, carbohydrates: 48, fat: 22),
                serving: ServingSize(amount: 1, unit: .slice, gramsPerServing: 150),
                description: "Sweet cheese dessert"
            ),
            FoodProfileEntry(
                canonicalName: "Luqaimat",
                synonyms: ["luqaimat", "لقيمات"],
                cuisine: .emirati,
                nutrition: NutritionInfo(calories: 340, protein: 5, carbohydrates: 48, fat: 14),
                serving: ServingSize(amount: 4, unit: .piece, gramsPerServing: 120),
                description: "Saffron dumplings"
            ),
            FoodProfileEntry(
                canonicalName: "Karak Chai",
                synonyms: ["karak", "karak chai"],
                cuisine: .indian,
                nutrition: NutritionInfo(calories: 120, protein: 3, carbohydrates: 18, fat: 4),
                serving: ServingSize(amount: 1, unit: .cup, gramsPerServing: 240),
                description: "Milky tea popular in UAE"
            ),
            FoodProfileEntry(
                canonicalName: "Arabic Coffee",
                synonyms: ["arabic coffee", "gahwa", "قهوة عربية"],
                cuisine: .emirati,
                nutrition: NutritionInfo(calories: 5, protein: 0, carbohydrates: 1, fat: 0),
                serving: ServingSize(amount: 1, unit: .cup, gramsPerServing: 60),
                description: "Light roast Arabic coffee"
            ),
            FoodProfileEntry(
                canonicalName: "Mixed Grill",
                synonyms: ["mixed grill", "مشاوي"],
                cuisine: .mediterranean,
                nutrition: NutritionInfo(calories: 680, protein: 45, carbohydrates: 15, fat: 48),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 300),
                description: "Assorted grilled meats"
            ),
            FoodProfileEntry(
                canonicalName: "Fish Sayadieh",
                synonyms: ["sayadieh", "صيادية"],
                cuisine: .levantine,
                nutrition: NutritionInfo(calories: 420, protein: 32, carbohydrates: 45, fat: 12),
                serving: ServingSize(amount: 1, unit: .serving, gramsPerServing: 280),
                description: "Fish with caramelised rice"
            )
        ]
    }
}
