//
//  AnalyticsView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Advanced analytics dashboard with charts and insights
//

import SwiftUI
import Charts

struct AnalyticsView: View {
    @StateObject private var viewModel = AnalyticsViewModel()
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: SCALDesignSystem.Spacing.xl) {
                    // Header Stats
                    headerStatsSection
                    
                    // Time Frame Selector
                    timeFrameSelector
                    
                    // Chart Type Selector
                    chartTypeSelector
                    
                    // Main Chart
                    mainChartSection
                        .premiumFeature(.advancedAnalytics)
                    
                    // Summary Statistics
                    summaryStatsSection
                    
                    // Premium Features
                    if subscriptionManager.currentTier == .free {
                        // Limited access notice
                        LimitedAccessView(
                            feature: .basicAnalytics,
                            limit: 7,
                            current: viewModel.daysSinceStart
                        ) {
                            EmptyView()
                        } premiumContent: {
                            EmptyView()
                        }
                    }
                    
                    // Weekly Insights
                    if let insights = viewModel.getAnalyticsManager().weeklyInsights {
                        weeklyInsightsSection(insights)
                            .premiumFeature(.advancedAnalytics)
                    }
                    
                    // Trends & Patterns
                    trendsSection
                        .premiumFeature(.advancedAnalytics)
                    
                    // Premium Upsell for Free Users
                    if subscriptionManager.currentTier == .free {
                        PremiumUpsellCard(
                            title: "Unlock Full Analytics",
                            description: "Get unlimited history, advanced insights, and export options",
                            features: [
                                .advancedAnalytics,
                                .unlimitedHistory,
                                .exportData
                            ],
                            ctaText: "Upgrade to Premium"
                        )
                    }
                    
                    // Action Buttons
                    actionButtonsSection
                }
                .padding(SCALDesignSystem.Spacing.screenPadding)
            }
            .background(SCALDesignSystem.Colors.background)
            .navigationTitle("Analytics")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        if subscriptionManager.hasAccess(to: .exportData) {
                            viewModel.exportData()
                        } else {
                            subscriptionManager.requestFeatureAccess(.exportData)
                        }
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "square.and.arrow.up")
                            if !subscriptionManager.hasAccess(to: .exportData) {
                                Image(systemName: "lock.fill")
                                    .font(.caption2)
                            }
                        }
                        .foregroundColor(SCALDesignSystem.Colors.primary)
                    }
                }
            }
        }
        .sheet(isPresented: $viewModel.showingDetailView) {
            if let dataPoint = viewModel.selectedDataPoint {
                DayDetailView(data: dataPoint)
            }
        }
    }
    
    // MARK: - Header Stats
    
    private var headerStatsSection: some View {
        SectionContainer(
            title: "Overview",
            subtitle: "Your nutrition at a glance",
            icon: "chart.bar.fill"
        ) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                OverviewStatCard(
                    title: "Current Streak",
                    value: "\(viewModel.getAnalyticsManager().currentStreak)",
                    subtitle: "days",
                    color: .orange,
                    icon: "flame.fill"
                )
                
                OverviewStatCard(
                    title: "Best Streak",
                    value: "\(viewModel.getAnalyticsManager().bestStreak)",
                    subtitle: "days",
                    color: .yellow,
                    icon: "star.fill"
                )
                
                OverviewStatCard(
                    title: "Total Meals",
                    value: "\(viewModel.getAnalyticsManager().totalMealsLogged)",
                    subtitle: "logged",
                    color: .green,
                    icon: "fork.knife"
                )
                
                OverviewStatCard(
                    title: "Avg Calories",
                    value: "\(viewModel.getAnalyticsManager().getAverageCaloriesForPeriod(7))",
                    subtitle: "per day",
                    color: .blue,
                    icon: "chart.line.uptrend.xyaxis"
                )
            }
        }
    }
    
    // MARK: - Time Frame Selector
    
    private var timeFrameSelector: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Time Period")
                .font(SCALDesignSystem.Typography.subheadlineBold)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
            
            HStack(spacing: 8) {
                ForEach(TimeFrame.allCases, id: \.self) { timeframe in
                    Button(action: {
                        // Check if premium is required for longer timeframes
                        let requiresPremium = timeframe == .month || timeframe == .quarter || timeframe == .year
                        if requiresPremium && !subscriptionManager.hasAccess(to: .unlimitedHistory) {
                            subscriptionManager.requestFeatureAccess(.unlimitedHistory)
                        } else {
                            withAnimation(SCALDesignSystem.Animation.quick) {
                                viewModel.selectTimeframe(timeframe)
                            }
                        }
                    }) {
                        HStack(spacing: 4) {
                            Text(timeframe.rawValue)
                                .font(SCALDesignSystem.Typography.captionBold)
                            
                            if (timeframe == .month || timeframe == .quarter || timeframe == .year) && 
                               !subscriptionManager.hasAccess(to: .unlimitedHistory) {
                                Image(systemName: "lock.fill")
                                    .font(.caption2)
                            }
                        }
                        .foregroundColor(
                            viewModel.selectedTimeframe == timeframe ?
                            .black : SCALDesignSystem.Colors.primaryText
                        )
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(
                                    viewModel.selectedTimeframe == timeframe ?
                                    SCALDesignSystem.Colors.primary :
                                    SCALDesignSystem.Colors.secondaryBackground
                                )
                        )
                        .opacity(
                            (timeframe == .month || timeframe == .quarter || timeframe == .year) && 
                            !subscriptionManager.hasAccess(to: .unlimitedHistory) ? 0.6 : 1.0
                        )
                    }
                }
                
                Spacer()
            }
        }
    }
    
    // MARK: - Chart Type Selector
    
    private var chartTypeSelector: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Metric")
                .font(SCALDesignSystem.Typography.subheadlineBold)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(ChartType.allCases, id: \.self) { chartType in
                        ChartTypeButton(
                            type: chartType,
                            isSelected: viewModel.selectedChart == chartType
                        ) {
                            withAnimation(SCALDesignSystem.Animation.quick) {
                                viewModel.selectChart(chartType)
                            }
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }
    
    // MARK: - Main Chart
    
    private var mainChartSection: some View {
        SectionContainer(
            title: viewModel.selectedChart.rawValue,
            subtitle: "\(viewModel.selectedTimeframe.rawValue.lowercased()) view",
            icon: viewModel.selectedChart.icon
        ) {
            VStack(spacing: 16) {
                // Chart
                if !viewModel.chartData.isEmpty {
                    Chart {
                        ForEach(viewModel.chartData) { data in
                            LineMark(
                                x: .value("Date", data.date),
                                y: .value(viewModel.selectedChart.rawValue, viewModel.getChartValue(for: data))
                            )
                            .foregroundStyle(viewModel.getChartColor())
                            .interpolationMethod(.catmullRom)
                            
                            AreaMark(
                                x: .value("Date", data.date),
                                y: .value(viewModel.selectedChart.rawValue, viewModel.getChartValue(for: data))
                            )
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [viewModel.getChartColor().opacity(0.3), .clear],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .interpolationMethod(.catmullRom)
                        }
                        
                        // Goal line
                        if viewModel.showGoals {
                            RuleMark(y: .value("Goal", viewModel.getGoalValue()))
                                .foregroundStyle(.orange)
                                .lineStyle(StrokeStyle(lineWidth: 2, dash: [5]))
                        }
                        
                        // Average line
                        if viewModel.showAverages {
                            RuleMark(y: .value("Average", viewModel.summaryStats.average))
                                .foregroundStyle(.blue)
                                .lineStyle(StrokeStyle(lineWidth: 1, dash: [3]))
                        }
                    }
                    .frame(height: 200)
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .day)) { _ in
                            AxisGridLine()
                            AxisTick()
                            AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                        }
                    }
                } else {
                    EmptyStateView(
                        title: "No Data Yet",
                        subtitle: "Start logging meals to see your analytics",
                        icon: "chart.bar"
                    )
                    .frame(height: 200)
                }
                
                // Chart Options
                chartOptionsView
            }
        }
    }
    
    private var chartOptionsView: some View {
        HStack {
            Toggle("Show Goals", isOn: $viewModel.showGoals)
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            
            Spacer()
            
            Toggle("Show Average", isOn: $viewModel.showAverages)
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
        }
    }
    
    // MARK: - Summary Statistics
    
    private var summaryStatsSection: some View {
        SectionContainer(
            title: "Statistics",
            subtitle: "\(viewModel.selectedTimeframe.rawValue) summary",
            icon: "number.circle.fill"
        ) {
            let stats = viewModel.summaryStats
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                StatCard(
                    title: "Average",
                    value: String(format: "%.1f", stats.average),
                    unit: viewModel.getUnit(),
                    color: .blue
                )
                
                StatCard(
                    title: "Highest",
                    value: String(format: "%.1f", stats.highest),
                    unit: viewModel.getUnit(),
                    color: .green
                )
                
                StatCard(
                    title: "Goal Achievement",
                    value: String(format: "%.0f", stats.goalAchievement),
                    unit: "%",
                    color: stats.goalAchievement >= 80 ? .green : .orange
                )
                
                StatCard(
                    title: "Trend",
                    value: stats.trend.rawValue,
                    unit: stats.trend.description,
                    color: stats.trend.color
                )
            }
        }
    }
    
    // MARK: - Weekly Insights
    
    private func weeklyInsightsSection(_ insights: WeeklyInsights) -> some View {
        SectionContainer(
            title: "Weekly Insights",
            subtitle: "Your progress this week",
            icon: "lightbulb.fill"
        ) {
            VStack(spacing: 16) {
                // Consistency Score
                HStack {
                    VStack(alignment: .leading) {
                        Text("Consistency Score")
                            .font(SCALDesignSystem.Typography.subheadlineBold)
                            .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        
                        Text(String(format: "%.0f%%", insights.consistencyScore))
                            .font(SCALDesignSystem.Typography.heroNumber)
                            .foregroundColor(SCALDesignSystem.Colors.primary)
                    }
                    
                    Spacer()
                    
                    CircularProgressView(
                        progress: insights.consistencyScore / 100,
                        color: SCALDesignSystem.Colors.primary
                    )
                    .frame(width: 60, height: 60)
                }
                
                // Achievements
                if !insights.achievements.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Achievements")
                            .font(SCALDesignSystem.Typography.subheadlineBold)
                            .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                            ForEach(insights.achievements, id: \.self) { achievement in
                                Text(achievement)
                                    .font(SCALDesignSystem.Typography.caption)
                                    .foregroundColor(SCALDesignSystem.Colors.primaryText)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(
                                        RoundedRectangle(cornerRadius: 16)
                                            .fill(SCALDesignSystem.Colors.primary.opacity(0.2))
                                    )
                            }
                        }
                    }
                }
                
                // Top Foods
                VStack(alignment: .leading, spacing: 8) {
                    Text("Top Foods This Week")
                        .font(SCALDesignSystem.Typography.subheadlineBold)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(Array(insights.topFoods.enumerated()), id: \.offset) { index, food in
                            HStack {
                                Text("\(index + 1).")
                                    .font(SCALDesignSystem.Typography.captionBold)
                                    .foregroundColor(SCALDesignSystem.Colors.primary)
                                
                                Text(food)
                                    .font(SCALDesignSystem.Typography.caption)
                                    .foregroundColor(SCALDesignSystem.Colors.primaryText)
                                
                                Spacer()
                            }
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Trends Section
    
    private var trendsSection: some View {
        SectionContainer(
            title: "Nutrition Trends",
            subtitle: "How your nutrition is changing",
            icon: "chart.line.uptrend.xyaxis"
        ) {
            if let insights = viewModel.getAnalyticsManager().weeklyInsights {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    TrendCard(
                        title: "Calories",
                        trend: insights.nutritionTrends.caloriesTrend,
                        color: SCALDesignSystem.Colors.calories
                    )
                    
                    TrendCard(
                        title: "Protein",
                        trend: insights.nutritionTrends.proteinTrend,
                        color: SCALDesignSystem.Colors.protein
                    )
                    
                    TrendCard(
                        title: "Carbs",
                        trend: insights.nutritionTrends.carbsTrend,
                        color: SCALDesignSystem.Colors.carbs
                    )
                    
                    TrendCard(
                        title: "Fat",
                        trend: insights.nutritionTrends.fatTrend,
                        color: SCALDesignSystem.Colors.fat
                    )
                }
            }
        }
    }
    
    // MARK: - Action Buttons
    
    private var actionButtonsSection: some View {
        VStack(spacing: 12) {
            PrimaryActionButton(
                "Refresh Data",
                icon: "arrow.clockwise",
                isLoading: viewModel.isLoading
            ) {
                viewModel.refreshData()
            }
            
            SecondaryActionButton(
                "Export Analytics",
                icon: "square.and.arrow.up",
                color: .blue
            ) {
                if subscriptionManager.hasAccess(to: .exportData) {
                    viewModel.exportData()
                } else {
                    subscriptionManager.requestFeatureAccess(.exportData)
                }
            }
            .requiresPremium(.exportData) {
                SecondaryActionButton(
                    "Export Analytics 🔒",
                    icon: "square.and.arrow.up",
                    color: .gray
                ) {
                    subscriptionManager.requestFeatureAccess(.exportData)
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct OverviewStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.caption)
                
                Text(title)
                    .font(SCALDesignSystem.Typography.caption)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                
                Spacer()
            }
            
            Text(value)
                .font(SCALDesignSystem.Typography.title3)
                .foregroundColor(color)
            
            Text(subtitle)
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
        }
        .scalCard()
    }
}

