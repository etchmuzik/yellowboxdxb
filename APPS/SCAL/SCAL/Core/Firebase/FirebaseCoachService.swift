import Foundation

final class FirebaseCoachService {
    static let shared = FirebaseCoachService()
    private let session = URLSession(configuration: .default)
    private init() {}
    
    struct Payload: Codable {
        let message: String
        let context: CoachContextPayload
    }
    
    struct CoachContextPayload: Codable {
        let totalCalories: Int
        let calorieGoal: Int
        let hydrationLiters: Double
        let fastingEnabled: Bool
        let preferLocalFoods: Bool
        let lastMealName: String?
    }
    
    func fetchCoachResponse(message: String, context: CoachContext) async throws -> String? {
        guard let urlString = AppConstants.firebaseCoachEndpoint,
              let url = URL(string: urlString) else {
            return nil
        }
        let payload = Payload(
            message: message,
            context: CoachContextPayload(
                totalCalories: context.totalCalories,
                calorieGoal: context.calorieGoal,
                hydrationLiters: context.hydrationLiters,
                fastingEnabled: context.fastingEnabled,
                preferLocalFoods: context.preferLocalFoods,
                lastMealName: context.lastMealName
            )
        )
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        // Privacy note: only aggregated metrics are transmitted—no user identifiers or raw images.
        request.httpBody = try JSONEncoder().encode(payload)
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            return nil
        }
        return try JSONDecoder().decode(CoachFirebaseResponse.self, from: data).reply
    }
}

struct CoachFirebaseResponse: Codable {
    let reply: String
}
