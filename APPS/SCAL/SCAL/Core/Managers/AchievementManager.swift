//
//  AchievementManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Achievement and gamification system manager
//

import SwiftUI
import Foundation

// MARK: - Achievement Models

struct Achievement: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let icon: String
    let category: AchievementCategory
    let difficulty: AchievementDifficulty
    let maxProgress: Int
    let rewards: [AchievementReward]
    let requirements: AchievementRequirements
    let isHidden: Bool // Hidden until unlocked
    
    var isCompleted: Bool {
        currentProgress >= maxProgress
    }
    
    var progressPercentage: Double {
        guard maxProgress > 0 else { return 0 }
        return min(Double(currentProgress) / Double(maxProgress), 1.0)
    }
    
    // Current progress (stored separately)
    var currentProgress: Int = 0
    var unlockedDate: Date?
    var lastProgressDate: Date?
}

enum AchievementCategory: String, CaseIterable, Codable {
    case streak = "Streak"
    case nutrition = "Nutrition"
    case meals = "Meals"
    case social = "Social"
    case exploration = "Exploration"
    case health = "Health"
    case challenges = "Challenges"
    
    var icon: String {
        switch self {
        case .streak: return "flame.fill"
        case .nutrition: return "chart.bar.fill"
        case .meals: return "fork.knife"
        case .social: return "person.2.fill"
        case .exploration: return "map.fill"
        case .health: return "heart.fill"
        case .challenges: return "trophy.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .streak: return .orange
        case .nutrition: return .green
        case .meals: return .blue
        case .social: return .purple
        case .exploration: return .cyan
        case .health: return .red
        case .challenges: return .yellow
        }
    }
}

enum AchievementDifficulty: String, CaseIterable, Codable {
    case bronze = "Bronze"
    case silver = "Silver"
    case gold = "Gold"
    case platinum = "Platinum"
    case legendary = "Legendary"
    
    var icon: String {
        switch self {
        case .bronze: return "🥉"
        case .silver: return "🥈"
        case .gold: return "🥇"
        case .platinum: return "💎"
        case .legendary: return "👑"
        }
    }
    
    var points: Int {
        switch self {
        case .bronze: return 10
        case .silver: return 25
        case .gold: return 50
        case .platinum: return 100
        case .legendary: return 250
        }
    }
    
    var color: Color {
        switch self {
        case .bronze: return Color(red: 0.8, green: 0.5, blue: 0.2)
        case .silver: return Color(red: 0.75, green: 0.75, blue: 0.75)
        case .gold: return Color(red: 1.0, green: 0.84, blue: 0.0)
        case .platinum: return Color(red: 0.9, green: 0.9, blue: 1.0)
        case .legendary: return Color(red: 1.0, green: 0.2, blue: 0.8)
        }
    }
}

struct AchievementRequirements: Codable {
    let type: RequirementType
    let target: Int
    let timeframe: TimeFrame?
    let conditions: [String]? // Additional conditions
    
    enum RequirementType: String, Codable {
        case dailyStreak = "Daily Streak"
        case totalMeals = "Total Meals"
        case calorieGoal = "Calorie Goal"
        case proteinGoal = "Protein Goal"
        case waterIntake = "Water Intake"
        case foodVariety = "Food Variety"
        case perfectDays = "Perfect Days"
        case weeklyConsistency = "Weekly Consistency"
        case socialSharing = "Social Sharing"
    }
    
    enum TimeFrame: String, Codable {
        case daily = "Daily"
        case weekly = "Weekly"
        case monthly = "Monthly"
        case allTime = "All Time"
    }
}

struct AchievementReward: Codable {
    let type: RewardType
    let value: Int
    let description: String
    
    enum RewardType: String, Codable {
        case points = "Points"
        case badge = "Badge"
        case title = "Title"
        case theme = "Theme"
        case feature = "Feature"
    }
}

struct UserProgress: Codable {
    var totalPoints: Int = 0
    var currentLevel: Int = 1
    var currentStreak: Int = 0
    var bestStreak: Int = 0
    var totalMealsLogged: Int = 0
    var perfectDays: Int = 0
    var achievementProgress: [String: AchievementProgress] = [:]
    var unlockedTitles: [String] = []
    var unlockedThemes: [String] = []
    var selectedTitle: String?
    var selectedTheme: String?
    
