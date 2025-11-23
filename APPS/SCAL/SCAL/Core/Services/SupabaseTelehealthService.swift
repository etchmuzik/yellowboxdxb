import Foundation

struct TelehealthProvider: Identifiable, Equatable, Hashable {
    let id: UUID
    let name: String
    let specialty: String
    let avatarURL: URL?
    let languages: [String]
    let timezone: String
}

struct TelehealthTimeslot: Identifiable, Equatable {
    let id = UUID()
    let start: Date
    let end: Date
    let isVirtual: Bool
}

struct TelehealthAppointmentRequest: Codable {
    let providerId: UUID
    let start: Date
    let end: Date
    let notes: String
    let consentAccepted: Bool
}

final class SupabaseTelehealthService {
    static let shared = SupabaseTelehealthService()
    
    private let clientProvider: SupabaseClientProvider
    private let isoFormatter: ISO8601DateFormatter
    private let fallbackProviders: [TelehealthProvider]
    
    init(clientProvider: SupabaseClientProvider = .shared) {
        self.clientProvider = clientProvider
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        self.isoFormatter = formatter
        self.fallbackProviders = [
            TelehealthProvider(id: UUID(), name: "Dr. Sara Al Hosani", specialty: "Clinical Nutrition", avatarURL: nil, languages: ["English", "Arabic"], timezone: "Asia/Dubai"),
            TelehealthProvider(id: UUID(), name: "Dr. Omar Al Haddad", specialty: "Sports Dietitian", avatarURL: nil, languages: ["English"], timezone: "Asia/Dubai")
        ]
    }
    
    func fetchProviders() async -> [TelehealthProvider] {
        guard let client = clientProvider.makeRESTClient() else {
            return fallbackProviders
        }
        do {
            let records: [ProviderRecord] = try await client.get(
                "telehealth_providers",
                query: [
                    URLQueryItem(name: "select", value: "id,name,specialty,avatar_url,languages,timezone"),
                    URLQueryItem(name: "order", value: "name")
                ]
            )
            return records.map { $0.toDomain() }
        } catch {
            print("SupabaseTelehealthService.fetchProviders error: \(error)")
            return fallbackProviders
        }
    }
    
    func fetchTimeslots(for providerId: UUID, on date: Date) async -> [TelehealthTimeslot] {
        guard let client = clientProvider.makeRESTClient() else {
            return fallbackTimeslots(for: date)
        }
        do {
            let records: [TimeslotRecord] = try await client.get(
                "telehealth_timeslots",
                query: [
                    URLQueryItem(name: "select", value: "id,start_time,end_time,is_virtual"),
                    URLQueryItem(name: "provider_id", value: "eq.\(providerId.uuidString)"),
                    URLQueryItem(name: "order", value: "start_time")
                ]
            )
            let calendar = Calendar.current
            return records
                .compactMap { $0.toDomain(formatter: isoFormatter) }
                .filter { calendar.isDate($0.start, inSameDayAs: date) }
        } catch {
            print("SupabaseTelehealthService.fetchTimeslots error: \(error)")
            return fallbackTimeslots(for: date)
        }
    }
    
    func bookAppointment(_ request: TelehealthAppointmentRequest) async throws {
        guard request.consentAccepted else {
            throw NSError(domain: "Telehealth", code: 400, userInfo: [NSLocalizedDescriptionKey: "Consent is required"])
        }
        if let client = clientProvider.makeRESTClient() {
            let payload = [AppointmentInsert(
                provider_id: request.providerId,
                start_time: isoFormatter.string(from: request.start),
                end_time: isoFormatter.string(from: request.end),
                notes: request.notes,
                consent_accepted: request.consentAccepted
            )]
            try await client.insert("telehealth_appointments", payload: payload)
        } else {
            try await Task.sleep(nanoseconds: 300_000_000)
        }
    }
}

private extension SupabaseTelehealthService {
    struct ProviderRecord: Decodable {
        let id: UUID
        let name: String
        let specialty: String
        let avatar_url: String?
        let languages: [String]?
        let timezone: String?
        
        func toDomain() -> TelehealthProvider {
            TelehealthProvider(
                id: id,
                name: name,
                specialty: specialty,
                avatarURL: avatar_url.flatMap(URL.init(string:)),
                languages: languages ?? ["English"],
                timezone: timezone ?? "Asia/Dubai"
            )
        }
    }
    
    struct TimeslotRecord: Decodable {
        let start_time: String
        let end_time: String
        let is_virtual: Bool?
        
        func toDomain(formatter: ISO8601DateFormatter) -> TelehealthTimeslot? {
            guard let startDate = formatter.date(from: start_time),
                  let endDate = formatter.date(from: end_time) else { return nil }
            return TelehealthTimeslot(start: startDate, end: endDate, isVirtual: is_virtual ?? true)
        }
    }
    
    struct AppointmentInsert: Encodable {
        let provider_id: UUID
        let start_time: String
        let end_time: String
        let notes: String
        let consent_accepted: Bool
    }
    
    func fallbackTimeslots(for date: Date) -> [TelehealthTimeslot] {
        let calendar = Calendar.current
        let base = calendar.startOfDay(for: date)
        return (8...14).map { hour in
            let start = calendar.date(byAdding: .hour, value: hour, to: base) ?? date
            let end = calendar.date(byAdding: .minute, value: 30, to: start) ?? start
            return TelehealthTimeslot(start: start, end: end, isVirtual: true)
        }
    }
}
