import Foundation
import SwiftUI

struct CoachContext {
    let totalCalories: Int
    let calorieGoal: Int
    let protein: Double
    let carbs: Double
    let fat: Double
    let hydrationLiters: Double
    let fastingEnabled: Bool
    let preferLocalFoods: Bool
    let lastMealName: String?
    let remainingCalories: Int
}

final class CoachContentGenerator {
    private let firebaseService = FirebaseCoachService.shared
    private let tips = [
        "Drink water before every meal to stay hydrated and feel satisfied.",
        "Aim for 25-30g of protein with every main meal to support recovery.",
        "Balance Emirati comfort food with a fresh salad to boost fiber.",
        "Log Suhoor early so you stay consistent throughout Ramadan.",
        "Stretch for five minutes after every workout for faster recovery."
    ]
    private let localization = LocalizationManager.shared

    func initialPrompt(context: CoachContext) -> String {
        if localization.language == .arabic {
            return "أراقب هدفك البالغ \(context.calorieGoal) سعرة. سجلت \(String(format: "%.1f", context.hydrationLiters)) لتر من الماء اليوم. اسألني عن التمارين، خطط الصيام، أو ما الذي يجب أن تأكله لاحقًا!"
        }
        return "I'm monitoring your \(context.calorieGoal)-cal goal. Hydration at \(String(format: "%.1f", context.hydrationLiters))L. Ask about workouts, fasting plans, or what to eat next!"
    }
    
    func generateGreeting() -> String {
        let greetings: [String]
        switch localization.language {
        case .arabic:
            greetings = ["هل أنت مستعد ليوم ممتاز؟", "لنُعزز عاداتك الصحية!", "فلنغذِّ جسمك اليوم!"]
        default:
            greetings = ["Ready to dominate today?", "Let's build some smart habits!", "Fuel up like a pro today!"]
        }
        return greetings.randomElement() ?? "Let's go!"
    }
    
    func currentStreak() -> Int {
        // Placeholder until achievements implemented
        return 3
    }
    
    func generateInsights(context: CoachContext) -> [CoachInsight] {
        var insights: [CoachInsight] = []
        if context.remainingCalories < 200 {
            insights.append(CoachInsight(kind: .daily, title: localization.language == .arabic ? "قربت على الهدف" : "Goal nearly hit", message: localization.language == .arabic ? "لم يتبق سوى \(context.remainingCalories) سعرة. ركز على البروتين الخالي من الدهون أو الخضار." : "You're within \(context.remainingCalories) calories of your target. Focus on lean protein or veggies.", icon: "target", accent: .calPrimary))
        } else {
            insights.append(CoachInsight(kind: .daily, title: localization.language == .arabic ? "طاقة متاحة" : "Fuel available", message: localization.language == .arabic ? "لا يزال لديك \(context.remainingCalories) سعرة. اختر طبقًا متوازنًا من الحبوب والبروتين." : "You still have \(context.remainingCalories) calories. Try a balanced plate with grains + protein.", icon: "flame.fill", accent: .orange))
        }
        if context.hydrationLiters < 1.5 {
            insights.append(CoachInsight(kind: .daily, title: localization.language == .arabic ? "انخفاض الترطيب" : "Hydration dip", message: localization.language == .arabic ? "سجلت فقط \(String(format: "%.1f", context.hydrationLiters)) لتر. اشرب كوب ماء الآن!" : "Only \(String(format: "%.1f", context.hydrationLiters))L logged. Grab a glass of water now?", icon: "drop.fill", accent: .blue))
        }
        if context.fastingEnabled {
            insights.append(CoachInsight(kind: .fasting, title: localization.language == .arabic ? "وضع الصيام" : "Fasting mode", message: localization.language == .arabic ? "تذكير السحور مفعل. حافظ على ألياف عالية قبل الفجر!" : "Suhoor reminder active. Keep fiber high before dawn!", icon: "moon.stars.fill", accent: .purple))
        }
        if context.preferLocalFoods {
            let msg = localization.language == .arabic ? "جرب طبق فتوش مع حُمص أو ماندي دجاج للحفاظ على نكهات الخليج." : "Mix fattoush with hummus or chicken mandi to stay close to GCC flavors."
            insights.append(CoachInsight(kind: .local_food, title: localization.language == .arabic ? "نكهات محلية" : "Local favorite", message: msg, icon: "fork.knife", accent: .pink))
        }
        if insights.isEmpty {
            insights.append(CoachInsight(kind: .weekly, title: localization.language == .arabic ? "ثبات رائع" : "Great consistency", message: localization.language == .arabic ? "أنت متوازن اليوم. هل ترغب في تحدٍّ جديد؟" : "You're balanced today. Want a new challenge?", icon: "sparkles", accent: .green))
        }
        return insights
    }
    
