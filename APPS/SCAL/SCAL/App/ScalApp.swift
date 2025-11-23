//
//  ScalApp.swift
//  SCAL - Intelligent Calorie Tracker
//
//  AI-powered nutrition tracking made simple
//  Powered by USDA FoodData Central
//

import SwiftUI
import UserNotifications

@main
struct ScalApp: App {
    @StateObject private var appSettings = AppSettingsManager.shared
    @StateObject private var notificationManager = MealNotificationManager.shared
    
    init() {
        // Configure app-wide appearance for SCAL with dark mode support
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .systemBackground // Adaptive: white in light, black in dark
        appearance.titleTextAttributes = [
            .foregroundColor: UIColor.label, // Adaptive text color
            .font: UIFont.systemFont(ofSize: 20, weight: .bold)
        ]
        appearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor.label, // Adaptive text color
            .font: UIFont.systemFont(ofSize: 34, weight: .bold)
        ]

        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance

        // Tab bar appearance with dark mode support
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = .systemBackground // Adaptive
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                // Dark mode now supported! Remove .preferredColorScheme to allow system preference
                .statusBar(hidden: false)
                .environmentObject(appSettings)
                .environmentObject(notificationManager)
                .preferredColorScheme(appSettings.themePreference.colorScheme)
                .onAppear {
                    print("SCAL - Powered by USDA FoodData Central API")
                    print("Dark mode: Supported ✓")
                    if notificationManager.authorizationStatus == .notDetermined {
                        notificationManager.requestAuthorization()
                    }
                }
        }
    }
}

// MARK: - Daily Reminder Model

struct DailyReminder: Codable, Hashable, Identifiable {
    var id = UUID()
    var hour: Int
    var minute: Int
    
    var dateComponents: DateComponents {
        DateComponents(hour: hour, minute: minute)
    }
    
    var date: Date {
        Calendar.current.date(from: dateComponents) ?? Date()
    }
    
    mutating func update(from date: Date) {
        let components = Calendar.current.dateComponents([.hour, .minute], from: date)
        hour = components.hour ?? 8
        minute = components.minute ?? 0
    }
}

// MARK: - App Settings Manager

@MainActor
final class AppSettingsManager: ObservableObject {
    static let shared = AppSettingsManager()
    
    enum ThemePreference: String, Codable, CaseIterable {
        case system
        case light
        case dark
        
        var displayName: String {
            switch self {
            case .system: return "Match System"
            case .light: return "Light"
            case .dark: return "Dark"
            }
        }
        
        var colorScheme: ColorScheme? {
            switch self {
            case .system: return nil
            case .light: return .light
            case .dark: return .dark
            }
        }
    }
    
    @Published var preferLocalFoods: Bool {
        didSet {
            persist()
            SimpleFoodSearchService.shared.useLocalDatabase = preferLocalFoods
        }
    }
    
    @Published var hydrationReminders: [DailyReminder] {
        didSet {
            persist()
            MealNotificationManager.shared.updateHydrationSchedule(with: hydrationReminders)
        }
    }
    
    @Published var fastingRemindersEnabled: Bool {
        didSet {
            persist()
            refreshFastingSchedule()
        }
    }
    
    @Published var suhoorReminder: DailyReminder {
        didSet {
            persist()
            refreshFastingSchedule()
        }
    }
    
    @Published var iftarReminder: DailyReminder {
        didSet {
            persist()
            refreshFastingSchedule()
        }
    }
    
    @Published var themePreference: ThemePreference {
        didSet {
            persist()
        }
    }
    
    private let defaults = UserDefaults.standard
    private let storageKey = "com.scal.appSettings"
    
    private init() {
        if let data = defaults.data(forKey: storageKey),
           let decoded = try? JSONDecoder().decode(PersistedSettings.self, from: data) {
            self.preferLocalFoods = decoded.preferLocalFoods
            self.hydrationReminders = decoded.hydrationReminders
            self.fastingRemindersEnabled = decoded.fastingRemindersEnabled
            self.suhoorReminder = decoded.suhoorReminder
            self.iftarReminder = decoded.iftarReminder
            self.themePreference = decoded.themePreference ?? .system
        } else {
            self.preferLocalFoods = true
            self.hydrationReminders = [
                DailyReminder(hour: 9, minute: 0),
                DailyReminder(hour: 13, minute: 0),
                DailyReminder(hour: 19, minute: 30)
            ]
            self.fastingRemindersEnabled = false
            self.suhoorReminder = DailyReminder(hour: 4, minute: 30)
            self.iftarReminder = DailyReminder(hour: 18, minute: 30)
            self.themePreference = .system
        }
        SimpleFoodSearchService.shared.useLocalDatabase = preferLocalFoods
        refreshFastingSchedule()
    }
    
    func updateHydrationReminder(at index: Int, with date: Date) {
        guard hydrationReminders.indices.contains(index) else { return }
        var reminder = hydrationReminders[index]
        reminder.update(from: date)
        hydrationReminders[index] = reminder
    }
    
    func addHydrationReminder() {
        guard hydrationReminders.count < 4 else { return }
        let last = hydrationReminders.last ?? DailyReminder(hour: 15, minute: 0)
        var nextHour = last.hour + 3
        if nextHour >= 24 { nextHour -= 24 }
        hydrationReminders.append(DailyReminder(hour: nextHour, minute: last.minute))
    }
    
