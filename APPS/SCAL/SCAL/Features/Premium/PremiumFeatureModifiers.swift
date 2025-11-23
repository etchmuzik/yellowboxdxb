//
//  PremiumFeatureModifiers.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  SwiftUI modifiers and view extensions for premium features
//

import SwiftUI

// MARK: - Premium Feature View Modifier

struct PremiumFeatureModifier: ViewModifier {
    let feature: PremiumFeature
    let showLock: Bool
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @State private var showingMiniPaywall = false
    
    func body(content: Content) -> some View {
        Group {
            if subscriptionManager.hasAccess(to: feature) {
                content
            } else {
                ZStack {
                    content
                        .blur(radius: showLock ? 8 : 0)
                        .disabled(true)
                    
                    if showLock {
                        PremiumLockOverlay(feature: feature)
                            .onTapGesture {
                                showingMiniPaywall = true
                            }
                    }
                }
                .sheet(isPresented: $showingMiniPaywall) {
                    if let requiredTier = subscriptionManager.requiresSubscription(for: feature) {
                        MiniPaywallView(
                            feature: feature,
                            requiredTier: requiredTier
                        )
                    }
                }
            }
        }
    }
}

// MARK: - Premium Lock Overlay

struct PremiumLockOverlay: View {
    let feature: PremiumFeature
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "lock.circle.fill")
                .font(.system(size: 50))
                .foregroundColor(.orange)
                .shadow(color: .orange.opacity(0.5), radius: 10)
            
            Text("Premium Feature")
                .font(.headline.bold())
                .foregroundColor(.white)
            
            Text(feature.rawValue)
                .font(.subheadline)
                .foregroundColor(.gray)
            
            Text("Tap to unlock")
                .font(.caption)
                .foregroundColor(.orange)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.black.opacity(0.9))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.orange, lineWidth: 2)
                )
        )
    }
}

// MARK: - Premium Badge

struct PremiumBadge: View {
    let tier: SubscriptionTier
    let size: BadgeSize
    
    enum BadgeSize {
        case small, medium, large
        
        var iconSize: CGFloat {
            switch self {
            case .small: return 12
            case .medium: return 16
            case .large: return 24
            }
        }
        
        var fontSize: Font {
            switch self {
            case .small: return .caption2
            case .medium: return .caption
            case .large: return .subheadline
            }
        }
        
        var padding: CGFloat {
            switch self {
            case .small: return 4
            case .medium: return 6
            case .large: return 8
            }
        }
    }
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: iconForTier)
                .font(.system(size: size.iconSize))
            
            Text(tier.rawValue.uppercased())
                .font(size.fontSize.bold())
        }
        .foregroundColor(colorForTier)
        .padding(.horizontal, size.padding)
        .padding(.vertical, size.padding / 2)
        .background(
            Capsule()
                .fill(colorForTier.opacity(0.2))
                .overlay(
                    Capsule()
                        .stroke(colorForTier, lineWidth: 1)
                )
        )
    }
    
    private var iconForTier: String {
        switch tier {
        case .free: return "person.circle"
        case .premium: return "star.circle.fill"
        case .pro: return "crown.fill"
        }
    }
    
    private var colorForTier: Color {
        switch tier {
        case .free: return .gray
        case .premium: return .blue
        case .pro: return .orange
        }
    }
}

// MARK: - Limited Access View

struct LimitedAccessView<Content: View, PremiumContent: View>: View {
    let feature: PremiumFeature
    let limit: Int
    let current: Int
    @ViewBuilder let content: () -> Content
    @ViewBuilder let premiumContent: () -> PremiumContent
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    
    var body: some View {
        VStack(spacing: 16) {
            if subscriptionManager.hasAccess(to: feature) {
                premiumContent()
            } else {
                // Show limited content
                content()
                
                // Show usage limit warning
                if current >= limit - 1 {
                    LimitReachedBanner(
                        feature: feature,
                        limit: limit,
                        current: current
                    )
                }
            }
        }
    }
}

struct LimitReachedBanner: View {
    let feature: PremiumFeature
    let limit: Int
    let current: Int
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    
    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.orange)
            
            VStack(alignment: .leading, spacing: 2) {
                Text("Free limit reached")
                    .font(.caption.bold())
                    .foregroundColor(.white)
                
                Text("\(current)/\(limit) \(feature.rawValue.lowercased()) used")
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Button("Upgrade") {
                subscriptionManager.showingPaywall = true
            }
            .font(.caption.bold())
            .foregroundColor(.black)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(Color.orange)
            )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.orange.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.orange.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

// MARK: - Premium Upsell Card