    func generateConversationResponse(message: String, context: CoachContext) async -> String {
        if let firebaseReply = try? await firebaseService.fetchCoachResponse(message: message, context: context) {
            return firebaseReply
        }
        return fallbackResponse(message: message, context: context)
    }
    
    private func fallbackResponse(message: String, context: CoachContext) -> String {
        let lower = message.lowercased()
        if lower.contains("water") {
            if localization.language == .arabic {
                return "بلغت كمية الماء \(String(format: "%.1f", context.hydrationLiters)) لتر اليوم. استهدف ٢٫٥ لتر. اشرب كوبًا الآن وآخر قبل النوم."
            }
            return "You're at \(String(format: "%.1f", context.hydrationLiters))L today. Aim for 2.5L. Start with a full glass now and another before bed."
        }
        if lower.contains("fast") || lower.contains("ramadan") {
            if localization.language == .arabic {
                return "خطط للسحور بالشوفان واللبن والتمر لطاقة ثابتة. اجعل الإفطار خفيفًا مع شوربة وسلطة قبل الطبق الرئيسي."
            }
            return "Plan Suhoor with oats, laban, and dates for steady energy. Keep Iftar light with soup + salad before the main dish."
        }
        if lower.contains("meal") || lower.contains("food") {
        if context.preferLocalFoods {
            if localization.language == .arabic {
                return "جرب مجبوس الدجاج مع طبق فتوش الليلة. الحصة حوالي ٥٠٠ سعرة ضمن ميزانيتك الباقية \(context.remainingCalories)."
            }
            return "Try Chicken Machboos with a side of fattoush tonight. Portion? About 500 cal—still within your \(context.remainingCalories) cal budget."
        } else {
                if localization.language == .arabic {
                    return "سمك السلمون المشوي مع الكينوا والخضار المشوية يناسب الماكروز الخاصة بك. أضف لبن لجرعة بروتين إضافية."
                }
                return "Grilled salmon with quinoa and roasted veggies fits your macros. Add laban for extra protein."
            }
        }
        if lower.contains("workout") {
            if localization.language == .arabic {
                return "قم بمشي سريع لمدة ٢٠ دقيقة على الممشى، ثم ٣ مجموعات من ١٥ سكوات و١٥ ضغط لتحرق حوالي ٢٢٠ سعرة."
            }
            return "Do a 20-min brisk walk along JBR, then 3x15 bodyweight squats and push-ups to burn ~220 cal."
        }
        if lower.contains("tip") {
            if localization.language == .arabic {
                return "استمر في التدوين والحركة والترطيب بانتظام!"
            }
            return tips.randomElement() ?? "Keep logging, stay active, and hydrate regularly!"
        }
        if localization.language == .arabic {
            return "سجلت \(context.totalCalories) من أصل \(context.calorieGoal) سعرة. تحتاج أفكار طعام أو تمرين؟ أنا هنا."
        }
        return "Logged \(context.totalCalories) of \(context.calorieGoal) cal today. Need food ideas or a workout? I'm here."
    }
}
