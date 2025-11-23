//
//  SubscriptionManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  StoreKit 2 subscription and premium features manager
//

import SwiftUI
import StoreKit

// MARK: - Subscription Models

enum SubscriptionTier: String, CaseIterable {
    case free = "Free"
    case premium = "Premium"
    case pro = "Pro"
    
    var displayName: String {
        switch self {
        case .free: return "SCAL Free"
        case .premium: return "SCAL Premium"
        case .pro: return "SCAL Pro"
        }
    }
    
    var monthlyPrice: String {
        switch self {
        case .free: return "$0"
        case .premium: return "$4.99"
        case .pro: return "$9.99"
        }
    }
    
    var yearlyPrice: String {
        switch self {
        case .free: return "$0"
        case .premium: return "$49.99"
        case .pro: return "$99.99"
        }
    }
    
    var features: [PremiumFeature] {
        switch self {
        case .free:
            return [
                .basicFoodScanning,
                .manualLogging,
                .basicAnalytics,
                .limitedHistory
            ]
        case .premium:
            return [
                .advancedFoodScanning,
                .voiceLogging,
                .advancedAnalytics,
                .unlimitedHistory,
                .mealPlanning,
                .exportData,
                .healthKitSync,
                .customGoals
            ]
        case .pro:
            return [
                .advancedFoodScanning,
                .voiceLogging,
                .advancedAnalytics,
                .unlimitedHistory,
                .mealPlanning,
                .exportData,
                .healthKitSync,
                .customGoals,
                .aiNutritionCoach,
                .multipleProfiles,
                .prioritySupport,
                .betaFeatures,
                .customThemes,
                .advancedAchievements
            ]
        }
    }
    
    var productIdentifier: String {
        switch self {
        case .free: return ""
        case .premium: return "com.scal.premium.monthly"
        case .pro: return "com.scal.pro.monthly"
        }
    }
    
    var yearlyProductIdentifier: String {
        switch self {
        case .free: return ""
        case .premium: return "com.scal.premium.yearly"
        case .pro: return "com.scal.pro.yearly"
        }
    }
}

enum PremiumFeature: String, CaseIterable {
    // Free features
    case basicFoodScanning = "Basic Food Scanning"
    case manualLogging = "Manual Food Logging"
    case basicAnalytics = "Basic Analytics (7 days)"
    case limitedHistory = "Limited History (30 days)"
    
    // Premium features
    case advancedFoodScanning = "AI-Powered Food Recognition"
    case voiceLogging = "Voice Food Logging"
    case advancedAnalytics = "Advanced Analytics & Insights"
    case unlimitedHistory = "Unlimited History"
    case mealPlanning = "AI Meal Planning"
    case exportData = "Export Data (CSV/PDF)"
    case healthKitSync = "Full HealthKit Integration"
    case customGoals = "Custom Nutrition Goals"
    
    // Pro features
    case aiNutritionCoach = "AI Nutrition Coach"
    case multipleProfiles = "Multiple User Profiles"
    case prioritySupport = "Priority Support"
    case betaFeatures = "Early Access to Beta Features"
    case customThemes = "Custom Themes & Icons"
    case advancedAchievements = "Exclusive Achievements"
    
    var icon: String {
        switch self {
        case .basicFoodScanning, .advancedFoodScanning: return "camera.fill"
        case .manualLogging: return "square.and.pencil"
        case .voiceLogging: return "mic.fill"
        case .basicAnalytics, .advancedAnalytics: return "chart.bar.fill"
        case .limitedHistory, .unlimitedHistory: return "clock.fill"
        case .mealPlanning: return "calendar"
        case .exportData: return "square.and.arrow.up"
        case .healthKitSync: return "heart.fill"
        case .customGoals: return "target"
        case .aiNutritionCoach: return "brain.head.profile"
        case .multipleProfiles: return "person.2.fill"
        case .prioritySupport: return "star.fill"
        case .betaFeatures: return "sparkles"
        case .customThemes: return "paintbrush.fill"
        case .advancedAchievements: return "trophy.fill"
        }
    }
    