    var pointsToNextLevel: Int {
        let nextLevelPoints = levelRequiredPoints(level: currentLevel + 1)
        return max(0, nextLevelPoints - totalPoints)
    }
    
    var levelProgress: Double {
        let currentLevelPoints = levelRequiredPoints(level: currentLevel)
        let nextLevelPoints = levelRequiredPoints(level: currentLevel + 1)
        let progressPoints = totalPoints - currentLevelPoints
        let levelRange = nextLevelPoints - currentLevelPoints
        
        return levelRange > 0 ? Double(progressPoints) / Double(levelRange) : 0
    }
    
    private func levelRequiredPoints(level: Int) -> Int {
        // Exponential point requirements: Level 1: 0, Level 2: 100, Level 3: 250, etc.
        return Int(pow(Double(level - 1), 2) * 100)
    }
}

struct AchievementProgress: Codable {
    var currentProgress: Int = 0
    var isCompleted: Bool = false
    var completedDate: Date?
    var lastUpdateDate: Date = Date()
}

// MARK: - Achievement Manager

@MainActor
class AchievementManager: ObservableObject {
    static let shared = AchievementManager()
    
    @Published var availableAchievements: [Achievement] = []
    @Published var userProgress = UserProgress()
    @Published var recentlyUnlocked: [Achievement] = []
    @Published var showingCelebration = false
    @Published var celebrationAchievement: Achievement?
    
    // Filtering and sorting
    @Published var selectedCategory: AchievementCategory?
    @Published var showCompletedOnly = false
    @Published var sortBy: AchievementSortOption = .category
    
    private let userDefaults = UserDefaults.standard
    private let achievementsKey = "achievements"
    private let progressKey = "userProgress"
    
    init() {
        loadData()
        generateAchievements()
    }
    
    // MARK: - Achievement Generation
    
