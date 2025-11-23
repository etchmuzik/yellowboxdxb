//
//  LocalizationManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Internationalization and localization support
//

import SwiftUI
import Foundation

// MARK: - Localization Manager

@MainActor
class LocalizationManager: ObservableObject {
    static let shared = LocalizationManager()
    
    @Published var currentLanguage: Language = .english
    @Published var currentRegion: Region = .unitedStates
    
    // Supported languages
    enum Language: String, CaseIterable {
        case english = "en"
        case spanish = "es"
        case french = "fr"
        case german = "de"
        case italian = "it"
        case japanese = "ja"
        case chinese = "zh"
        case arabic = "ar"
        case hindi = "hi"
        case portuguese = "pt"
        
        var displayName: String {
            switch self {
            case .english: return "English"
            case .spanish: return "Español"
            case .french: return "Français"
            case .german: return "Deutsch"
            case .italian: return "Italiano"
            case .japanese: return "日本語"
            case .chinese: return "中文"
            case .arabic: return "العربية"
            case .hindi: return "हिन्दी"
            case .portuguese: return "Português"
            }
        }
        
        var locale: Locale {
            Locale(identifier: rawValue)
        }
    }
    
    // Supported regions
    enum Region: String, CaseIterable {
        case unitedStates = "US"
        case unitedKingdom = "GB"
        case canada = "CA"
        case australia = "AU"
        case india = "IN"
        case japan = "JP"
        case germany = "DE"
        case france = "FR"
        case spain = "ES"
        case mexico = "MX"
        case brazil = "BR"
        case uae = "AE"
        case saudiArabia = "SA"
        
        var displayName: String {
            let locale = Locale.current
            return locale.localizedString(forRegionCode: rawValue) ?? rawValue
        }
        
        var measurementSystem: MeasurementSystem {
            switch self {
            case .unitedStates:
                return .imperial
            default:
                return .metric
            }
        }
        
        var dateFormat: DateFormat {
            switch self {
            case .unitedStates, .canada:
                return .monthDayYear
            case .japan, .china:
                return .yearMonthDay
            default:
                return .dayMonthYear
            }
        }
        
        var currencyCode: String {
            switch self {
            case .unitedStates, .canada: return "USD"
            case .unitedKingdom: return "GBP"
            case .australia: return "AUD"
            case .india: return "INR"
            case .japan: return "JPY"
            case .germany, .france, .spain: return "EUR"
            case .mexico: return "MXN"
            case .brazil: return "BRL"
            case .uae, .saudiArabia: return "AED"
            }
        }
    }
    
    enum MeasurementSystem {
        case metric
        case imperial
    }
    
    enum DateFormat {
        case dayMonthYear
        case monthDayYear
        case yearMonthDay
    }
    
    init() {
        detectUserLanguageAndRegion()
    }
    
    // MARK: - Language Detection
    
    private func detectUserLanguageAndRegion() {
        // Detect language
        if let languageCode = Locale.current.language.languageCode?.identifier,
           let language = Language(rawValue: languageCode) {
            currentLanguage = language
        }
        
        // Detect region
        if let regionCode = Locale.current.region?.identifier,
           let region = Region(rawValue: regionCode) {
            currentRegion = region
        }
    }
    
    // MARK: - Localization Methods
    
    func localizedString(_ key: String, comment: String = "") -> String {
        NSLocalizedString(key, bundle: .main, comment: comment)
    }
    
    func localizedString(_ key: String, arguments: CVarArg...) -> String {
        String(format: localizedString(key), arguments: arguments)
    }
    
    // MARK: - Formatting
    
    func formatWeight(_ weight: Double) -> String {
        switch currentRegion.measurementSystem {
        case .metric:
            return String(format: "%.1f kg", weight)
        case .imperial:
            let pounds = weight * 2.20462
            return String(format: "%.1f lbs", pounds)
        }
    }
    
    func formatHeight(_ height: Double) -> String {
        switch currentRegion.measurementSystem {
        case .metric:
            return String(format: "%.0f cm", height)
        case .imperial:
            let totalInches = height / 2.54
            let feet = Int(totalInches / 12)
            let inches = Int(totalInches.truncatingRemainder(dividingBy: 12))
            return "\(feet)' \(inches)\""
        }
    }
    
