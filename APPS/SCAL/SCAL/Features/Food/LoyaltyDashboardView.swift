import SwiftUI

struct LoyaltyDashboardView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = LoyaltyDashboardViewModel()
    @StateObject private var localization = LocalizationManager.shared
    
    var body: some View {
        NavigationView {
            List {
                accountSection
                partnersSection
                transactionsSection
            }
            .navigationTitle(localization.localized("Loyalty"))
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(localization.localized("Done")) { dismiss() }
                }
            }
        }
        .task { await viewModel.loadData() }
    }
    
    private var accountSection: some View {
        Section(header: Text(localization.localized("Your Rewards"))) {
            if let account = viewModel.account {
                VStack(alignment: .leading, spacing: 8) {
                    Text(account.partner.name)
                        .font(.headline)
                    Text("\(localization.localized("Points")): \(account.points)")
                    Text("Tier: \(account.tier)")
                }
            } else {
                Text(localization.localized("Connect with a partner to start earning."))
            }
        }
    }
    
    private var partnersSection: some View {
        Section(header: Text(localization.localized("Partners"))) {
            ForEach(viewModel.partners) { partner in
                VStack(alignment: .leading, spacing: 6) {
                    Text(partner.name).font(.headline)
                    Text(partner.description).font(.caption)
                    if let url = partner.orderingURL {
                        Link(localization.localized("Order Now"), destination: url)
                    }
                }
            }
        }
    }
    
    private var transactionsSection: some View {
        Section(header: Text(localization.localized("Recent Activity"))) {
            ForEach(viewModel.transactions) { txn in
                VStack(alignment: .leading) {
                    Text(txn.description)
                    Text(formattedDate(txn.date))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}
