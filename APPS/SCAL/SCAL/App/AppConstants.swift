//
//  AppConstants.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  API configuration and app constants
//

import Foundation

struct AppConstants {
    private static let fallbackSupabaseURL = "http://supabasekong-q8cog8osg88wcocssgcgs0co.31.97.59.237.sslip.io"
    private static let fallbackSupabaseAnonKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2Mzg3MTY2MCwiZXhwIjo0OTE5NTQ1MjYwLCJyb2xlIjoiYW5vbiJ9.tGYT7PNtpzwlWDEU7VMjQ42OMyKiKSwuhjJfgV8nxBs"
    // FREE APIs - No cost!
    static var usdaAPIKey: String {
        // First try Info.plist, then fallback to hardcoded key
        if let plistKey = Bundle.main.infoDictionary?["USDA_API_KEY"] as? String, !plistKey.isEmpty {
            return plistKey
        }
        // Fallback to known working API key
        return "CPt7IdjJjoGtkcCwdlEdPm7cDgfbxHL120zZpHo2"
    }
    static let usdaBaseURL = "https://api.nal.usda.gov/fdc/v1/"

    // Alternative FREE APIs
    static let openFoodFactsURL = "https://world.openfoodfacts.org/api/v0/"

    static var googleVisionAPIKey: String {
        Bundle.main.infoDictionary?["GOOGLE_VISION_API_KEY"] as? String ?? ""
    }
    static var openAIApiKey: String {
        Bundle.main.infoDictionary?["OPENAI_API_KEY"] as? String ?? ""
    }
    static var whisperApiKey: String {
        Bundle.main.infoDictionary?["WHISPER_API_KEY"] as? String ?? ""
    }

    static var firebaseCoachEndpoint: String? {
        Bundle.main.infoDictionary?["FIREBASE_COACH_ENDPOINT"] as? String
    }
    
    static var supabaseURL: String? {
        if let envValue = ProcessInfo.processInfo.environment["SUPABASE_URL"], !envValue.isEmpty {
            return envValue
        }
        if let plistValue = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String, !plistValue.isEmpty {
            return plistValue
        }
        return fallbackSupabaseURL
    }
    
    static var supabaseAnonKey: String? {
        if let envValue = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"], !envValue.isEmpty {
            return envValue
        }
        if let plistValue = Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String, !plistValue.isEmpty {
            return plistValue
        }
        return fallbackSupabaseAnonKey
    }

    // App Configuration
    static let animationDuration: Double = 0.3
    static let hapticEnabled = true
    static let targetFPS = 120

    // Cache Configuration
    static let cacheExpirationDays = 7
    static let maxCachedFoods = 1000
}
