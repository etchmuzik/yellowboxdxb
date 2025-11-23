import Foundation
import Combine

// MARK: - Supporting Models
struct DailyReminder: Codable, Equatable, Hashable {
    let hour: Int
    let minute: Int
    
    init(hour: Int, minute: Int) {
        self.hour = hour
        self.minute = minute
    }
    
    var components: DateComponents {
        DateComponents(hour: hour, minute: minute)
    }
    
    static func from(components: DateComponents) -> DailyReminder? {
        guard let hour = components.hour, let minute = components.minute else { return nil }
        return DailyReminder(hour: hour, minute: minute)
    }
}

struct FastingSchedule: Codable, Equatable {
    var enabled: Bool
    var suhoorReminder: DailyReminder
    var iftarReminder: DailyReminder
    
    static let disabled = FastingSchedule(
        enabled: false,
        suhoorReminder: DailyReminder(hour: 4, minute: 30),
        iftarReminder: DailyReminder(hour: 18, minute: 30)
    )
}

// MARK: - App Settings Manager
@MainActor
final class AppSettingsManager: ObservableObject {
    static let shared = AppSettingsManager()
    
    @Published var preferLocalFoods: Bool {
        didSet {
            persist()
            SimpleFoodSearchService.shared.useLocalDatabase = preferLocalFoods
        }
    }
    
    @Published var hydrationReminders: [DailyReminder] {
        didSet { persist() }
    }
    
    @Published var fastingSchedule: FastingSchedule {
        didSet { persist() }
    }
    
    @Published var enableMacroReflection: Bool {
        didSet { persist() }
    }
    
    private let storage: UserDefaults
    private let storageKey = "com.scal.app.settings"
    
    private init(storage: UserDefaults = .standard) {
        self.storage = storage
        if let data = storage.data(forKey: storageKey),
           let decoded = try? JSONDecoder().decode(PersistedSettings.self, from: data) {
            self.preferLocalFoods = decoded.preferLocalFoods
            self.hydrationReminders = decoded.hydrationReminders
            self.fastingSchedule = decoded.fastingSchedule
            self.enableMacroReflection = decoded.enableMacroReflection
        } else {
            self.preferLocalFoods = true
            self.hydrationReminders = [DailyReminder(hour: 10, minute: 0), DailyReminder(hour: 14, minute: 0), DailyReminder(hour: 20, minute: 0)]
            self.fastingSchedule = .disabled
            self.enableMacroReflection = true
        }
        SimpleFoodSearchService.shared.useLocalDatabase = preferLocalFoods
    }
    
    var hydrationReminderComponents: [DateComponents] {
        hydrationReminders.map { $0.components }
    }
    
    private func persist() {
        let persistable = PersistedSettings(
            preferLocalFoods: preferLocalFoods,
            hydrationReminders: hydrationReminders,
            fastingSchedule: fastingSchedule,
            enableMacroReflection: enableMacroReflection
        )
        if let data = try? JSONEncoder().encode(persistable) {
            storage.set(data, forKey: storageKey)
        }
    }
}

private struct PersistedSettings: Codable {
    let preferLocalFoods: Bool
    let hydrationReminders: [DailyReminder]
    let fastingSchedule: FastingSchedule
    let enableMacroReflection: Bool
}
