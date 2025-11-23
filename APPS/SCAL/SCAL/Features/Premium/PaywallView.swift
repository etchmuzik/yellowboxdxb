//
//  PaywallView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Premium subscription paywall interface
//

import SwiftUI
import StoreKit

struct PaywallView: View {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var selectedOffer: SubscriptionOffer?
    @State private var isPurchasing = false
    @State private var showingError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection
                    
                    // Feature comparison
                    if let pendingFeature = subscriptionManager.pendingFeature {
                        pendingFeatureSection(pendingFeature)
                    }
                    
                    // Subscription tiers
                    subscriptionTiersSection
                    
                    // Selected offer details
                    if let selectedOffer = selectedOffer {
                        offerDetailsSection(selectedOffer)
                    }
                    
                    // CTA Button
                    ctaButtonSection
                    
                    // Legal text
                    legalTextSection
                }
                .padding()
            }
            .background(
                LinearGradient(
                    colors: [Color.black, Color.black.opacity(0.9)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.orange)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Restore") {
                        Task {
                            await subscriptionManager.restorePurchases()
                        }
                    }
                    .foregroundColor(.orange)
                    .disabled(subscriptionManager.isLoading)
                }
            }
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .onAppear {
            // Select most popular offer by default
            if selectedOffer == nil {
                selectedOffer = subscriptionManager.getSubscriptionOffers()
                    .first { $0.isMostPopular }
            }
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(spacing: 16) {
            Image(systemName: "crown.fill")
                .font(.system(size: 60))
                .foregroundColor(.yellow)
                .shadow(color: .yellow.opacity(0.5), radius: 10)
            
            Text("Unlock Premium")
                .font(.largeTitle.bold())
                .foregroundColor(.white)
            
            Text("Get the most out of SCAL with advanced features")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .padding(.top)
    }
    
    // MARK: - Pending Feature Section
    
    private func pendingFeatureSection(_ feature: PremiumFeature) -> some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "lock.fill")
                    .foregroundColor(.orange)
                
                Text("Premium Feature Required")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            HStack {
                Image(systemName: feature.icon)
                    .font(.title2)
                    .foregroundColor(.orange)
                    .frame(width: 40)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(feature.rawValue)
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                    
                    Text(feature.description)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
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
    
    // MARK: - Subscription Tiers Section
    
    private var subscriptionTiersSection: some View {
        VStack(spacing: 16) {
            Text("Choose Your Plan")
                .font(.headline)
                .foregroundColor(.white)
            
            ForEach(subscriptionManager.getSubscriptionOffers()) { offer in
                SubscriptionOfferCard(
                    offer: offer,
                    isSelected: selectedOffer?.id == offer.id,
                    onTap: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedOffer = offer
                        }
                    }
                )
            }
        }
    }
    
    // MARK: - Offer Details Section
    
    private func offerDetailsSection(_ offer: SubscriptionOffer) -> some View {
        VStack(spacing: 16) {
            HStack {
                Text("What's Included")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Spacer()
                
                Text(offer.tier.displayName)
                    .font(.caption.bold())
                    .foregroundColor(.orange)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(Color.orange.opacity(0.2))
                    )
            }
            
            // Feature list
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                ForEach(offer.tier.features, id: \.self) { feature in
                    FeatureRow(feature: feature, included: true)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.gray.opacity(0.1))
        )
    }
    
    // MARK: - CTA Button Section
    
    private var ctaButtonSection: some View {
        VStack(spacing: 12) {
            if let selectedOffer = selectedOffer,
               let product = subscriptionManager.getProduct(for: selectedOffer) {
                Button(action: {
                    Task {
                        await purchaseSubscription(product)
                    }
                }) {
                    VStack(spacing: 4) {
                        if isPurchasing {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .black))
                        } else {
                            Text(getButtonText(for: selectedOffer))
                                .font(.headline.bold())
                            
                            if let trialDays = selectedOffer.trialDays, trialDays > 0 {
                                Text("\(trialDays)-day free trial")
                                    .font(.caption)
                            }
                        }
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [.orange, .yellow],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(16)
                }
                .disabled(isPurchasing || subscriptionManager.isLoading)
            }
            
            Text("Cancel anytime in Settings")
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
    
    // MARK: - Legal Text Section
    
    private var legalTextSection: some View {
        VStack(spacing: 8) {
            Text("Subscriptions auto-renew unless cancelled 24 hours before the end of the current period.")
                .font(.caption2)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
            
            HStack(spacing: 16) {
                Button("Terms of Use") {
                    // Open terms
                }
                .font(.caption2)
                .foregroundColor(.blue)
                
                Button("Privacy Policy") {
                    // Open privacy policy
                }
                .font(.caption2)
                .foregroundColor(.blue)
            }
        }
        .padding(.top)
    }
    
    // MARK: - Helper Functions
    
    private func getButtonText(for offer: SubscriptionOffer) -> String {
        if let trialDays = offer.trialDays, trialDays > 0 {
            return "Start Free Trial"
        } else {
            return "Subscribe for \(offer.price)"
        }
    }
    
    private func purchaseSubscription(_ product: Product) async {
        isPurchasing = true
        
        do {
            let transaction = try await subscriptionManager.purchase(product)
            
            await MainActor.run {
                isPurchasing = false
                
                if transaction != nil {
                    // Success - dismiss paywall
                    dismiss()
                }
            }
        } catch {
            await MainActor.run {
                isPurchasing = false
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Supporting Views

struct SubscriptionOfferCard: View {
    let offer: SubscriptionOffer
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(offer.tier.displayName)
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            if offer.isMostPopular {
                                Text("MOST POPULAR")
                                    .font(.caption2.bold())
                                    .foregroundColor(.black)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(
                                        Capsule()
                                            .fill(Color.orange)
                                    )
                            }
                        }
                        
                        Text(offer.duration.rawValue)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(offer.price)
                            .font(.title3.bold())
                            .foregroundColor(.white)
                        
                        if let savings = offer.savings {
                            Text(savings)
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                        
                        Text("\(offer.pricePerMonth)/mo")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                }
                .padding()
                
                // Selection indicator
                if isSelected {
                    Rectangle()
                        .fill(Color.orange)
                        .frame(height: 3)
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.orange.opacity(0.1) : Color.gray.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.orange : Color.clear, lineWidth: 2)
                    )
            )
        }
    }
}