struct PremiumUpsellCard: View {
    let title: String
    let description: String
    let features: [PremiumFeature]
    let ctaText: String
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline.bold())
                        .foregroundColor(.white)
                    
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Image(systemName: "crown.fill")
                    .font(.title)
                    .foregroundColor(.yellow)
            }
            
            // Features
            VStack(alignment: .leading, spacing: 8) {
                ForEach(features, id: \.self) { feature in
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                        
                        Text(feature.rawValue)
                            .font(.caption)
                            .foregroundColor(.white)
                        
                        Spacer()
                    }
                }
            }
            
            // CTA Button
            Button(action: {
                subscriptionManager.showingPaywall = true
            }) {
                Text(ctaText)
                    .font(.subheadline.bold())
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: [.orange, .yellow],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.orange.opacity(0.2), Color.orange.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - View Extensions

extension View {
    func premiumFeature(_ feature: PremiumFeature, showLock: Bool = true) -> some View {
        modifier(PremiumFeatureModifier(feature: feature, showLock: showLock))
    }
    
    func requiresPremium<T: View>(
        _ feature: PremiumFeature,
        placeholder: @escaping () -> T
    ) -> some View {
        Group {
            if SubscriptionManager.shared.hasAccess(to: feature) {
                self
            } else {
                placeholder()
            }
        }
    }
    
    func premiumOnly() -> some View {
        opacity(SubscriptionManager.shared.isSubscribed ? 1.0 : 0.3)
            .disabled(!SubscriptionManager.shared.isSubscribed)
    }
}

// MARK: - Premium Status Bar

struct PremiumStatusBar: View {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    
    var body: some View {
        HStack {
            // Tier badge
            PremiumBadge(tier: subscriptionManager.currentTier, size: .small)
            
            Spacer()
            
            // Days remaining (if applicable)
            if subscriptionManager.isSubscribed,
               let daysRemaining = subscriptionManager.getRemainingDays() {
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption)
                    
                    Text("\(daysRemaining) days left")
                        .font(.caption)
                }
                .foregroundColor(daysRemaining <= 7 ? .orange : .gray)
            }
            
            // Upgrade button
            if !subscriptionManager.isSubscribed || subscriptionManager.currentTier != .pro {
                Button("Upgrade") {
                    subscriptionManager.showingPaywall = true
                }
                .font(.caption.bold())
                .foregroundColor(.orange)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(
            Color.gray.opacity(0.1)
        )
    }
}

// MARK: - Premium Feature List

struct PremiumFeatureList: View {
    let features: [PremiumFeature]
    let currentTier: SubscriptionTier
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(features, id: \.self) { feature in
                HStack {
                    Image(systemName: feature.icon)
                        .font(.title3)
                        .foregroundColor(hasFeature(feature) ? .orange : .gray)
                        .frame(width: 30)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(feature.rawValue)
                            .font(.subheadline.bold())
                            .foregroundColor(hasFeature(feature) ? .white : .gray)
                        
                        Text(feature.description)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    if hasFeature(feature) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    } else {
                        Image(systemName: "lock.fill")
                            .foregroundColor(.gray)
                            .font(.caption)
                    }
                }
                .opacity(hasFeature(feature) ? 1.0 : 0.6)
            }
        }
    }
    
    private func hasFeature(_ feature: PremiumFeature) -> Bool {
        currentTier.features.contains(feature)
    }
}

// MARK: - Premium Content Wrapper

struct PremiumContentWrapper<Content: View>: View {
    let requiredTier: SubscriptionTier
    let feature: PremiumFeature
    @ViewBuilder let content: () -> Content
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @State private var showingPaywall = false
    
    var body: some View {
        Group {
            if subscriptionManager.currentTier >= requiredTier {
                content()
            } else {
                VStack(spacing: 20) {
                    // Lock icon
                    Image(systemName: "lock.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.orange)
                    
                    // Title
                    Text("\(requiredTier.displayName) Required")
                        .font(.title2.bold())
                        .foregroundColor(.white)
                    
                    // Feature description
                    Text(feature.description)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    
                    // Upgrade button
                    Button("Upgrade to \(requiredTier.displayName)") {
                        showingPaywall = true
                    }
                    .font(.headline.bold())
                    .foregroundColor(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: [.orange, .yellow],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black.opacity(0.8))
            }
        }
        .sheet(isPresented: $showingPaywall) {
            PaywallView()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct PremiumFeatureModifiers_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            // Premium badge examples
            HStack {
                PremiumBadge(tier: .free, size: .small)
                PremiumBadge(tier: .premium, size: .medium)
                PremiumBadge(tier: .pro, size: .large)
            }
            
            // Premium upsell card
            PremiumUpsellCard(
                title: "Unlock AI Features",
                description: "Get personalized meal recommendations",
                features: [
                    .aiNutritionCoach,
                    .mealPlanning,
                    .advancedAnalytics
                ],
                ctaText: "Upgrade Now"
            )
            
            // Premium status bar
            PremiumStatusBar()
            
            Spacer()
        }
        .padding()
        .background(Color.black)
    }
}
#endif