struct ChartTypeButton: View {
    let type: ChartType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: type.icon)
                    .font(.title3)
                    .foregroundColor(isSelected ? .black : SCALDesignSystem.Colors.primaryText)
                
                Text(type.rawValue)
                    .font(SCALDesignSystem.Typography.caption2)
                    .foregroundColor(isSelected ? .black : SCALDesignSystem.Colors.secondaryText)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        isSelected ?
                        SCALDesignSystem.Colors.primary :
                        SCALDesignSystem.Colors.secondaryBackground
                    )
            )
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            
            HStack(alignment: .bottom, spacing: 2) {
                Text(value)
                    .font(SCALDesignSystem.Typography.title3)
                    .foregroundColor(color)
                
                Text(unit)
                    .font(SCALDesignSystem.Typography.caption2)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }
        }
        .scalCard()
    }
}

struct TrendCard: View {
    let title: String
    let trend: TrendDirection
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            
            Text(trend.rawValue)
                .font(.title2)
                .foregroundColor(trend.color)
            
            Text(trend.description)
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(trend.color)
        }
        .scalCard()
    }
}

struct CircularProgressView: View {
    let progress: Double
    let color: Color
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.2), lineWidth: 6)
            
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 1), value: progress)
        }
    }
}

struct DayDetailView: View {
    let data: DailyNutritionData
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Date Header
                    Text(data.date.formatted(date: .complete, time: .omitted))
                        .font(SCALDesignSystem.Typography.title2)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    // Nutrition Overview
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                        MetricCard(
                            title: "Calories",
                            value: "\(data.calories)",
                            subtitle: "kcal",
                            color: SCALDesignSystem.Colors.calories,
                            icon: "flame.fill"
                        )
                        
