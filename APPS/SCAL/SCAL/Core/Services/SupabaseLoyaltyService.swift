import Foundation

struct LoyaltyPartner: Identifiable, Equatable {
    let id: UUID
    let name: String
    let description: String
    let logoURL: URL?
    let orderingURL: URL?
}

struct LoyaltyAccount: Identifiable, Equatable {
    let id: UUID
    let partner: LoyaltyPartner
    let points: Int
    let tier: String
}

struct LoyaltyTransaction: Identifiable, Equatable {
    let id = UUID()
    let date: Date
    let description: String
    let points: Int
}

final class SupabaseLoyaltyService {
    static let shared = SupabaseLoyaltyService()
    
    private let clientProvider: SupabaseClientProvider
    private let isoFormatter: ISO8601DateFormatter
    
    init(clientProvider: SupabaseClientProvider = .shared) {
        self.clientProvider = clientProvider
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        self.isoFormatter = formatter
    }
    
    func fetchPartners() async -> [LoyaltyPartner] {
        guard let client = clientProvider.makeRESTClient() else {
            return fallbackPartners()
        }
        do {
            let records: [PartnerRecord] = try await client.get(
                "loyalty_partners",
                query: [
                    URLQueryItem(name: "select", value: "id,name,description,logo_url,ordering_url"),
                    URLQueryItem(name: "order", value: "name")
                ]
            )
            return records.map { $0.toDomain() }
        } catch {
            print("SupabaseLoyaltyService.fetchPartners error: \(error)")
            return fallbackPartners()
        }
    }
    
    func fetchAccount() async -> LoyaltyAccount? {
        guard let client = clientProvider.makeRESTClient() else {
            guard let partner = (await fetchPartners()).first else { return nil }
            return LoyaltyAccount(id: UUID(), partner: partner, points: 280, tier: "Gold")
        }
        do {
            let records: [AccountRecord] = try await client.get(
                "loyalty_accounts",
                query: [
                    URLQueryItem(name: "select", value: "id,points,tier,partner:partner_id(id,name,description,logo_url,ordering_url)"),
                    URLQueryItem(name: "limit", value: "1")
                ]
            )
            guard let record = records.first else { return nil }
            if let account = record.toDomain() {
                return account
            }
            guard let partner = (await fetchPartners()).first else { return nil }
            return LoyaltyAccount(id: record.id, partner: partner, points: record.points, tier: record.tier)
        } catch {
            print("SupabaseLoyaltyService.fetchAccount error: \(error)")
            guard let partner = (await fetchPartners()).first else { return nil }
            return LoyaltyAccount(id: UUID(), partner: partner, points: 280, tier: "Gold")
        }
    }
    
    func fetchTransactions() async -> [LoyaltyTransaction] {
        guard let client = clientProvider.makeRESTClient() else {
            return fallbackTransactions()
        }
        do {
            let records: [TransactionRecord] = try await client.get(
                "loyalty_transactions",
                query: [
                    URLQueryItem(name: "select", value: "id,created_at,description,points"),
                    URLQueryItem(name: "order", value: "created_at.desc"),
                    URLQueryItem(name: "limit", value: "20")
                ]
            )
            return records.compactMap { $0.toDomain(formatter: isoFormatter) }
        } catch {
            print("SupabaseLoyaltyService.fetchTransactions error: \(error)")
            return fallbackTransactions()
        }
    }
}

private extension SupabaseLoyaltyService {
    struct PartnerRecord: Decodable {
        let id: UUID
        let name: String
        let description: String
        let logo_url: String?
        let ordering_url: String?
        
        func toDomain() -> LoyaltyPartner {
            LoyaltyPartner(
                id: id,
                name: name,
                description: description,
                logoURL: logo_url.flatMap(URL.init(string:)),
                orderingURL: ordering_url.flatMap(URL.init(string:))
            )
        }
    }
    
    struct AccountRecord: Decodable {
        let id: UUID
        let points: Int
        let tier: String
        let partner: PartnerRecord?
        
        private enum CodingKeys: String, CodingKey {
            case id
            case points
            case tier
            case partner
        }
        
        func toDomain() -> LoyaltyAccount? {
            guard let partner = partner?.toDomain() else { return nil }
            return LoyaltyAccount(id: id, partner: partner, points: points, tier: tier)
        }
    }
    
    struct TransactionRecord: Decodable {
        let id: UUID
        let created_at: String
        let description: String
        let points: Int
        
        func toDomain(formatter: ISO8601DateFormatter) -> LoyaltyTransaction? {
            let date = formatter.date(from: created_at) ?? Date()
            return LoyaltyTransaction(date: date, description: description, points: points)
        }
    }
    
    func fallbackPartners() -> [LoyaltyPartner] {
        [
            LoyaltyPartner(id: UUID(), name: "Enso Sushi Burrito & Poke", description: "Healthy poke bowls", logoURL: nil, orderingURL: URL(string: "https://enso.ae")),
            LoyaltyPartner(id: UUID(), name: "DIP DASH", description: "Guilt-free fast casual", logoURL: nil, orderingURL: URL(string: "https://dipdash.com")),
            LoyaltyPartner(id: UUID(), name: "Poke & Co", description: "Crafted poke and salad", logoURL: nil, orderingURL: URL(string: "https://pokeandco.ae"))
        ]
    }
    
    func fallbackTransactions() -> [LoyaltyTransaction] {
        [
            LoyaltyTransaction(date: Date().addingTimeInterval(-86400 * 3), description: "Poke & Co order", points: +30),
            LoyaltyTransaction(date: Date().addingTimeInterval(-86400 * 7), description: "Enso Sushi visit", points: +45)
        ]
    }
}