    var description: String {
        switch self {
        case .basicFoodScanning: return "Scan barcodes and basic food items"
        case .advancedFoodScanning: return "AI recognizes any food from photos"
        case .manualLogging: return "Add foods manually from database"
        case .voiceLogging: return "Log meals using natural voice commands"
        case .basicAnalytics: return "View last 7 days of nutrition data"
        case .advancedAnalytics: return "Unlimited analytics with trends & insights"
        case .limitedHistory: return "Access last 30 days of meal history"
        case .unlimitedHistory: return "Access all your meal history forever"
        case .mealPlanning: return "Personalized AI-generated meal plans"
        case .exportData: return "Export your data in CSV or PDF format"
        case .healthKitSync: return "Sync all nutrition data with Apple Health"
        case .customGoals: return "Set personalized macro and calorie goals"
        case .aiNutritionCoach: return "24/7 AI coach for nutrition guidance"
        case .multipleProfiles: return "Track nutrition for multiple users"
        case .prioritySupport: return "Get help within 24 hours"
        case .betaFeatures: return "Try new features before everyone else"
        case .customThemes: return "Personalize app appearance"
        case .advancedAchievements: return "Unlock exclusive pro achievements"
        }
    }
}

struct SubscriptionOffer: Identifiable {
    let id = UUID()
    let tier: SubscriptionTier
    let duration: SubscriptionDuration
    let price: String
    let savings: String?
    let isMostPopular: Bool
    let trialDays: Int?
    
    enum SubscriptionDuration: String {
        case monthly = "Monthly"
        case yearly = "Yearly"
    }
    
    var pricePerMonth: String {
        switch (tier, duration) {
        case (.premium, .monthly): return "$4.99"
        case (.premium, .yearly): return "$4.17"
        case (.pro, .monthly): return "$9.99"
        case (.pro, .yearly): return "$8.33"
        default: return "$0"
        }
    }
}

// MARK: - Subscription Manager

@MainActor
public class SubscriptionManager: ObservableObject {
    public static let shared = SubscriptionManager()
    
    @Published var currentTier: SubscriptionTier = .free
    @Published var isSubscribed = false
    @Published var expirationDate: Date?
    @Published var availableProducts: [Product] = []
    @Published var purchasedProducts: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showingPaywall = false
    @Published var pendingFeature: PremiumFeature?
    
    // StoreKit 2
    private var updateListenerTask: Task<Void, Error>?
    private let productIdentifiers = [
        "com.scal.premium.monthly",
        "com.scal.premium.yearly",
        "com.scal.pro.monthly",
        "com.scal.pro.yearly"
    ]
    