    func formatDistance(_ meters: Double) -> String {
        switch currentRegion.measurementSystem {
        case .metric:
            if meters < 1000 {
                return String(format: "%.0f m", meters)
            } else {
                return String(format: "%.1f km", meters / 1000)
            }
        case .imperial:
            let miles = meters / 1609.34
            if miles < 1 {
                let feet = meters * 3.28084
                return String(format: "%.0f ft", feet)
            } else {
                return String(format: "%.1f mi", miles)
            }
        }
    }
    
    func formatVolume(_ milliliters: Double) -> String {
        switch currentRegion.measurementSystem {
        case .metric:
            if milliliters < 1000 {
                return String(format: "%.0f ml", milliliters)
            } else {
                return String(format: "%.1f L", milliliters / 1000)
            }
        case .imperial:
            let ounces = milliliters * 0.033814
            if ounces < 16 {
                return String(format: "%.1f oz", ounces)
            } else {
                let cups = ounces / 8
                return String(format: "%.1f cups", cups)
            }
        }
    }
    
    func formatDate(_ date: Date, style: DateFormatter.Style = .medium) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = style
        formatter.timeStyle = .none
        formatter.locale = currentLanguage.locale
        
        // Apply regional date format
        switch currentRegion.dateFormat {
        case .dayMonthYear:
            formatter.dateFormat = "dd/MM/yyyy"
        case .monthDayYear:
            formatter.dateFormat = "MM/dd/yyyy"
        case .yearMonthDay:
            formatter.dateFormat = "yyyy/MM/dd"
        }
        
        return formatter.string(from: date)
    }
    
    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currentRegion.currencyCode
        formatter.locale = currentLanguage.locale
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
    
    // MARK: - Settings
    
    func setLanguage(_ language: Language) {
        currentLanguage = language
        UserDefaults.standard.set(language.rawValue, forKey: "selectedLanguage")
        
        // Update app language
        Bundle.setLanguage(language.rawValue)
        
        // Post notification for UI updates
        NotificationCenter.default.post(name: .languageChanged, object: nil)
    }
    
    func setRegion(_ region: Region) {
        currentRegion = region
        UserDefaults.standard.set(region.rawValue, forKey: "selectedRegion")
        
        // Post notification for UI updates
        NotificationCenter.default.post(name: .regionChanged, object: nil)
    }
}

// MARK: - Bundle Extension for Language Switching

private var bundleKey: UInt8 = 0

extension Bundle {
    static func setLanguage(_ language: String) {
        defer {
            object_setClass(Bundle.main, AnyLanguageBundle.self)
        }
        
        objc_setAssociatedObject(Bundle.main, &bundleKey, Bundle(path: Bundle.main.path(forResource: language, ofType: "lproj") ?? ""), .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
}

class AnyLanguageBundle: Bundle {
    override func localizedString(forKey key: String, value: String?, table tableName: String?) -> String {
        guard let bundle = objc_getAssociatedObject(self, &bundleKey) as? Bundle else {
            return super.localizedString(forKey: key, value: value, table: tableName)
        }
        
        return bundle.localizedString(forKey: key, value: value, table: tableName)
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let languageChanged = Notification.Name("languageChanged")
    static let regionChanged = Notification.Name("regionChanged")
}

// MARK: - SwiftUI Environment

private struct LocalizationEnvironmentKey: EnvironmentKey {
    static let defaultValue = LocalizationManager.shared
}

extension EnvironmentValues {
    var localization: LocalizationManager {
        get { self[LocalizationEnvironmentKey.self] }
        set { self[LocalizationEnvironmentKey.self] = newValue }
    }
}

// MARK: - Localized String View Modifier

struct LocalizedText: ViewModifier {
    let key: String
    let arguments: [CVarArg]
    @Environment(\.localization) var localization
    
    func body(content: Content) -> some View {
        if arguments.isEmpty {
            Text(localization.localizedString(key))
        } else {
            Text(String(format: localization.localizedString(key), arguments: arguments))
        }
    }
}

extension View {
    func localized(_ key: String, _ arguments: CVarArg...) -> some View {
        self.modifier(LocalizedText(key: key, arguments: arguments))
    }
}