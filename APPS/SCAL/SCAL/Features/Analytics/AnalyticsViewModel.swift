//
//  AnalyticsViewModel.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Analytics view model for insights and data visualization
//

import SwiftUI
import Combine

@MainActor
class AnalyticsViewModel: ObservableObject {
    @Published var selectedTimeframe: TimeFrame = .week
    @Published var selectedChart: ChartType = .calories
    @Published var isLoading = false
    @Published var showingDetailView = false
    @Published var selectedDataPoint: DailyNutritionData?
    
    // Filter options
    @Published var showTrends = true
    @Published var showGoals = true
    @Published var showAverages = true
    
    // Chart data
    var chartData: [DailyNutritionData] {
        switch selectedTimeframe {
        case .week:
            return analytics.last7DaysData
        case .month:
            return analytics.last30DaysData
        case .all:
            return analytics.dailyData.sorted { $0.date < $1.date }
        }
    }
    
    // Summary statistics
    var summaryStats: SummaryStatistics {
        generateSummaryStats()
    }
    
    // Dependencies
    private let analytics = AnalyticsManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupBindings()
    }
    
    private func setupBindings() {
        analytics.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.objectWillChange.send()
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Chart Data Processing
    
    func getChartValue(for data: DailyNutritionData) -> Double {
        switch selectedChart {
        case .calories:
            return Double(data.calories)
        case .protein:
            return data.protein
        case .carbs:
            return data.carbs
        case .fat:
            return data.fat
        case .water:
            return data.waterIntake
        case .balance:
            return data.balanceScore
        }
    }
    
    func getGoalValue() -> Double {
        switch selectedChart {
        case .calories:
            return Double(analytics.nutritionGoals.calories)
        case .protein:
            return analytics.nutritionGoals.protein
        case .carbs:
            return analytics.nutritionGoals.carbs
        case .fat:
            return analytics.nutritionGoals.fat
        case .water:
            return 2.5 // 2.5L daily goal
        case .balance:
            return 100 // Perfect balance score
        }
    }
    
    func getChartColor() -> Color {
        switch selectedChart {
        case .calories: return SCALDesignSystem.Colors.calories
        case .protein: return SCALDesignSystem.Colors.protein
        case .carbs: return SCALDesignSystem.Colors.carbs
        case .fat: return SCALDesignSystem.Colors.fat
        case .water: return SCALDesignSystem.Colors.water
        case .balance: return .purple
        }
    }
    
    func getUnit() -> String {
        switch selectedChart {
        case .calories: return "cal"
        case .protein, .carbs, .fat: return "g"
        case .water: return "L"
        case .balance: return "%"
        }
    }
    
    // MARK: - Summary Statistics
    
    private func generateSummaryStats() -> SummaryStatistics {
        let data = chartData
        guard !data.isEmpty else {
            return SummaryStatistics(
                average: 0,
                total: 0,
                highest: 0,
                lowest: 0,
                trend: .stable,
                goalAchievement: 0
            )
        }
        
        let values = data.map { getChartValue(for: $0) }
        let average = values.reduce(0, +) / Double(values.count)
        let total = values.reduce(0, +)
        let highest = values.max() ?? 0
        let lowest = values.min() ?? 0
        
        // Calculate trend
        let trend = calculateTrend(from: values)
        
        // Goal achievement percentage
        let goalValue = getGoalValue()
        let goalAchievement = goalValue > 0 ? (average / goalValue) * 100 : 0
        
        return SummaryStatistics(
            average: average,
            total: total,
            highest: highest,
            lowest: lowest,
            trend: trend,
            goalAchievement: goalAchievement
        )
    }
    
    private func calculateTrend(from values: [Double]) -> TrendDirection {
        guard values.count >= 4 else { return .stable }
        
        let firstHalf = Array(values.prefix(values.count / 2))
        let secondHalf = Array(values.suffix(values.count - values.count / 2))
        
        let firstAvg = firstHalf.reduce(0, +) / Double(firstHalf.count)
        let secondAvg = secondHalf.reduce(0, +) / Double(secondHalf.count)
        
        if secondAvg > firstAvg * 1.1 {
            return .increasing
        } else if secondAvg < firstAvg * 0.9 {
            return .decreasing
        } else {
            return .stable
        }
    }
    
    // MARK: - Actions
    
    func selectTimeframe(_ timeframe: TimeFrame) {
        selectedTimeframe = timeframe
    }
    
    func selectChart(_ chartType: ChartType) {
        selectedChart = chartType
    }
    
    func selectDataPoint(_ data: DailyNutritionData) {
        selectedDataPoint = data
        showingDetailView = true
    }
    
    func refreshData() {
        isLoading = true
        
        // Simulate data refresh
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.isLoading = false
        }
    }
    
    func exportData() {
        // Generate CSV export
        var csvContent = "Date,Calories,Protein,Carbs,Fat,Water,Meals\n"
        
        for data in chartData {
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .short
            
            csvContent += "\(dateFormatter.string(from: data.date)),\(data.calories),\(data.protein),\(data.carbs),\(data.fat),\(data.waterIntake),\(data.mealCount)\n"
        }
        
        // Save to documents
        if let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let fileName = "SCAL_Analytics_\(selectedTimeframe.rawValue)_\(Date().formatted(date: .abbreviated, time: .omitted)).csv"
            let fileURL = documentsPath.appendingPathComponent(fileName)
            
            do {
                try csvContent.write(to: fileURL, atomically: true, encoding: .utf8)
                print("Analytics data exported to: \(fileURL)")
            } catch {
                print("Failed to export data: \(error)")
            }
        }
    }
    
    // MARK: - Getters
    
    func getAnalyticsManager() -> AnalyticsManager {
        return analytics
    }
}

// MARK: - Supporting Models

enum TimeFrame: String, CaseIterable {
    case week = "Week"
    case month = "Month"
    case all = "All Time"
    
    var days: Int {
        switch self {
        case .week: return 7
        case .month: return 30
        case .all: return 365
        }
    }
}

enum ChartType: String, CaseIterable {
    case calories = "Calories"
    case protein = "Protein"
    case carbs = "Carbs"
    case fat = "Fat"
    case water = "Water"
    case balance = "Balance"
    
    var icon: String {
        switch self {
        case .calories: return "flame.fill"
        case .protein: return "circle.fill"
        case .carbs: return "leaf.fill"
        case .fat: return "drop.fill"
        case .water: return "drop.fill"
        case .balance: return "scale.3d"
        }
    }
}

struct SummaryStatistics {
    let average: Double
    let total: Double
    let highest: Double
    let lowest: Double
    let trend: TrendDirection
    let goalAchievement: Double
}