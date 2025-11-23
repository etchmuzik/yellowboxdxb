//
//  SubscriptionTypes.swift
//  SCAL
//
//  Subscription types and manager - consolidated for visibility
//

import SwiftUI
import StoreKit

// MARK: - Subscription Tier

public enum SubscriptionTier: String, CaseIterable {
    case free = "Free"
    case premium = "Premium"
    case pro = "Pro"
    
    public var displayName: String {
        switch self {
        case .free: return "SCAL Free"
        case .premium: return "SCAL Premium"
        case .pro: return "SCAL Pro"
        }
    }
    
    public var monthlyPrice: String {
        switch self {
        case .free: return "$0"
        case .premium: return "$4.99"
        case .pro: return "$9.99"
        }
    }
    
    public var features: Set<PremiumFeature> {
        switch self {
        case .free:
            return [.basicFoodScanning, .manualEntry, .basicHistory]
        case .premium:
            return [.basicFoodScanning, .manualEntry, .basicHistory,
                   .advancedFoodScanning, .unlimitedHistory, .nutritionInsights,
                   .mealPlanning, .exportData, .customGoals, .weeklyReports]
        case .pro:
            return Set(PremiumFeature.allCases) // All features
        }
    }
}

// MARK: - Premium Features

public enum PremiumFeature: String, CaseIterable {
    // Free features
    case basicFoodScanning = "Basic Food Scanning"
    case manualEntry = "Manual Entry"
    case basicHistory = "7-Day History"
    
    // Premium features
    case advancedFoodScanning = "Multi-Food Scanning"
    case unlimitedHistory = "Unlimited History"
    case nutritionInsights = "Nutrition Insights"
    case mealPlanning = "Meal Planning"
    case exportData = "Export Data"
    case customGoals = "Custom Goals"
    case weeklyReports = "Weekly Reports"
    
    // Pro features
    case aiNutritionCoach = "AI Nutrition Coach"
    case advancedAnalytics = "Advanced Analytics"
    case prioritySupport = "Priority Support"
    case betaFeatures = "Beta Features"
    case familySharing = "Family Sharing"
    
    public var icon: String {
        switch self {
        case .basicFoodScanning, .advancedFoodScanning: return "camera.fill"
        case .manualEntry: return "pencil"
        case .basicHistory, .unlimitedHistory: return "clock.fill"
        case .nutritionInsights: return "chart.pie.fill"
        case .mealPlanning: return "calendar"
        case .exportData: return "square.and.arrow.up"
        case .customGoals: return "target"
        case .weeklyReports: return "doc.text.fill"
        case .aiNutritionCoach: return "brain"
        case .advancedAnalytics: return "chart.xyaxis.line"
        case .prioritySupport: return "star.fill"
        case .betaFeatures: return "sparkles"
        case .familySharing: return "person.2.fill"
        }
    }
}

// MARK: - Simple Subscription Manager

@MainActor
public class SubscriptionManager: ObservableObject {
    public static let shared = SubscriptionManager()
    
    @Published public var currentTier: SubscriptionTier = .free
    @Published public var isProcessingPurchase = false
    @Published public var products: [Product] = []
    @Published public var expirationDate: Date?
    
    private init() {
        Task {
            await loadProducts()
        }
    }
    
    public func hasAccess(to feature: PremiumFeature) -> Bool {
        currentTier.features.contains(feature)
    }
    
    public func showPaywall() {
        // Implement paywall presentation
    }
    
    public func requestFeatureAccess(_ feature: PremiumFeature) {
        if !hasAccess(to: feature) {
            showPaywall()
        }
    }
    
    private func loadProducts() async {
        // Simplified product loading
        // In production, would load from StoreKit
    }
}
