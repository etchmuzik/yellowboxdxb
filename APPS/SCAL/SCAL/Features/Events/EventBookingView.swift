import SwiftUI

struct EventBookingView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = EventBookingViewModel()
    @StateObject private var localization = LocalizationManager.shared
    
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                filterChips
                contentList
            }
            .padding()
            .navigationTitle(localization.localized("Community Events"))
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(localization.localized("Done")) { dismiss() }
                }
            }
        }
        .task { await viewModel.loadEvents() }
    }
    
    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button(action: { viewModel.selectedFilter = nil }) {
                    chipLabel(localization.localized("All"), isSelected: viewModel.selectedFilter == nil)
                }
                ForEach(CommunityEventType.allCases) { type in
                    Button(action: { viewModel.selectedFilter = type }) {
                        chipLabel(localizedType(type), isSelected: viewModel.selectedFilter == type)
                    }
                }
            }
        }
    }
    
    private var contentList: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredEvents.isEmpty {
                Text(localization.localized("No upcoming events"))
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.filteredEvents) { event in
                            eventCard(event)
                        }
                    }
                }
            }
        }
    }
    
    private func chipLabel(_ text: String, isSelected: Bool) -> some View {
        Text(text)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.calPrimary : Color.white.opacity(0.1))
            .foregroundColor(isSelected ? .white : .calTextPrimary)
            .clipShape(Capsule())
    }
    
    private func eventCard(_ event: CommunityEvent) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(event.name)
                .font(.headline)
            Text("\(formattedDate(event.startDate)) – \(event.location)")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text(event.tips)
                .font(.caption)
                .foregroundColor(.secondary)
            HStack {
                if let url = event.registrationURL {
                    Link(localization.localized("Register"), destination: url)
                        .buttonStyle(.borderedProminent)
                }
                Button(localization.localized("Add to SCAL Calendar")) {
                    // TODO: integrate actual calendar + push reminder
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
    
    private func localizedType(_ type: CommunityEventType) -> String {
        switch type {
        case .race: return localization.localized("Race")
        case .ride: return localization.localized("Ride")
        case .yoga: return localization.localized("Yoga")
        case .entertainment: return localization.localized("Entertainment")
        case .food: return localization.localized("Food")
        }
    }
}
