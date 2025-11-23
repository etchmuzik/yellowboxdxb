import Foundation
import UserNotifications
import Combine

@MainActor
final class MealNotificationManager: NSObject, ObservableObject {
    static let shared = MealNotificationManager()
    
    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    
    private let center = UNUserNotificationCenter.current()
    private var cancellables = Set<AnyCancellable>()
    private let settings = AppSettingsManager.shared
    
    private override init() {
        super.init()
        center.delegate = self
        refreshAuthorizationStatus()
        observeMealEvents()
        observeSettings()
    }
    
    func requestAuthorization() {
        center.requestAuthorization(options: [.alert, .badge, .sound]) { [weak self] granted, _ in
            Task { @MainActor in
                self?.authorizationStatus = granted ? .authorized : .denied
                if granted {
                    self?.scheduleHydrationReminders()
                    self?.scheduleFastingReminders()
                }
            }
        }
    }
    
    private func refreshAuthorizationStatus() {
        center.getNotificationSettings { [weak self] settings in
            Task { @MainActor in
                self?.authorizationStatus = settings.authorizationStatus
            }
        }
    }
    
    private func observeMealEvents() {
        MealRepository.shared.mealEvents
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event in
                self?.handleMealEvent(event)
            }
            .store(in: &cancellables)
    }
    
    private func observeSettings() {
        settings.$hydrationReminders
            .dropFirst()
            .sink { [weak self] _ in self?.scheduleHydrationReminders() }
            .store(in: &cancellables)
        
        settings.$fastingSchedule
            .dropFirst()
            .sink { [weak self] _ in self?.scheduleFastingReminders() }
            .store(in: &cancellables)
    }
    
    private func handleMealEvent(_ event: MealRepository.MealEvent) {
        guard settings.enableMacroReflection, authorizationStatus == .authorized else { return }
        let content = UNMutableNotificationContent()
        content.title = "Meal logged: \(event.mealType.rawValue)"
        let calorieString = String(format: "%.0f kcal", event.totalCalories)
        content.body = "Tap to review macros – \(calorieString) added."
        content.sound = .default
        content.userInfo = ["mealId": event.mealId.uuidString]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 60 * 45, repeats: false)
        let request = UNNotificationRequest(
            identifier: "meal-reflection-\(event.mealId)",
            content: content,
            trigger: trigger
        )
        center.add(request)
    }
    
    private func scheduleHydrationReminders() {
        guard authorizationStatus == .authorized else { return }
        let identifiers = settings.hydrationReminders.enumerated().map { "hydration-\($0.offset)" }
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        for (index, reminder) in settings.hydrationReminders.enumerated() {
            let content = UNMutableNotificationContent()
            content.title = "Hydration check"
            content.body = "Have a glass of water to stay on track."
            content.sound = .default
            var date = DateComponents()
            date.hour = reminder.hour
            date.minute = reminder.minute
            let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
            let request = UNNotificationRequest(
                identifier: "hydration-\(index)",
                content: content,
                trigger: trigger
            )
            center.add(request)
        }
    }
    
    private func scheduleFastingReminders() {
        guard authorizationStatus == .authorized else { return }
        let schedule = settings.fastingSchedule
        center.removePendingNotificationRequests(withIdentifiers: ["suhoor-reminder", "iftar-reminder"])
        guard schedule.enabled else { return }
        
        let suhoorContent = UNMutableNotificationContent()
        suhoorContent.title = "Suhoor reminder"
        suhoorContent.body = "Log your pre-dawn meal before fasting begins."
        suhoorContent.sound = .default
        let suhoorTrigger = UNCalendarNotificationTrigger(dateMatching: schedule.suhoorReminder.components, repeats: true)
        center.add(UNNotificationRequest(identifier: "suhoor-reminder", content: suhoorContent, trigger: suhoorTrigger))
        
        let iftarContent = UNMutableNotificationContent()
        iftarContent.title = "Iftar reminder"
        iftarContent.body = "Break your fast and capture your meal for insights."
        iftarContent.sound = .default
        let iftarTrigger = UNCalendarNotificationTrigger(dateMatching: schedule.iftarReminder.components, repeats: true)
        center.add(UNNotificationRequest(identifier: "iftar-reminder", content: iftarContent, trigger: iftarTrigger))
    }
}

extension MealNotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }
}