    private func generateAchievements() {
        availableAchievements = [
            // Streak Achievements
            Achievement(
                id: "first_day",
                title: "Getting Started",
                description: "Log your first meal of the journey",
                icon: "star.fill",
                category: .streak,
                difficulty: .bronze,
                maxProgress: 1,
                rewards: [AchievementReward(type: .points, value: 10, description: "10 points")],
                requirements: AchievementRequirements(type: .totalMeals, target: 1, timeframe: nil),
                isHidden: false
            ),
            
            Achievement(
                id: "three_day_streak",
                title: "Building Habits",
                description: "Log meals for 3 consecutive days",
                icon: "flame.fill",
                category: .streak,
                difficulty: .bronze,
                maxProgress: 3,
                rewards: [AchievementReward(type: .points, value: 25, description: "25 points")],
                requirements: AchievementRequirements(type: .dailyStreak, target: 3, timeframe: nil),
                isHidden: false
            ),
            
            Achievement(
                id: "week_warrior",
                title: "Week Warrior",
                description: "Maintain a 7-day logging streak",
                icon: "calendar.badge.checkmark",
                category: .streak,
                difficulty: .silver,
                maxProgress: 7,
                rewards: [
                    AchievementReward(type: .points, value: 50, description: "50 points"),
                    AchievementReward(type: .title, value: 1, description: "Week Warrior title")
                ],
                requirements: AchievementRequirements(type: .dailyStreak, target: 7, timeframe: nil),
                isHidden: false
            ),
            
            Achievement(
                id: "month_master",
                title: "Month Master",
                description: "Log meals consistently for 30 days",
                icon: "crown.fill",
                category: .streak,
                difficulty: .gold,
                maxProgress: 30,
                rewards: [
                    AchievementReward(type: .points, value: 100, description: "100 points"),
                    AchievementReward(type: .title, value: 1, description: "Month Master title"),
                    AchievementReward(type: .theme, value: 1, description: "Golden theme")
                ],
                requirements: AchievementRequirements(type: .dailyStreak, target: 30, timeframe: nil),
                isHidden: false
            ),
            
            // Nutrition Achievements
            Achievement(
                id: "protein_power",
                title: "Protein Power",
                description: "Hit your protein goal 5 times",
                icon: "bolt.fill",
                category: .nutrition,
                difficulty: .bronze,
                maxProgress: 5,
                rewards: [AchievementReward(type: .points, value: 30, description: "30 points")],
                requirements: AchievementRequirements(type: .proteinGoal, target: 5, timeframe: nil),
                isHidden: false
            ),
            
            Achievement(
                id: "calorie_champion",
                title: "Calorie Champion",
                description: "Meet your calorie goal 10 times",
                icon: "target",
                category: .nutrition,
                difficulty: .silver,
                maxProgress: 10,
                rewards: [
                    AchievementReward(type: .points, value: 60, description: "60 points"),
                    AchievementReward(type: .title, value: 1, description: "Calorie Champion title")
                ],
                requirements: AchievementRequirements(type: .calorieGoal, target: 10, timeframe: nil),
                isHidden: false
            ),
            
            Achievement(
                id: "hydration_hero",
                title: "Hydration Hero",
                description: "Drink 2.5L+ of water for 7 days",
                icon: "drop.fill",
                category: .health,
                difficulty: .silver,
                maxProgress: 7,
                rewards: [
                    AchievementReward(type: .points, value: 40, description: "40 points"),
                    AchievementReward(type: .title, value: 1, description: "Hydration Hero title")
                ],
                requirements: AchievementRequirements(type: .waterIntake, target: 7, timeframe: .daily),
                isHidden: false
            ),
            
            // Meal Achievements
            Achievement(
                id: "hundred_meals",
                title: "Century Club",
                description: "Log 100 total meals",
                icon: "100.square.fill",
                category: .meals,
                difficulty: .gold,
                maxProgress: 100,
                rewards: [
                    AchievementReward(type: .points, value: 75, description: "75 points"),
                    AchievementReward(type: .title, value: 1, description: "Century Club member")
                ],
                requirements: AchievementRequirements(type: .totalMeals, target: 100, timeframe: .allTime),
                isHidden: false
            ),
            
            Achievement(
                id: "food_explorer",
                title: "Food Explorer",
                description: "Try 50 different foods",
                icon: "map.fill",
                category: .exploration,
                difficulty: .silver,
                maxProgress: 50,
                rewards: [
                    AchievementReward(type: .points, value: 80, description: "80 points"),
                    AchievementReward(type: .title, value: 1, description: "Food Explorer title")
                ],
                requirements: AchievementRequirements(type: .foodVariety, target: 50, timeframe: .allTime),
                isHidden: false
            ),
            
            // Perfect Day Achievements
            Achievement(
                id: "perfect_day",
                title: "Perfect Day",
                description: "Hit all nutrition goals in one day",
                icon: "checkmark.circle.fill",
                category: .nutrition,
                difficulty: .silver,
                maxProgress: 1,
                rewards: [AchievementReward(type: .points, value: 50, description: "50 points")],
                requirements: AchievementRequirements(type: .perfectDays, target: 1, timeframe: .daily),
                isHidden: false
            ),
            
            Achievement(
                id: "perfect_week",
                title: "Perfect Week",
                description: "Achieve 7 perfect days in a row",
                icon: "star.circle.fill",
                category: .challenges,
                difficulty: .platinum,
                maxProgress: 7,
                rewards: [
                    AchievementReward(type: .points, value: 200, description: "200 points"),
                    AchievementReward(type: .title, value: 1, description: "Perfectionist title"),
                    AchievementReward(type: .theme, value: 1, description: "Platinum theme")
                ],
                requirements: AchievementRequirements(type: .perfectDays, target: 7, timeframe: nil),
                isHidden: false
            ),
            
            // Hidden/Legendary Achievements
            Achievement(
                id: "nutrition_master",
                title: "Nutrition Master",
                description: "Achieve perfect nutrition balance for 30 days",
                icon: "crown.fill",
                category: .challenges,
                difficulty: .legendary,
                maxProgress: 30,
                rewards: [
                    AchievementReward(type: .points, value: 500, description: "500 points"),
                    AchievementReward(type: .title, value: 1, description: "Nutrition Master title"),
                    AchievementReward(type: .theme, value: 1, description: "Master theme")
                ],
                requirements: AchievementRequirements(type: .perfectDays, target: 30, timeframe: nil),
                isHidden: true
            )
        ]
        
        // Load saved progress for each achievement
        for index in availableAchievements.indices {
            let achievementId = availableAchievements[index].id
            if let progress = userProgress.achievementProgress[achievementId] {
                availableAchievements[index].currentProgress = progress.currentProgress
                availableAchievements[index].unlockedDate = progress.completedDate
            }
        }
    }
    