    init() {
        updateListenerTask = listenForTransactions()
        Task {
            await loadProducts()
            await updateSubscriptionStatus()
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    // MARK: - StoreKit Integration
    
    func loadProducts() async {
        isLoading = true
        
        do {
            // Load products from App Store
            let products = try await Product.products(for: productIdentifiers)
            
            await MainActor.run {
                self.availableProducts = products.sorted { $0.price < $1.price }
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load products: \(error.localizedDescription)"
                self.isLoading = false
            }
        }
    }
    
    func purchase(_ product: Product) async throws -> Transaction? {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updateSubscriptionStatus()
            await transaction.finish()
            return transaction
            
        case .userCancelled:
            return nil
            
        case .pending:
            throw SubscriptionError.purchasePending
            
        @unknown default:
            throw SubscriptionError.unknownError
        }
    }
    
    func restorePurchases() async {
        isLoading = true
        
        do {
            try await AppStore.sync()
            await updateSubscriptionStatus()
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to restore purchases: \(error.localizedDescription)"
            }
        }
        
        await MainActor.run {
            self.isLoading = false
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw SubscriptionError.verificationFailed
        case .verified(let safe):
            return safe
        }
    }
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try await self.checkVerified(result)
                    await self.updateSubscriptionStatus()
                    await transaction.finish()
                } catch {
                    print("Transaction failed verification")
                }
            }
        }
    }
    
    func updateSubscriptionStatus() async {
        var highestTier: SubscriptionTier = .free
        var latestExpirationDate: Date?
        
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                
                if transaction.productID.contains("premium") {
                    highestTier = max(highestTier, .premium)
                } else if transaction.productID.contains("pro") {
                    highestTier = .pro
                }
                
                if let expirationDate = transaction.expirationDate,
                   expirationDate > Date() {
                    if latestExpirationDate == nil || expirationDate > latestExpirationDate! {
                        latestExpirationDate = expirationDate
                    }
                }
            } catch {
                print("Failed to check transaction")
            }
        }
        
        await MainActor.run {
            self.currentTier = highestTier
            self.isSubscribed = highestTier != .free
            self.expirationDate = latestExpirationDate
        }
    }
    
    // MARK: - Feature Access
    
    func hasAccess(to feature: PremiumFeature) -> Bool {
        return currentTier.features.contains(feature)
    }
    
    func requiresSubscription(for feature: PremiumFeature) -> SubscriptionTier? {
        if hasAccess(to: feature) {
            return nil
        }
        
        // Find minimum tier that includes this feature
        for tier in SubscriptionTier.allCases.reversed() {
            if tier.features.contains(feature) {
                return tier
            }
        }
        
        return .premium // Default to premium if not found
    }
    
    func requestFeatureAccess(_ feature: PremiumFeature) -> Bool {
        if hasAccess(to: feature) {
            return true
        } else {
            pendingFeature = feature
            showingPaywall = true
            return false
        }
    }
    
    // MARK: - Subscription Offers
    
    func getSubscriptionOffers() -> [SubscriptionOffer] {
        return [
            SubscriptionOffer(
                tier: .premium,
                duration: .monthly,
                price: "$4.99/month",
                savings: nil,
                isMostPopular: false,
                trialDays: 7
            ),
            SubscriptionOffer(
                tier: .premium,
                duration: .yearly,
                price: "$49.99/year",
                savings: "Save 17%",
                isMostPopular: true,
                trialDays: 7
            ),
            SubscriptionOffer(
                tier: .pro,
                duration: .monthly,
                price: "$9.99/month",
                savings: nil,
                isMostPopular: false,
                trialDays: 14
            ),
            SubscriptionOffer(
                tier: .pro,
                duration: .yearly,
                price: "$99.99/year",
                savings: "Save 17%",
                isMostPopular: false,
                trialDays: 14
            )
        ]
    }
    
    func getProduct(for offer: SubscriptionOffer) -> Product? {
        let identifier = offer.duration == .monthly ? 
            offer.tier.productIdentifier : 
            offer.tier.yearlyProductIdentifier
        
        return availableProducts.first { $0.id == identifier }
    }
    
    // MARK: - Usage Tracking
    
    func trackFeatureUsage(_ feature: PremiumFeature) {
        // Track which premium features users try to access
        // This can help optimize the paywall and pricing
        print("User tried to access: \(feature.rawValue)")
    }
    
    func getRemainingDays() -> Int? {
        guard let expirationDate = expirationDate else { return nil }
        let days = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
        return max(0, days)
    }
    
    func getFormattedPrice(for product: Product) -> String {
        return product.displayPrice
    }
}

// MARK: - Premium Feature Gate

struct PremiumFeatureGate {
    static func check(_ feature: PremiumFeature, action: @escaping () -> Void) -> Bool {
        let manager = SubscriptionManager.shared
        
        if manager.hasAccess(to: feature) {
            action()
            return true
        } else {
            manager.requestFeatureAccess(feature)
            return false
        }
    }
    
    static func wrap<T>(_ feature: PremiumFeature, 
                       freeVersion: T, 
                       premiumVersion: @escaping () -> T) -> T {
        let manager = SubscriptionManager.shared
        
        if manager.hasAccess(to: feature) {
            return premiumVersion()
        } else {
            return freeVersion
        }
    }
}

// MARK: - Errors

enum SubscriptionError: LocalizedError {
    case purchasePending
    case verificationFailed
    case unknownError
    
    var errorDescription: String? {
        switch self {
        case .purchasePending:
            return "Purchase is pending approval"
        case .verificationFailed:
            return "Purchase verification failed"
        case .unknownError:
            return "An unknown error occurred"
        }
    }
}

// MARK: - Helper Extensions

extension SubscriptionTier: Comparable {
    static func < (lhs: SubscriptionTier, rhs: SubscriptionTier) -> Bool {
        let order: [SubscriptionTier] = [.free, .premium, .pro]
        return order.firstIndex(of: lhs)! < order.firstIndex(of: rhs)!
    }
}