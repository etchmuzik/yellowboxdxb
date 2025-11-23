import Foundation

protocol RegionalFoodProviding {
    func searchFoods(matching query: String) -> [Food]
    func food(for name: String) -> Food?
}

@MainActor
final class DubaiCulinaryDataProvider: RegionalFoodProviding {
    static let shared = DubaiCulinaryDataProvider()
    
    private let store = FoodProfileStore.shared
    
    private init() {}
    
    func searchFoods(matching query: String) -> [Food] {
        store.searchProfiles(containing: query).map { $0.makeFood() }
    }
    
    func food(for name: String) -> Food? {
        store.profile(matching: name)?.makeFood()
    }
}