    // MARK: - Progress Tracking
    
    func updateProgress(for type: AchievementRequirements.RequirementType, value: Int = 1, context: [String: Any] = [:]) {
        let relevantAchievements = availableAchievements.filter { achievement in
            achievement.requirements.type == type && !achievement.isCompleted
        }
        
        var newlyCompleted: [Achievement] = []
        
        for achievement in relevantAchievements {
            let achievementId = achievement.id
            var progress = userProgress.achievementProgress[achievementId] ?? AchievementProgress()
            
            // Update progress based on type
            switch type {
            case .totalMeals, .foodVariety:
                progress.currentProgress = value
            case .dailyStreak, .perfectDays, .proteinGoal, .calorieGoal, .waterIntake:
                progress.currentProgress = min(progress.currentProgress + 1, achievement.maxProgress)
            default:
                progress.currentProgress += value
            }
            
            progress.lastUpdateDate = Date()
            
            // Check if completed
            if !progress.isCompleted && progress.currentProgress >= achievement.maxProgress {
                progress.isCompleted = true
                progress.completedDate = Date()
                
                // Update achievement
                if let index = availableAchievements.firstIndex(where: { $0.id == achievementId }) {
                    availableAchievements[index].currentProgress = progress.currentProgress
                    availableAchievements[index].unlockedDate = progress.completedDate
                    newlyCompleted.append(availableAchievements[index])
                }
                
                // Award points
                awardPoints(from: achievement)
            } else {
                // Update current progress
                if let index = availableAchievements.firstIndex(where: { $0.id == achievementId }) {
                    availableAchievements[index].currentProgress = progress.currentProgress
                }
            }
            
            userProgress.achievementProgress[achievementId] = progress
        }
        
        // Show celebration for newly completed achievements
        if !newlyCompleted.isEmpty {
            showAchievementCelebration(newlyCompleted)
        }
        
        saveData()
    }
    
    private func awardPoints(from achievement: Achievement) {
        let points = achievement.rewards.reduce(0) { total, reward in
            reward.type == .points ? total + reward.value : total
        }
        
        userProgress.totalPoints += points
        
        // Check for level up
        let oldLevel = userProgress.currentLevel
        userProgress.currentLevel = calculateLevel(from: userProgress.totalPoints)
        
        if userProgress.currentLevel > oldLevel {
            showLevelUpCelebration(newLevel: userProgress.currentLevel)
        }
        
        // Unlock titles and themes
        for reward in achievement.rewards {
            switch reward.type {
            case .title:
                let title = "\(achievement.title) \(achievement.difficulty.icon)"
                if !userProgress.unlockedTitles.contains(title) {
                    userProgress.unlockedTitles.append(title)
                }
            case .theme:
                let theme = "\(achievement.difficulty.rawValue) Theme"
                if !userProgress.unlockedThemes.contains(theme) {
                    userProgress.unlockedThemes.append(theme)
                }
            default:
                break
            }
        }
    }
    
    private func calculateLevel(from points: Int) -> Int {
        var level = 1
        var requiredPoints = 0
        
        while points >= requiredPoints {
            level += 1
            requiredPoints = Int(pow(Double(level - 1), 2) * 100)
        }
        
        return level - 1
    }
    
    // MARK: - Celebrations
    
