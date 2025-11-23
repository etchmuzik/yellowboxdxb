import Foundation

final class SupabaseNutritionService {
    static let shared = SupabaseNutritionService()
    
    private let clientProvider: SupabaseClientProvider
    private let isoFormatter: ISO8601DateFormatter
    private let timeFormatter: DateFormatter
    private let userId: String
    
    private init(clientProvider: SupabaseClientProvider = .shared) {
        self.clientProvider = clientProvider
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        self.isoFormatter = iso
        let time = DateFormatter()
        time.timeStyle = .short
        self.timeFormatter = time
        self.userId = SupabaseNutritionService.resolveUserId()
    }
    
    private static func resolveUserId() -> String {
        let defaults = UserDefaults.standard
        if let existing = defaults.string(forKey: "supabase.user.id") {
            return existing
        }
        let generated = UUID().uuidString
        defaults.set(generated, forKey: "supabase.user.id")
        return generated
    }
    
    func fetchMeals(for date: Date) async -> [SimpleMeal] {
        guard let client = clientProvider.makeRESTClient() else { return [] }
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else { return [] }
        let startString = isoFormatter.string(from: startOfDay)
        let endString = isoFormatter.string(from: endOfDay)
        let query: [URLQueryItem] = [
            URLQueryItem(name: "select", value: "id,name,calories,protein,carbs,fat,logged_at"),
            URLQueryItem(name: "user_id", value: "eq.\(userId)"),
            URLQueryItem(name: "logged_at", value: "gte.\(startString)"),
            URLQueryItem(name: "logged_at", value: "lt.\(endString)"),
            URLQueryItem(name: "order", value: "logged_at")
        ]
        do {
            let records: [MealRecord] = try await client.get("nutrition_meals", query: query)
            return records.compactMap { record in
                let date = isoFormatter.date(from: record.logged_at) ?? Date()
                return SimpleMeal(
                    id: record.id,
                    name: record.name,
                    calories: record.calories,
                    time: timeFormatter.string(from: date),
                    protein: record.protein,
                    carbs: record.carbs,
                    fat: record.fat
                )
            }
        } catch {
            print("SupabaseNutritionService.fetchMeals error: \(error)")
            return []
        }
    }
    
    func createMeal(_ meal: SimpleMeal, loggedAt: Date = Date()) async {
        guard let client = clientProvider.makeRESTClient() else { return }
        let insert = MealRecord(
            id: meal.id,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            logged_at: isoFormatter.string(from: loggedAt)
        )
        do {
            try await client.insert("nutrition_meals", payload: [InsertMeal(record: insert, user_id: userId)])
        } catch {
            print("SupabaseNutritionService.createMeal error: \(error)")
        }
    }
    
    func deleteMeal(_ meal: SimpleMeal) async {
        guard let client = clientProvider.makeRESTClient() else { return }
        do {
            try await client.delete("nutrition_meals", query: [
                URLQueryItem(name: "id", value: "eq.\(meal.id.uuidString)"),
                URLQueryItem(name: "user_id", value: "eq.\(userId)")
            ])
        } catch {
            print("SupabaseNutritionService.deleteMeal error: \(error)")
        }
    }
    
    func logWater(amount liters: Double, date: Date = Date()) async {
        guard let client = clientProvider.makeRESTClient() else { return }
        let record = WaterRecord(id: UUID(), amount_liters: liters, logged_at: isoFormatter.string(from: date))
        do {
            try await client.insert("hydration_logs", payload: [InsertWater(record: record, user_id: userId)])
        } catch {
            print("SupabaseNutritionService.logWater error: \(error)")
        }
    }
    
    func fetchWaterTotal(for date: Date) async -> Double {
        guard let client = clientProvider.makeRESTClient() else { return 0 }
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else { return 0 }
        let startString = isoFormatter.string(from: startOfDay)
        let endString = isoFormatter.string(from: endOfDay)
        let query: [URLQueryItem] = [
            URLQueryItem(name: "select", value: "id,amount_liters,logged_at"),
            URLQueryItem(name: "user_id", value: "eq.\(userId)"),
            URLQueryItem(name: "logged_at", value: "gte.\(startString)"),
            URLQueryItem(name: "logged_at", value: "lt.\(endString)")
        ]
        do {
            let records: [WaterRecord] = try await client.get("hydration_logs", query: query)
            return records.reduce(0) { $0 + $1.amount_liters }
        } catch {
            print("SupabaseNutritionService.fetchWaterTotal error: \(error)")
            return 0
        }
    }
    
    private struct MealRecord: Codable {
        let id: UUID
        let name: String
        let calories: Int
        let protein: Double
        let carbs: Double
        let fat: Double
        let logged_at: String
    }
    
    private struct InsertMeal: Encodable {
        let id: UUID
        let user_id: String
        let name: String
        let calories: Int
        let protein: Double
        let carbs: Double
        let fat: Double
        let logged_at: String
        
        init(record: MealRecord, user_id: String) {
            self.id = record.id
            self.user_id = user_id
            self.name = record.name
            self.calories = record.calories
            self.protein = record.protein
            self.carbs = record.carbs
            self.fat = record.fat
            self.logged_at = record.logged_at
        }
    }
    
    private struct WaterRecord: Codable {
        let id: UUID
        let amount_liters: Double
        let logged_at: String
    }
    
    private struct InsertWater: Encodable {
        let id: UUID
        let user_id: String
        let amount_liters: Double
        let logged_at: String
        
        init(record: WaterRecord, user_id: String) {
            self.id = record.id
            self.user_id = user_id
            self.amount_liters = record.amount_liters
            self.logged_at = record.logged_at
        }
    }
}
