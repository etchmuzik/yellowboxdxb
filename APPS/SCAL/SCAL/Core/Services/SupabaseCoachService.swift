import Foundation
import SwiftUI
#if canImport(Supabase)
import Supabase
#endif

struct CoachContextRequest: Codable {
    let totalCalories: Int
    let calorieGoal: Int
    let hydrationLiters: Double
    let fastingEnabled: Bool
    let preferLocalFoods: Bool
    let locale: String
}

final class SupabaseCoachService {
    static let shared = SupabaseCoachService()
    
    private let clientProvider: SupabaseClientProvider
    
    init(clientProvider: SupabaseClientProvider = .shared) {
        self.clientProvider = clientProvider
    }
    
    private struct EdgeFunctionPayload: Codable {
        let context: CoachContextRequest
    }
    
    private struct EdgeFunctionResponse: Codable {
        struct Item: Codable {
            let type: String
            let title: String
            let message: String
            let icon: String?
            let accent: String?
        }
        let insights: [Item]
    }
    
    func fetchInsights(context: CoachContextRequest) async throws -> [CoachInsight] {
        if let supabaseResponse = try await fetchInsightsUsingNativeClient(context: context) {
            return supabaseResponse
        }
        if let restResponse = try await fetchInsightsUsingREST(context: context) {
            return restResponse
        }
        return fallbackInsights(for: context)
    }
    
#if canImport(Supabase)
    private func fetchInsightsUsingNativeClient(context: CoachContextRequest) async throws -> [CoachInsight]? {
        guard let client = clientProvider.client else { return nil }
        do {
            let response: EdgeFunctionResponse = try await client.functions.invoke(
                "coach-insights",
                body: EdgeFunctionPayload(context: context)
            )
            return mapResponse(response)
        } catch {
            return nil
        }
    }
#else
    private func fetchInsightsUsingNativeClient(context: CoachContextRequest) async throws -> [CoachInsight]? {
        nil
    }
#endif
    
    private func fetchInsightsUsingREST(context: CoachContextRequest) async throws -> [CoachInsight]? {
        guard let baseURL = clientProvider.restURL,
              let anonKey = clientProvider.anonKey else {
            return nil
        }
        let endpoint = baseURL.appendingPathComponent("functions/v1/coach-insights")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.addValue(anonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONEncoder().encode(EdgeFunctionPayload(context: context))
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              200..<300 ~= httpResponse.statusCode else {
            return nil
        }
        let decoded = try JSONDecoder().decode(EdgeFunctionResponse.self, from: data)
        return mapResponse(decoded)
    }
    
    private func mapResponse(_ response: EdgeFunctionResponse) -> [CoachInsight] {
        response.insights.compactMap { item in
            guard let kind = CoachInsight.Kind(rawValue: item.type.lowercased()) else { return nil }
            return CoachInsight(
                kind: kind,
                title: item.title,
                message: item.message,
                icon: item.icon ?? "sparkles",
                accent: Color(hex: item.accent ?? "#2AC1A4")
            )
        }
    }
    
    private func fallbackInsights(for context: CoachContextRequest) -> [CoachInsight] {
        let kind: CoachInsight.Kind = context.fastingEnabled ? .fasting : .daily
        let message: String
        if context.fastingEnabled {
            message = "Focus on Suhoor with oats and laban, keep Iftar light before main dishes."
        } else if context.preferLocalFoods {
            message = "You still have \(context.calorieGoal - context.totalCalories) calories. Try Chicken Machboos with salad tonight."
        } else {
            message = "Hydration at \(String(format: "%.1f", context.hydrationLiters))L. Aim for 2.5L to hit your goal."
        }
        return [CoachInsight(kind: kind,
                             title: "Coach",
                             message: message,
                             icon: "sparkles",
                             accent: .calPrimary)]
    }
}

private extension Color {
    init(hex: String) {
        var hexString = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        if hexString.count == 3 {
            for (index, char) in hexString.enumerated() {
                hexString.insert(char, at: hexString.index(hexString.startIndex, offsetBy: index * 2))
            }
        }
        var int = UInt64()
        Scanner(string: hexString).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hexString.count {
        case 8: (a, r, g, b) = ((int & 0xff000000) >> 24, (int & 0x00ff0000) >> 16, (int & 0x0000ff00) >> 8, int & 0x000000ff)
        default: (a, r, g, b) = (255, (int & 0x00ff0000) >> 16, (int & 0x0000ff00) >> 8, int & 0x000000ff)
        }
        self = Color(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