                        MetricCard(
                            title: "Protein",
                            value: String(format: "%.1f", data.protein),
                            subtitle: "grams",
                            color: SCALDesignSystem.Colors.protein,
                            icon: "circle.fill"
                        )
                        
                        MetricCard(
                            title: "Carbs",
                            value: String(format: "%.1f", data.carbs),
                            subtitle: "grams",
                            color: SCALDesignSystem.Colors.carbs,
                            icon: "leaf.fill"
                        )
                        
                        MetricCard(
                            title: "Fat",
                            value: String(format: "%.1f", data.fat),
                            subtitle: "grams",
                            color: SCALDesignSystem.Colors.fat,
                            icon: "drop.fill"
                        )
                        
                        MetricCard(
                            title: "Water",
                            value: String(format: "%.1f", data.waterIntake),
                            subtitle: "liters",
                            color: SCALDesignSystem.Colors.water,
                            icon: "drop.fill"
                        )
                        
                        MetricCard(
                            title: "Meals",
                            value: "\(data.mealCount)",
                            subtitle: "logged",
                            color: .green,
                            icon: "fork.knife"
                        )
                    }
                    
                    // Balance Score
                    SectionContainer(
                        title: "Nutrition Balance",
                        icon: "scale.3d"
                    ) {
                        VStack(spacing: 16) {
                            ZStack {
                                CircularProgressView(
                                    progress: data.balanceScore / 100,
                                    color: .purple
                                )
                                .frame(width: 100, height: 100)
                                
                                VStack {
                                    Text(String(format: "%.0f", data.balanceScore))
                                        .font(SCALDesignSystem.Typography.title2)
                                        .foregroundColor(.purple)
                                    
                                    Text("Score")
                                        .font(SCALDesignSystem.Typography.caption)
                                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                                }
                            }
                            
                            Text(balanceDescription)
                                .font(SCALDesignSystem.Typography.subheadline)
                                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                                .multilineTextAlignment(.center)
                        }
                    }
                }
                .padding()
            }
            .background(SCALDesignSystem.Colors.background)
            .navigationTitle("Day Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
            }
        }
    }
    
    private var balanceDescription: String {
        switch data.balanceScore {
        case 80...100:
            return "Excellent nutrition balance! You're hitting all your macro targets."
        case 60..<80:
            return "Good balance. Consider adjusting some macros to optimize your nutrition."
        case 40..<60:
            return "Moderate balance. Try to include more variety in your meals."
        default:
            return "Focus on balanced nutrition with adequate protein, carbs, and healthy fats."
        }
    }
}

// MARK: - Preview

#if DEBUG
struct AnalyticsView_Previews: PreviewProvider {
    static var previews: some View {
        AnalyticsView()
    }
}
#endif