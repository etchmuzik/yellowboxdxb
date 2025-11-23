import Foundation

enum CommunityEventType: String, CaseIterable, Identifiable {
    case race
    case ride
    case yoga
    case entertainment
    case food
    
    var id: String { rawValue }
}

struct CommunityEvent: Identifiable, Equatable {
    let id: UUID
    let name: String
    let type: CommunityEventType
    let startDate: Date
    let endDate: Date
    let location: String
    let registrationURL: URL?
    let sponsor: String?
    let tips: String
}

final class SupabaseCommunityService {
    static let shared = SupabaseCommunityService()
    
    private let clientProvider: SupabaseClientProvider
    private let isoFormatter: ISO8601DateFormatter
    
    init(clientProvider: SupabaseClientProvider = .shared) {
        self.clientProvider = clientProvider
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        self.isoFormatter = formatter
    }
    
    func fetchEvents() async -> [CommunityEvent] {
        guard let client = clientProvider.makeRESTClient() else {
            return fallbackEvents()
        }
        do {
            let records: [EventRecord] = try await client.get(
                "community_events",
                query: [
                    URLQueryItem(name: "select", value: "id,name,type,start_date,end_date,location,registration_url,sponsor,tips"),
                    URLQueryItem(name: "order", value: "start_date")
                ]
            )
            return records.compactMap { $0.toDomain(formatter: isoFormatter) }
        } catch {
            print("SupabaseCommunityService.fetchEvents error: \(error)")
            return fallbackEvents()
        }
    }
}

private extension SupabaseCommunityService {
    struct EventRecord: Decodable {
        let id: UUID
        let name: String
        let type: String
        let start_date: String
        let end_date: String?
        let location: String
        let registration_url: String?
        let sponsor: String?
        let tips: String?
        
        func toDomain(formatter: ISO8601DateFormatter) -> CommunityEvent? {
            guard let start = formatter.date(from: start_date) else { return nil }
            let eventType = CommunityEventType(rawValue: type.lowercased()) ?? .race
            let end = end_date.flatMap { formatter.date(from: $0) } ?? start
            return CommunityEvent(
                id: id,
                name: name,
                type: eventType,
                startDate: start,
                endDate: end,
                location: location,
                registrationURL: registration_url.flatMap(URL.init(string:)),
                sponsor: sponsor,
                tips: tips ?? "Stay hydrated and follow road-closure alerts"
            )
        }
    }
    
    func fallbackEvents() -> [CommunityEvent] {
        let calendar = Calendar.current
        let now = Date()
        let marathon = CommunityEvent(
            id: UUID(),
            name: "Dubai Marathon",
            type: .race,
            startDate: calendar.date(byAdding: .day, value: 20, to: now) ?? now,
            endDate: calendar.date(byAdding: .day, value: 20, to: now) ?? now,
            location: "Downtown Dubai",
            registrationURL: URL(string: "https://dubaimarathon.org"),
            sponsor: "Dubai Sports Council",
            tips: "Hydrate hourly, arrive early for road closures"
        )
        let foodFestival = CommunityEvent(
            id: UUID(),
            name: "Dubai Food Festival",
            type: .food,
            startDate: calendar.date(byAdding: .day, value: 40, to: now) ?? now,
            endDate: calendar.date(byAdding: .day, value: 50, to: now) ?? now,
            location: "Citywide",
            registrationURL: URL(string: "https://www.visitdubai.com"),
            sponsor: "Dubai Tourism",
            tips: "Check hydration kiosks and sustainable vendors"
        )
        return [marathon, foodFestival]
    }
}
