import SwiftUI

struct CoachHomeView: View {
    @EnvironmentObject private var dataManager: MealDataManager
    @EnvironmentObject private var profileManager: UserProfileManager
    @EnvironmentObject private var appSettings: AppSettingsManager
    @StateObject private var coachVM = CoachViewModel()
    @StateObject private var localization = LocalizationManager.shared
    @State private var showingTelehealthScheduler = false
    @State private var showingEventBooking = false
    @State private var showingLoyalty = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                coachHeader
                insightsSection
                questSection
                modulesSection
                loyaltySection
                wearableSection
                conversationSection
            }
            .padding()
        }
        .background(SCALDesignSystem.Colors.background.ignoresSafeArea())
        .environment(\.layoutDirection, localization.language == .arabic ? .rightToLeft : .leftToRight)
        .onAppear {
            coachVM.bind(dataManager: dataManager, profile: profileManager, settings: appSettings)
        }
        .sheet(isPresented: $showingTelehealthScheduler) {
            TelehealthSchedulerView()
        }
        .sheet(isPresented: $showingEventBooking) {
            EventBookingView()
        }
    }
    
    private var coachHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(localization.localized("Hey")), \(coachVM.userName)")
                        .font(.title2.weight(.bold))
                        .foregroundColor(.calTextPrimary)
                    Text(coachVM.greeting)
                        .foregroundColor(.calTextSecondary)
                }
                Spacer()
                Image(systemName: "sparkles")
                    .font(.title)
                    .foregroundColor(.calPrimary)
            }
            
            HStack(spacing: 12) {
                statusPill(title: localization.localized("Calories"), value: "\(dataManager.totalCalories)/\(profileManager.calorieGoal)")
                statusPill(title: localization.localized("Hydration"), value: String(format: "%.1fL", HealthKitManager.shared.todaysWaterIntake))
                statusPill(title: localization.localized("Streak"), value: "\(coachVM.streakCount)d")
            }
        }
    }
    
    private func statusPill(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased())
                .font(.caption2)
                .foregroundColor(.calTextSecondary)
            Text(value)
                .font(.headline)
                .foregroundColor(.calTextPrimary)
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
    
    private var insightsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: localization.localized("Today's Insights"), actionTitle: localization.localized("Refresh")) {
                coachVM.fetchFreshInsights()
            }
            CoachInsightsFilterView(selected: $coachVM.selectedKind, localization: localization)
            if coachVM.isLoadingInsights {
                ProgressView()
            } else if coachVM.filteredInsights.isEmpty {
                Text(localization.localized("CoachEmptyInsights"))
                    .foregroundColor(.calTextSecondary)
            } else {
                ForEach(coachVM.filteredInsights) { insight in
                    CoachCardView(insight: insight)
                }
            }
        }
    }
    
    private var questSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: localization.localized("Active Quest"), actionTitle: localization.localized("View")) {
                coachVM.showAllQuests()
            }
            if let quest = coachVM.activeQuest {
                QuestCardView(quest: quest, action: coachVM.completeQuest)
            } else {
                QuestCardView(
                    quest: CoachQuest(
                        title: localization.localized("Hydrate Quest Title"),
                        description: localization.localized("Hydrate Quest Description"),
                        progress: min(1, HealthKitManager.shared.todaysWaterIntake / 1.5),
                        reward: localization.localized("Quest Reward")
                    ),
                    action: coachVM.completeQuest
                )
            }
        }
    }
    
    private var modulesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: localization.localized("Coach Modules"), actionTitle: localization.localized("View")) {
                coachVM.showAllQuests()
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(coachVM.experienceModules) { module in
                        CoachModuleTile(module: module) {
                            switch module.type {
                            case .telehealth:
                                showingTelehealthScheduler = true
                            case .events:
                                showingEventBooking = true
                            default:
                                break
                            }
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    private var loyaltySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: localization.localized("Loyalty"), actionTitle: localization.localized("View")) {
                showingLoyalty = true
            }
            Text(localization.localized("Track healthy restaurant rewards and order within SCAL."))
                .font(.caption)
                .foregroundColor(.calTextSecondary)
            Button(localization.localized("Open Loyalty Dashboard")) {
                showingLoyalty = true
            }
            .buttonStyle(.borderedProminent)
        }
        .sheet(isPresented: $showingLoyalty) {
            LoyaltyDashboardView()
        }
    }
    
    private var wearableSection: some View {
        WearableMetricsView()
    }
    
    private var conversationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: localization.localized("Ask Coach"), actionTitle: localization.localized("Clear")) {
                coachVM.clearConversation()
            }
            CoachConversationView(messages: coachVM.messages, isTyping: coachVM.isTyping)
            CoachInputBar(text: $coachVM.inputText, onSend: coachVM.sendMessage)
        }
    }
}

private struct CoachModuleTile: View {
    let module: CoachExperienceModule
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: module.icon)
                        .font(.title2)
                        .foregroundColor(.calPrimary)
                    Spacer()
                    Text(module.availability)
                        .font(.caption2)
                        .padding(6)
                        .background(Color.calPrimary.opacity(0.1), in: Capsule())
                }
                Text(module.title)
                    .font(.headline)
                    .foregroundColor(.calTextPrimary)
                Text(module.subtitle)
                    .font(.caption)
                    .foregroundColor(.calTextSecondary)
            }
            .padding(14)
            .frame(width: 200)
            .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(.plain)
    }
}

private struct SectionHeader: View {
    let title: String
    let actionTitle: String
    let action: () -> Void
    
    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundColor(.calTextPrimary)
            Spacer()
            Button(actionTitle, action: action)
                .font(.caption)
                .foregroundColor(.calPrimary)
        }
    }
}

private struct CoachInsightsFilterView: View {
    @Binding var selected: CoachInsight.Kind
    let localization: LocalizationManager
    
    var body: some View {
        Picker("", selection: $selected) {
            ForEach(CoachInsight.Kind.allCases) { kind in
                Text(localizedTitle(for: kind))
                    .tag(kind)
            }
        }
        .pickerStyle(.segmented)
    }
    
    private func localizedTitle(for kind: CoachInsight.Kind) -> String {
        switch kind {
        case .daily: return localization.localized("Daily")
        case .weekly: return localization.localized("Weekly")
        case .fasting: return localization.localized("Fasting Tips")
        case .local_food: return localization.localized("Local Favorites")
        }
    }
}
