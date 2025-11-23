import Foundation

struct SupabaseRESTClient {
    enum RESTError: Error, LocalizedError {
        case invalidURL
        case invalidResponse
        case requestFailed(status: Int, message: String?)
        
        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "Supabase REST client received an invalid URL."
            case .invalidResponse:
                return "Supabase REST client received an invalid response."
            case let .requestFailed(status, message):
                if let message, !message.isEmpty {
                    return "Supabase request failed with status \(status): \(message)"
                }
                return "Supabase request failed with status \(status)."
            }
        }
    }
    
    private let baseURL: URL
    private let anonKey: String
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    init(baseURL: URL, anonKey: String, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.anonKey = anonKey
        self.session = session
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder
    }
    
    func get<T: Decodable>(_ path: String, query: [URLQueryItem]? = nil) async throws -> T {
        let data = try await send(method: "GET", path: path, query: query)
        return try decoder.decode(T.self, from: data)
    }
    
    func insert<T: Encodable>(_ path: String, payload: T, returningRepresentation: Bool = false) async throws {
        let data = try encoder.encode(payload)
        _ = try await send(
            method: "POST",
            path: path,
            query: nil,
            body: data,
            preferRepresentation: returningRepresentation
        )
    }
    
    func delete(_ path: String, query: [URLQueryItem]? = nil) async throws {
        _ = try await send(method: "DELETE", path: path, query: query)
    }
    
    @discardableResult
    private func send(
        method: String,
        path: String,
        query: [URLQueryItem]? = nil,
        body: Data? = nil,
        preferRepresentation: Bool = false
    ) async throws -> Data {
        guard var components = URLComponents(
            url: restBaseURL(for: path),
            resolvingAgainstBaseURL: false
        ) else {
            throw RESTError.invalidURL
        }
        components.queryItems = query
        guard let url = components.url else { throw RESTError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if preferRepresentation {
            request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        }
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            if !preferRepresentation {
                request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
            }
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw RESTError.invalidResponse
        }
        guard 200..<300 ~= http.statusCode else {
            let message = String(data: data, encoding: .utf8)
            throw RESTError.requestFailed(status: http.statusCode, message: message)
        }
        return data
    }
    
    private func restBaseURL(for path: String) -> URL {
        let trimmedPath = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return baseURL
            .appendingPathComponent("rest")
            .appendingPathComponent("v1")
            .appendingPathComponent(trimmedPath)
    }
}