    private func showAchievementCelebration(_ achievements: [Achievement]) {
        recentlyUnlocked = achievements
        celebrationAchievement = achievements.first
        showingCelebration = true
        
        // Auto-dismiss after 5 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            self.showingCelebration = false
        }
    }
    
    private func showLevelUpCelebration(newLevel: Int) {
        // Create a special "level up" achievement for celebration
        let levelUpAchievement = Achievement(
            id: "level_\(newLevel)",
            title: "Level \(newLevel) Reached!",
            description: "You've reached level \(newLevel)!",
            icon: "arrow.up.circle.fill",
            category: .challenges,
            difficulty: .gold,
            maxProgress: 1,
            rewards: [],
            requirements: AchievementRequirements(type: .totalMeals, target: 1, timeframe: nil),
            isHidden: false
        )
        
        celebrationAchievement = levelUpAchievement
        showingCelebration = true
        
        // Auto-dismiss after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.showingCelebration = false
        }
    }
    
    // MARK: - Data Management
    
    func getFilteredAchievements() -> [Achievement] {
        var filtered = availableAchievements
        
        // Filter by category
        if let selectedCategory = selectedCategory {
            filtered = filtered.filter { $0.category == selectedCategory }
        }
        
        // Filter by completion status
        if showCompletedOnly {
            filtered = filtered.filter { $0.isCompleted }
        }
        
        // Filter hidden achievements
        filtered = filtered.filter { !$0.isHidden || $0.isCompleted }
        
        // Sort
        switch sortBy {
        case .category:
            filtered.sort { $0.category.rawValue < $1.category.rawValue }
        case .difficulty:
            filtered.sort { $0.difficulty.points < $1.difficulty.points }
        case .progress:
            filtered.sort { $0.progressPercentage > $1.progressPercentage }
        case .name:
            filtered.sort { $0.title < $1.title }
        }
        
        return filtered
    }
    
    func getAchievementsByCategory() -> [AchievementCategory: [Achievement]] {
        let filtered = getFilteredAchievements()
        return Dictionary(grouping: filtered) { $0.category }
    }
    
    func getProgressSummary() -> AchievementProgressSummary {
        let completed = availableAchievements.filter { $0.isCompleted }.count
        let total = availableAchievements.filter { !$0.isHidden || $0.isCompleted }.count
        
        let completionRate = total > 0 ? Double(completed) / Double(total) : 0
        
        return AchievementProgressSummary(
            totalAchievements: total,
            completedAchievements: completed,
            completionRate: completionRate,
            totalPoints: userProgress.totalPoints,
            currentLevel: userProgress.currentLevel,
            currentStreak: userProgress.currentStreak
        )
    }
    
    // MARK: - User Actions
    
    func selectTitle(_ title: String) {
        userProgress.selectedTitle = title
        saveData()
    }
    
    func selectTheme(_ theme: String) {
        userProgress.selectedTheme = theme
        saveData()
    }
    
    func dismissCelebration() {
        showingCelebration = false
        celebrationAchievement = nil
    }
    
    // MARK: - Data Persistence
    
    private func saveData() {
        if let encoded = try? JSONEncoder().encode(userProgress) {
            userDefaults.set(encoded, forKey: progressKey)
        }
    }
    
    private func loadData() {
        if let data = userDefaults.data(forKey: progressKey),
           let decoded = try? JSONDecoder().decode(UserProgress.self, from: data) {
            userProgress = decoded
        }
    }
    
    // MARK: - Integration Points
    
    func onMealLogged(_ meal: SimpleMeal) {
        userProgress.totalMealsLogged += 1
        updateProgress(for: .totalMeals, value: userProgress.totalMealsLogged)
    }
    
    func onStreakUpdated(_ streak: Int) {
        userProgress.currentStreak = streak
        userProgress.bestStreak = max(userProgress.bestStreak, streak)
        updateProgress(for: .dailyStreak, value: streak)
    }
    
    func onGoalAchieved(type: String) {
        switch type {
        case "calories":
            updateProgress(for: .calorieGoal)
        case "protein":
            updateProgress(for: .proteinGoal)
        case "water":
            updateProgress(for: .waterIntake)
        case "perfect_day":
            userProgress.perfectDays += 1
            updateProgress(for: .perfectDays)
        default:
            break
        }
    }
}

// MARK: - Supporting Models

enum AchievementSortOption: String, CaseIterable {
    case category = "Category"
    case difficulty = "Difficulty"
    case progress = "Progress"
    case name = "Name"
}

struct AchievementProgressSummary {
    let totalAchievements: Int
    let completedAchievements: Int
    let completionRate: Double
    let totalPoints: Int
    let currentLevel: Int
    let currentStreak: Int
}