    func removeHydrationReminder(at indexSet: IndexSet) {
        hydrationReminders.remove(atOffsets: indexSet)
    }
    
    func resetHydrationReminders() {
        hydrationReminders = [
            DailyReminder(hour: 9, minute: 0),
            DailyReminder(hour: 13, minute: 0),
            DailyReminder(hour: 19, minute: 30)
        ]
    }
    
    private func persist() {
        let payload = PersistedSettings(
            preferLocalFoods: preferLocalFoods,
            hydrationReminders: hydrationReminders,
            fastingRemindersEnabled: fastingRemindersEnabled,
            suhoorReminder: suhoorReminder,
            iftarReminder: iftarReminder,
            themePreference: themePreference
        )
        if let data = try? JSONEncoder().encode(payload) {
            defaults.set(data, forKey: storageKey)
        }
    }
    
    private func refreshFastingSchedule() {
        MealNotificationManager.shared.updateFastingSchedule(
            enabled: fastingRemindersEnabled,
            suhoor: suhoorReminder,
            iftar: iftarReminder
        )
    }
    
    private struct PersistedSettings: Codable {
        let preferLocalFoods: Bool
        let hydrationReminders: [DailyReminder]
        let fastingRemindersEnabled: Bool
        let suhoorReminder: DailyReminder
        let iftarReminder: DailyReminder
        let themePreference: ThemePreference?
    }
}

// MARK: - Notification Manager

@MainActor
final class MealNotificationManager: NSObject, ObservableObject {
    static let shared = MealNotificationManager()
    
    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    
    private let center = UNUserNotificationCenter.current()
    private let hydrationPrefix = "hydration-reminder-"
    private let suhoorIdentifier = "suhoor-reminder"
    private let iftarIdentifier = "iftar-reminder"
    
    private override init() {
        super.init()
        center.delegate = self
        refreshAuthorizationStatus()
    }
    
    func requestAuthorization() {
        center.requestAuthorization(options: [.alert, .sound]) { [weak self] granted, _ in
            Task { @MainActor in
                self?.authorizationStatus = granted ? .authorized : .denied
                if granted {
                    let settings = AppSettingsManager.shared
                    self?.updateHydrationSchedule(with: settings.hydrationReminders)
                    self?.updateFastingSchedule(
                        enabled: settings.fastingRemindersEnabled,
                        suhoor: settings.suhoorReminder,
                        iftar: settings.iftarReminder
                    )
                }
            }
        }
    }
    
    func refreshAuthorizationStatus() {
        center.getNotificationSettings { [weak self] settings in
            Task { @MainActor in
                self?.authorizationStatus = settings.authorizationStatus
            }
        }
    }
    
    func updateHydrationSchedule(with reminders: [DailyReminder]) {
        guard authorizationStatus == .authorized else { return }
        let identifiers = reminders.indices.map { hydrationPrefix + String($0) }
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        for (index, reminder) in reminders.enumerated() {
            let content = UNMutableNotificationContent()
            content.title = "Hydration Check"
            content.body = "Have a glass of water to stay energized."
            content.sound = .default
            let trigger = UNCalendarNotificationTrigger(dateMatching: reminder.dateComponents, repeats: true)
            let request = UNNotificationRequest(
                identifier: hydrationPrefix + String(index),
                content: content,
                trigger: trigger
            )
            center.add(request)
        }
    }
    
    func updateFastingSchedule(enabled: Bool, suhoor: DailyReminder, iftar: DailyReminder) {
        guard authorizationStatus == .authorized else { return }
        center.removePendingNotificationRequests(withIdentifiers: [suhoorIdentifier, iftarIdentifier])
        guard enabled else { return }
        let suhoorContent = UNMutableNotificationContent()
        suhoorContent.title = "Suhoor reminder"
        suhoorContent.body = "Log your pre-dawn meal before fasting begins."
        suhoorContent.sound = .default
        center.add(UNNotificationRequest(identifier: suhoorIdentifier, content: suhoorContent, trigger: UNCalendarNotificationTrigger(dateMatching: suhoor.dateComponents, repeats: true)))
        
        let iftarContent = UNMutableNotificationContent()
        iftarContent.title = "Iftar reminder"
        iftarContent.body = "Break your fast and capture your meal."
        iftarContent.sound = .default
        center.add(UNNotificationRequest(identifier: iftarIdentifier, content: iftarContent, trigger: UNCalendarNotificationTrigger(dateMatching: iftar.dateComponents, repeats: true)))
    }
    
    func scheduleReflection(for meal: SimpleMeal) {
        guard authorizationStatus == .authorized else { return }
        let content = UNMutableNotificationContent()
        content.title = "How was \(meal.name)?"
        content.body = "Review or adjust your macros if needed."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 45 * 60, repeats: false)
        let request = UNNotificationRequest(identifier: "reflection-\(meal.id.uuidString)", content: content, trigger: trigger)
        center.add(request)
    }
}

extension MealNotificationManager: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        Task { @MainActor in
            completionHandler([.banner, .sound])
        }
    }
}
