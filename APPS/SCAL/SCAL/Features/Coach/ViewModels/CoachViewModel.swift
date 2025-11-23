import Foundation
import Combine

@MainActor
final class CoachViewModel: ObservableObject {
    @Published var insights: [CoachInsight] = []
    @Published var messages: [CoachMessage] = []
    @Published var inputText: String = ""
    @Published var isTyping = false
    @Published var activeQuest: CoachQuest?
    @Published var greeting: String = ""
    @Published var userName: String = "Coach"
    @Published var streakCount: Int = 0
    @Published var experienceModules: [CoachExperienceModule] = CoachExperienceModule.defaults()
    @Published var selectedKind: CoachInsight.Kind = .daily
    @Published var isLoadingInsights = false
    
    var filteredInsights: [CoachInsight] {
        insights.filter { $0.kind == selectedKind }
    }
    
    private var dataManager: MealDataManager?
    private var profileManager: UserProfileManager?
    private var appSettings: AppSettingsManager?
    private var cancellables = Set<AnyCancellable>()
    private let localization = LocalizationManager.shared
    private let generator = CoachContentGenerator()
    private let supabaseService: SupabaseCoachService
    private var hasBound = false
    
    init(supabaseService: SupabaseCoachService = .shared) {
        self.supabaseService = supabaseService
    }
    
    func bind(dataManager: MealDataManager, profile: UserProfileManager, settings: AppSettingsManager) {
        guard !hasBound else { return }
        hasBound = true
        self.dataManager = dataManager
        self.profileManager = profile
        self.appSettings = settings
        userName = profile.userName.isEmpty ? localization.localized("Friend") : profile.userName
        greeting = generator.generateGreeting()
        streakCount = generator.currentStreak()
        loadInitialConversation()
        dataManager.$todaysMeals
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in Task { await self?.refreshInsights() } }
            .store(in: &cancellables)
        Task { await refreshInsights() }
    }
    
    private func loadInitialConversation() {
        guard let context = currentCoachContext() else { return }
        messages = [CoachMessage(text: generator.initialPrompt(context: context), isUser: false)]
    }
    
    func fetchFreshInsights() {
        Task { await refreshInsights() }
    }
    
    func showAllQuests() { }
    func completeQuest() { }
    
    func clearConversation() {
        loadInitialConversation()
    }
    
    func sendMessage() {
        guard !inputText.trimmingCharacters(in: .whitespaces).isEmpty,
              let context = currentCoachContext() else { return }
        let text = inputText
        messages.append(CoachMessage(text: text, isUser: true))
        inputText = ""
        isTyping = true
        Task {
            let response = await generator.generateConversationResponse(message: text, context: context)
            await MainActor.run {
                self.messages.append(CoachMessage(text: response, isUser: false))
                self.isTyping = false
            }
        }
    }
    
    private func refreshInsights() async {
        guard let request = currentContextRequest() else { return }
        isLoadingInsights = true
        do {
            let remote = try await supabaseService.fetchInsights(context: request)
            insights = remote
        } catch {
            if let fallback = currentCoachContext() {
                insights = generator.generateInsights(context: fallback)
            }
        }
        isLoadingInsights = false
    }
    
    private func currentContextRequest() -> CoachContextRequest? {
        guard let dataManager = dataManager,
              let profile = profileManager,
              let settings = appSettings else { return nil }
        return CoachContextRequest(
            totalCalories: dataManager.totalCalories,
            calorieGoal: profile.calorieGoal,
            hydrationLiters: HealthKitManager.shared.todaysWaterIntake,
            fastingEnabled: settings.fastingRemindersEnabled,
            preferLocalFoods: settings.preferLocalFoods,
            locale: localization.language.rawValue
        )
    }
    
    private func currentCoachContext() -> CoachContext? {
        guard let dataManager = dataManager,
              let profile = profileManager,
              let settings = appSettings else { return nil }
        let totalProtein = dataManager.todaysMeals.reduce(0) { $0 + $1.protein }
        let totalCarbs = dataManager.todaysMeals.reduce(0) { $0 + $1.carbs }
        let totalFat = dataManager.todaysMeals.reduce(0) { $0 + $1.fat }
        let remaining = max(0, profile.calorieGoal - dataManager.totalCalories)
        return CoachContext(
            totalCalories: dataManager.totalCalories,
            calorieGoal: profile.calorieGoal,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
            hydrationLiters: HealthKitManager.shared.todaysWaterIntake,
            fastingEnabled: settings.fastingRemindersEnabled,
            preferLocalFoods: settings.preferLocalFoods,
            lastMealName: dataManager.todaysMeals.last?.name,
            remainingCalories: remaining
        )
    }
}
