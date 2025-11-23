import Foundation

@MainActor
final class NutritionCoach: ObservableObject {
    static let shared = NutritionCoach()
    
    @Published var insights: [CoachingInsight]
    @Published var messages: [CoachMessage]
    @Published var isTyping = false
    
    private init() {
        insights = NutritionCoach.sampleInsights()
        messages = [
            CoachMessage(
                text: "Marhaba! I'm your GCC-based coach. Ready for a quick check-in before Dubai Fitness Challenge kicks off?",
                isUser: false,
                suggestions: NutritionCoach.defaultSuggestions()
            )
        ]
    }
    
    enum CoachTopic: String, CaseIterable {
        case general = "General"
        case weightLoss = "Weight Loss"
        case muscleGain = "Muscle Gain"
        case healthyEating = "Healthy Eating"
        case mealTiming = "Meal Timing"
        case supplements = "Supplements"
        case hydration = "Hydration"
        case specialDiets = "Special Diets"
    }
    
    func sendMessage(_ text: String) {
        messages.append(CoachMessage(text: text, isUser: true))
        isTyping = true
        Task {
            try? await Task.sleep(nanoseconds: 400_000_000)
            let reply = CoachMessage(
                text: NutritionCoach.generateReply(for: text),
                isUser: false,
                suggestions: NutritionCoach.defaultSuggestions(for: text)
            )
            messages.append(reply)
            isTyping = false
        }
    }
    
    func generateDailyCheckIn() async {
        let hydration = CoachMessage(
            text: "Reminder: Dubai afternoons are touching 38°C today. Aim for 2.7L of water and add eletrolytes after sunset jogs.",
            isUser: false
        )
        messages.append(hydration)
        UserDefaults.standard.set(Date(), forKey: "lastCoachCheckIn")
    }
    
    private static func generateReply(for input: String) -> String {
        let normalized = input.lowercased()
        if normalized.contains("hydr") {
            return "Sip 250ml every hour and double up after your Marina evening runs. Coconut water is a great break from plain water."
        } else if normalized.contains("iftar") || normalized.contains("fast") {
            return "Open Iftar with laban and three dates, then pause 10 minutes before heavier dishes. Your macros stay stable that way."
        } else if normalized.contains("event") {
            return "Dubai Run on Sheikh Zayed Road is 23 Nov. Register now so we can sync your training blocks and taper week."
        } else if normalized.contains("protein") {
            return "Lean camel sliders, hammour, and labneh bowls keep protein high without blowing your sodium goals."
        }
        return "Keep portions colourful—half veggies, quarter protein, quarter smart carbs. Need meal ideas from Enso or Poke & Co?"
    }
    
    private static func defaultSuggestions(for text: String? = nil) -> [CoachSuggestion] {
        [
            CoachSuggestion(
                title: "Log Suhoor meal",
                description: "Capture oats, laban, or dates",
                icon: "square.and.pencil",
                action: .logFood(foodName: "Suhoor meal")
            ),
            CoachSuggestion(
                title: "Set hydration reminder",
                description: "Custom Dubai heat alerts",
                icon: "drop.fill",
                action: .scheduleReminder(time: Date().addingTimeInterval(3600), message: "Hydrate now")
            ),
            CoachSuggestion(
                title: "View training plan",
                description: "Prep for Dubai Run",
                icon: "figure.run",
                action: .viewProgress(metric: "Dubai Run Training")
            )
        ]
    }
    
    private static func sampleInsights() -> [CoachingInsight] {
        [
            CoachingInsight(
                title: "Hydration Gap",
                message: "You're 0.8L under your goal. Freeze bottles so they're cool during commute.",
                category: .hydration,
                priority: .warning
            ),
            CoachingInsight(
                title: "Dubai Run Ready",
                message: "Long run mileage is on track. Add one more tempo session this week.",
                category: .goals,
                priority: .info
            ),
            CoachingInsight(
                title: "Fasting Window",
                message: "Suhoor protein looks solid, but add chia pudding for slow carbs.",
                category: .habits,
                priority: .info
            )
        ]
    }
}
