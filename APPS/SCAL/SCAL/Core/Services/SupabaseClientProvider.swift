import Foundation
#if canImport(Supabase)
import Supabase
#endif

protocol SupabaseClientProviding: AnyObject {
    var restURL: URL? { get }
    var anonKey: String? { get }
    var isConfigured: Bool { get }
#if canImport(Supabase)
    var client: SupabaseClient? { get }
#endif
}

final class SupabaseClientProvider: SupabaseClientProviding {
    static let shared = SupabaseClientProvider()
    
    private(set) var restURL: URL?
    private(set) var anonKey: String?
    var isConfigured: Bool { restURL != nil && anonKey != nil }
    
#if canImport(Supabase)
    private(set) var client: SupabaseClient?
#endif
    
    private init() {
        configureClientIfPossible()
    }
    
    private func configureClientIfPossible() {
        guard let urlString = AppConstants.supabaseURL,
              let key = AppConstants.supabaseAnonKey,
              let url = URL(string: urlString) else {
            return
        }
        restURL = url
        anonKey = key
#if canImport(Supabase)
        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: key
        )
#endif
    }
    
    func makeRESTClient() -> SupabaseRESTClient? {
        guard let url = restURL, let key = anonKey else { return nil }
        return SupabaseRESTClient(baseURL: url, anonKey: key)
    }
}