struct FeatureRow: View {
    let feature: PremiumFeature
    let included: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: included ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(included ? .green : .red.opacity(0.5))
                .font(.caption)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(feature.rawValue)
                    .font(.caption2.bold())
                    .foregroundColor(included ? .white : .gray)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
            }
            
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Feature Comparison View

struct FeatureComparisonView: View {
    let features: [PremiumFeature] = PremiumFeature.allCases
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Compare Plans")
                .font(.headline)
                .foregroundColor(.white)
            
            // Header row
            HStack {
                Text("Feature")
                    .font(.caption.bold())
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                ForEach(SubscriptionTier.allCases, id: \.self) { tier in
                    Text(tier.rawValue)
                        .font(.caption.bold())
                        .foregroundColor(tier == .pro ? .orange : .gray)
                        .frame(width: 60)
                }
            }
            
            Divider()
                .background(Color.gray.opacity(0.3))
            
            // Feature rows
            ForEach(features, id: \.self) { feature in
                HStack {
                    HStack {
                        Image(systemName: feature.icon)
                            .font(.caption)
                            .foregroundColor(.orange)
                            .frame(width: 20)
                        
                        Text(feature.rawValue)
                            .font(.caption2)
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    ForEach(SubscriptionTier.allCases, id: \.self) { tier in
                        Image(systemName: tier.features.contains(feature) ? "checkmark" : "minus")
                            .font(.caption)
                            .foregroundColor(tier.features.contains(feature) ? .green : .gray.opacity(0.3))
                            .frame(width: 60)
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.gray.opacity(0.1))
        )
    }
}

// MARK: - Mini Paywall for Feature Gates

struct MiniPaywallView: View {
    let feature: PremiumFeature
    let requiredTier: SubscriptionTier
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 20) {
            // Icon
            Image(systemName: "lock.circle.fill")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            
            // Title
            Text("Premium Feature")
                .font(.title2.bold())
                .foregroundColor(.white)
            
            // Feature info
            VStack(spacing: 8) {
                Image(systemName: feature.icon)
                    .font(.title)
                    .foregroundColor(.orange)
                
                Text(feature.rawValue)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(feature.description)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.orange.opacity(0.1))
            )
            
            // Required tier
            Text("Requires \(requiredTier.displayName)")
                .font(.caption)
                .foregroundColor(.gray)
            
            // CTA buttons
            VStack(spacing: 12) {
                Button("Unlock with \(requiredTier.displayName)") {
                    SubscriptionManager.shared.showingPaywall = true
                    dismiss()
                }
                .font(.headline.bold())
                .foregroundColor(.black)
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    LinearGradient(
                        colors: [.orange, .yellow],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
                
                Button("Maybe Later") {
                    dismiss()
                }
                .font(.subheadline)
                .foregroundColor(.gray)
            }
        }
        .padding()
        .frame(maxWidth: 350)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.black)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.orange.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

// MARK: - Preview

#if DEBUG
struct PaywallView_Previews: PreviewProvider {
    static var previews: some View {
        PaywallView()
    }
}
#endif