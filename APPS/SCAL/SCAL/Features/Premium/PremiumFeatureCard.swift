//
//  PremiumFeatureCard.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Card component for displaying premium features
//

import SwiftUI

struct PremiumFeatureCard: View {
    let feature: PremiumFeature
    let isLocked: Bool
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                // Feature icon
                Image(systemName: feature.icon)
                    .font(.title2)
                    .foregroundColor(isLocked ? .gray : .orange)
                    .frame(width: 40, height: 40)
                
                // Lock overlay
                if isLocked {
                    Image(systemName: "lock.fill")
                        .font(.caption2)
                        .foregroundColor(.white)
                        .padding(4)
                        .background(Circle().fill(Color.orange))
                        .offset(x: 20, y: 20)
                }
            }
            
            VStack(spacing: 4) {
                Text(feature.rawValue)
                    .font(.caption.bold())
                    .foregroundColor(isLocked ? .gray : .primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                
                if isLocked {
                    Text("Premium")
                        .font(.caption2)
                        .foregroundColor(.orange)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(UIColor.secondarySystemGroupedBackground))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isLocked ? Color.orange.opacity(0.3) : Color.clear, lineWidth: 1)
                )
        )
        .opacity(isLocked ? 0.8 : 1.0)
        .onTapGesture {
            if isLocked {
                subscriptionManager.requestFeatureAccess(feature)
            }
        }
    }
}

// MARK: - Mini Premium Feature View

struct MiniPremiumFeature: View {
    let feature: PremiumFeature
    let isUnlocked: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: feature.icon)
                .font(.caption)
                .foregroundColor(isUnlocked ? .green : .gray)
            
            Text(feature.rawValue)
                .font(.caption)
                .foregroundColor(isUnlocked ? .primary : .secondary)
            
            Spacer()
            
            if isUnlocked {
                Image(systemName: "checkmark.circle.fill")
                    .font(.caption)
                    .foregroundColor(.green)
            } else {
                Image(systemName: "lock.fill")
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Premium Feature Section Header

struct PremiumSectionHeader: View {
    let title: String
    let subtitle: String?
    let isPremium: Bool
    
    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if isPremium {
                PremiumBadge(tier: .premium, size: .small)
            }
        }
    }
}

// MARK: - Premium Feature Grid

struct PremiumFeatureGrid: View {
    let features: [PremiumFeature]
    let columns: Int
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    
    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible()), count: columns)
    }
    
    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: 12) {
            ForEach(features, id: \.self) { feature in
                let isUnlocked = subscriptionManager.hasAccess(to: feature)
                PremiumFeatureCard(
                    feature: feature,
                    isLocked: !isUnlocked
                )
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
struct PremiumFeatureCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            // Single card examples
            HStack {
                PremiumFeatureCard(feature: .voiceLogging, isLocked: true)
                PremiumFeatureCard(feature: .aiNutritionCoach, isLocked: false)
            }
            .padding()
            
            // Mini feature list
            VStack(alignment: .leading) {
                PremiumSectionHeader(
                    title: "Premium Features",
                    subtitle: "Unlock with subscription",
                    isPremium: true
                )
                
                VStack(alignment: .leading) {
                    MiniPremiumFeature(feature: .voiceLogging, isUnlocked: true)
                    MiniPremiumFeature(feature: .mealPlanning, isUnlocked: false)
                    MiniPremiumFeature(feature: .exportData, isUnlocked: false)
                }
            }
            .padding()
            .background(Color(UIColor.secondarySystemGroupedBackground))
            .cornerRadius(12)
            .padding()
            
            Spacer()
        }
        .background(Color(UIColor.systemGroupedBackground))
    }
}
#endif