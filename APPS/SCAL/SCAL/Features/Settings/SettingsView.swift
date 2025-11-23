import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject private var appSettings: AppSettingsManager
    @EnvironmentObject private var notificationManager: MealNotificationManager
    @StateObject private var localization = LocalizationManager.shared
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    
    @State private var showingLanguageSheet = false
    @State private var showingSupportSheet = false
    
    var body: some View {
        List {
            profileSection
            subscriptionSection
            appearanceSection
            notificationsSection
            supportSection
        }
        .listStyle(.insetGrouped)
        .navigationTitle(localization.localized("Settings"))
        .sheet(isPresented: $showingLanguageSheet) {
            LanguageSettingsView()
        }
        .sheet(isPresented: $showingSupportSheet) {
            SupportSheet(localization: localization)
        }
    }
    
    private var profileSection: some View {
        Section(header: Text(localization.localized("Profile"))) {
            HStack {
                Circle()
                    .fill(LinearGradient(colors: [.calPrimary, .calSecondary], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 56, height: 56)
                    .overlay(Text("JD").font(.headline).foregroundColor(.white))
                VStack(alignment: .leading) {
                    Text("John Doe").font(.headline)
                    Text("john.doe@example.com").font(.caption).foregroundColor(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.caption).foregroundColor(.secondary)
            }
            .contentShape(Rectangle())
            .onTapGesture {
                // Future: push profile editor
            }
        }
    }
    
    private var subscriptionSection: some View {
        Section(header: Text(localization.localized("Membership"))) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(subscriptionTitle)
                        .font(.headline)
                    Text(subscriptionDescription)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                if isFreeTier {
                    Button(localization.localized("Upgrade")) {
                        SubscriptionManager.shared.showPaywall()
                    }
                    .buttonStyle(.borderedProminent)
                } else {
                    TierBadge(tierName: normalizedTier)
                }
            }
        }
    }
    
    private var appearanceSection: some View {
        Section(header: Text(localization.localized("Preferences"))) {
            Picker(localization.localized("Color Theme"), selection: $appSettings.themePreference) {
                ForEach(AppSettingsManager.ThemePreference.allCases, id: \.self) { theme in
                    Text(theme.displayName).tag(theme)
                }
            }
            Toggle(localization.localized("Prioritize local foods"), isOn: $appSettings.preferLocalFoods)
            Button {
                showingLanguageSheet = true
            } label: {
                HStack {
                    Text(localization.localized("Language"))
                    Spacer()
                    Text(localization.language == .arabic ? "العربية" : "English")
                        .foregroundColor(.secondary)
                }
            }
        }
    }
    
    private var notificationsSection: some View {
        Section(header: Text(localization.localized("Notifications"))) {
            Toggle(localization.localized("Hydration reminders"), isOn: Binding(
                get: { !appSettings.hydrationReminders.isEmpty },
                set: { newValue in
                    if newValue && appSettings.hydrationReminders.isEmpty {
                        appSettings.hydrationReminders = [
                            DailyReminder(hour: 9, minute: 0),
                            DailyReminder(hour: 13, minute: 0),
                            DailyReminder(hour: 19, minute: 0)
                        ]
                    } else if !newValue {
                        appSettings.hydrationReminders = []
                        MealNotificationManager.shared.updateHydrationSchedule(with: [])
                    }
                }
            ))
            Toggle(localization.localized("Fasting reminders"), isOn: $appSettings.fastingRemindersEnabled)
            Button {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            } label: {
                HStack {
                    Text(localization.localized("System notification settings"))
                    Spacer()
                    Image(systemName: "arrow.up.right.square")
                        .foregroundColor(.secondary)
                }
            }
        }
    }
    
    private var supportSection: some View {
        Section(header: Text(localization.localized("Support"))) {
            Button(localization.localized("Contact Support")) {
                showingSupportSheet = true
            }
            Button(localization.localized("Privacy Policy")) {
                if let url = URL(string: "https://scal.app/privacy") {
                    UIApplication.shared.open(url)
                }
            }
            Button(localization.localized("Terms of Service")) {
                if let url = URL(string: "https://scal.app/terms") {
                    UIApplication.shared.open(url)
                }
            }
        }
    }
    
    private var subscriptionDescription: String {
        switch normalizedTier {
        case "free":
            return localization.localized("Unlock AI coach, telehealth booking, and loyalty perks.")
        case "premium":
            return localization.localized("Premium plan active")
        case "pro":
            return localization.localized("Pro plan active")
        default:
            return localization.localized("Custom plan active")
        }
    }
    
    private var subscriptionTitle: String {
        switch normalizedTier {
        case "free": return localization.localized("SCAL Free")
        case "premium": return localization.localized("SCAL Premium")
        case "pro": return localization.localized("SCAL Pro")
        default: return localization.localized("SCAL Member")
        }
    }
    
    private var normalizedTier: String {
        subscriptionManager.currentTier.lowercased()
    }
    
    private var isFreeTier: Bool { normalizedTier == "free" }
}

private struct TierBadge: View {
    let tierName: String
    
    private var color: Color {
        switch tierName.lowercased() {
        case "premium": return .blue
        case "pro": return .orange
        default: return .gray
        }
    }
    
    private var icon: String {
        switch tierName.lowercased() {
        case "premium": return "star.fill"
        case "pro": return "crown.fill"
        default: return "person"
        }
    }
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
            Text(tierName.capitalized)
                .font(.caption.bold())
        }
        .foregroundColor(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(color.opacity(0.2))
        )
    }
}

private struct SupportSheet: View {
    let localization: LocalizationManager
    @Environment(\.dismiss) private var dismiss
    @State private var message = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text(localization.localized("How can we help?"))) {
                    TextEditor(text: $message)
                        .frame(minHeight: 160)
                }
            }
            .navigationTitle(localization.localized("Support"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(localization.localized("Cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(localization.localized("Send")) { dismiss() }
                        .disabled(message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
