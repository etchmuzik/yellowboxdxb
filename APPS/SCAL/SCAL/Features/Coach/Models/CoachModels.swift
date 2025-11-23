import Foundation
import SwiftUI

struct CoachInsight: Identifiable, Equatable {
    enum Kind: String, CaseIterable, Identifiable {
        case daily
        case weekly
        case fasting
        case local_food
        
        var id: String { rawValue }
    }
    let id = UUID()
    let kind: Kind
    let title: String
    let message: String
    let icon: String
    let accent: Color
    
    func localizedTitle(using localization: LocalizationManager) -> String {
        switch kind {
        case .daily: return localization.localized("Daily")
        case .weekly: return localization.localized("Weekly")
        case .fasting: return localization.localized("Fasting Tips")
        case .local_food: return localization.localized("Local Favorites")
        }
    }
}

struct CoachQuest: Identifiable, Equatable {
    let id = UUID()
    let title: String
    let description: String
    let progress: Double
    let reward: String
}

struct CoachMessage: Identifiable {
    enum MessageType {
        case user
        case coach
    }
    
    let id = UUID()
    let text: String
    let isUser: Bool
    let timestamp: Date
    let suggestions: [CoachSuggestion]?
    
    init(text: String, isUser: Bool, suggestions: [CoachSuggestion]? = nil, timestamp: Date = Date()) {
        self.text = text
        self.isUser = isUser
        self.suggestions = suggestions
        self.timestamp = timestamp
    }
    
    var type: MessageType { isUser ? .user : .coach }
    var content: String { text }
}

struct CoachSuggestion: Identifiable, Equatable {
    enum Action: Equatable {
        case adjustGoals(calories: Int, protein: Double, carbs: Double, fat: Double)
        case viewMealPlan(planId: String)
        case logFood(foodName: String)
        case viewRecipe(recipeId: String)
        case scheduleReminder(time: Date, message: String)
        case viewProgress(metric: String)
    }
    
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let action: Action
}

struct CoachingInsight: Identifiable, Equatable {
    enum InsightCategory: String, CaseIterable, Identifiable {
        case nutrition
        case timing
        case hydration
        case goals
        case habits
        case trends
        
        var id: String { rawValue }
    }
    
    enum Priority {
        case info
        case warning
        case critical
        
        var color: Color {
            switch self {
            case .info: return Color.calPrimary
            case .warning: return Color.orange
            case .critical: return Color.red
            }
        }
    }
    
    let id = UUID()
    let title: String
    let message: String
    let category: InsightCategory
    let priority: Priority
}

enum CoachExperienceType: String, Codable, CaseIterable, Identifiable {
    case nutrition
    case telehealth
    case events
    case wellness
    
    var id: String { rawValue }
}

struct CoachExperienceModule: Identifiable, Equatable {
    let id = UUID()
    let title: String
    let subtitle: String
    let icon: String
    let type: CoachExperienceType
    let availability: String
    
    static func defaults() -> [CoachExperienceModule] {
        [
            CoachExperienceModule(title: "Nutrition Insights", subtitle: "Real-time macros", icon: "fork.knife", type: .nutrition, availability: "Live"),
            CoachExperienceModule(title: "Telehealth", subtitle: "Virtual dietitian visits", icon: "stethoscope", type: .telehealth, availability: "Soon"),
            CoachExperienceModule(title: "Events & Challenges", subtitle: "Dubai wellness calendar", icon: "calendar", type: .events, availability: "Soon"),
            CoachExperienceModule(title: "AI Wellness", subtitle: "Personalized rituals", icon: "sparkles", type: .wellness, availability: "Beta")
        ]
    }
}
