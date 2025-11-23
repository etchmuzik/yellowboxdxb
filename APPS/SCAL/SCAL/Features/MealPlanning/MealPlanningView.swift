//
//  MealPlanningView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  AI-powered meal planning interface
//

import SwiftUI

struct MealPlanningView: View {
    @StateObject private var viewModel: MealPlanningViewModel
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Environment(\.dismiss) private var dismiss
    
    init(userProfileManager: UserProfileManager) {
        self._viewModel = StateObject(wrappedValue: MealPlanningViewModel(
            userProfileManager: userProfileManager
        ))
    }
    
    var body: some View {
        NavigationView {
            if subscriptionManager.hasAccess(to: .mealPlanning) {
                VStack(spacing: 0) {
                    // Tab selector
                    tabSelector
                    
                    // Main content
                    TabView(selection: $viewModel.selectedTab) {
                        overviewTab
                            .tag(PlanningTab.overview)
                        
                        currentPlanTab
                            .tag(PlanningTab.currentPlan)
                        
                        recommendationsTab
                            .tag(PlanningTab.recommendations)
                        
                        libraryTab
                            .tag(PlanningTab.library)
                    }
                    .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                }
            } else {
                // Premium required view
                PremiumContentWrapper(
                    requiredTier: .premium,
                    feature: .mealPlanning
                ) {
                    EmptyView()
                }
            }
            .background(SCALDesignSystem.Colors.background)
            .navigationTitle("Meal Planning")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: viewModel.showPreferences) {
                        Image(systemName: "gear")
                            .foregroundColor(SCALDesignSystem.Colors.primary)
                    }
                }
            }
        }
        .sheet(isPresented: $viewModel.showingPlanGenerator) {
            if subscriptionManager.hasAccess(to: .mealPlanning) {
                PlanGeneratorView(viewModel: viewModel)
            }
        }
        .sheet(isPresented: $viewModel.showingPreferences) {
            MealPlanPreferencesView(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showingMealDetail) {
            if let meal = viewModel.selectedMeal {
                MealDetailView(meal: meal, viewModel: viewModel)
            }
        }
    }
    
    // MARK: - Tab Selector
    
    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(PlanningTab.allCases, id: \.self) { tab in
                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            viewModel.selectTab(tab)
                        }
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: tab.icon)
                                .font(.caption)
                            
                            Text(tab.rawValue)
                                .font(SCALDesignSystem.Typography.captionBold)
                        }
                        .foregroundColor(
                            viewModel.selectedTab == tab ? .black : SCALDesignSystem.Colors.primaryText
                        )
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(
                                    viewModel.selectedTab == tab ?
                                    SCALDesignSystem.Colors.primary :
                                    SCALDesignSystem.Colors.secondaryBackground
                                )
                        )
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(SCALDesignSystem.Colors.secondaryBackground.opacity(0.5))
    }
    
    // MARK: - Overview Tab
    
    private var overviewTab: some View {
        ScrollView {
            VStack(spacing: SCALDesignSystem.Spacing.xl) {
                // Quick stats
                quickStatsSection
                
                // Today's planned meals
                todaysPlannedMealsSection
                
                // Plan statistics
                planStatisticsSection
                
                // Quick actions
                quickActionsSection
            }
            .padding(SCALDesignSystem.Spacing.screenPadding)
        }
    }
    
    private var quickStatsSection: some View {
        SectionContainer(
            title: "Overview",
            subtitle: "Your meal planning at a glance",
            icon: "chart.pie.fill"
        ) {
            let stats = viewModel.getPlanStatistics()
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                StatCard(
                    title: "Active Plan",
                    value: viewModel.getMealPlanningManager().currentPlan?.name ?? "None",
                    unit: "",
                    color: .blue
                )
                
                StatCard(
                    title: "Total Meals",
                    value: "\(stats.totalMeals)",
                    unit: "planned",
                    color: .green
                )
                
                StatCard(
                    title: "Avg Calories",
                    value: "\(stats.averageCalories)",
                    unit: "per meal",
                    color: .orange
                )
                
                StatCard(
                    title: "Prep Time",
                    value: "\(stats.averagePrepTime)",
                    unit: "min avg",
                    color: .purple
                )
            }
        }
    }
    
    private var todaysPlannedMealsSection: some View {
        SectionContainer(
            title: "Today's Plan",
            subtitle: "Meals planned for today",
            icon: "calendar.circle.fill",
            headerAction: {
                viewModel.selectTab(.currentPlan)
            },
            headerActionTitle: "View All"
        ) {
            let todaysMeals = viewModel.getTodaysPlannedMeals()
            
            if todaysMeals.isEmpty {
                EmptyStateView(
                    title: "No meals planned",
                    subtitle: "Generate a meal plan to see today's recommendations",
                    icon: "calendar.badge.plus",
                    actionTitle: "Create Plan",
                    action: viewModel.generateNewPlan
                )
                .frame(height: 150)
            } else {
                VStack(spacing: 12) {
                    ForEach(todaysMeals.prefix(3)) { meal in
                        PlannedMealCard(meal: meal) {
                            viewModel.showMealDetail(meal)
                        } onAdd: {
                            viewModel.addMealToToday(meal)
                        }
                    }
                }
            }
        }
    }
    
    private var planStatisticsSection: some View {
        SectionContainer(
            title: "Nutrition Balance",
            subtitle: "Current plan analysis",
            icon: "scale.3d"
        ) {
            let stats = viewModel.getPlanStatistics()
            let balance = stats.nutritionBalance
            
            VStack(spacing: 16) {
                // Balance score
                HStack {
                    VStack(alignment: .leading) {
                        Text("Balance Score")
                            .font(SCALDesignSystem.Typography.subheadlineBold)
                            .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        
                        Text(String(format: "%.0f%%", balance.balanceScore * 100))
                            .font(SCALDesignSystem.Typography.heroNumber)
                            .foregroundColor(balance.isBalanced ? .green : .orange)
                    }
                    
                    Spacer()
                    
                    CircularProgressView(
                        progress: balance.balanceScore,
                        color: balance.isBalanced ? .green : .orange
                    )
                    .frame(width: 60, height: 60)
                }
                
                // Macro breakdown
                VStack(spacing: 8) {
                    MacroBreakdownBar(
                        title: "Protein",
                        percentage: balance.protein,
                        color: SCALDesignSystem.Colors.protein
                    )
                    
                    MacroBreakdownBar(
                        title: "Carbs",
                        percentage: balance.carbs,
                        color: SCALDesignSystem.Colors.carbs
                    )
                    
                    MacroBreakdownBar(
                        title: "Fat",
                        percentage: balance.fat,
                        color: SCALDesignSystem.Colors.fat
                    )
                }
            }
        }
    }
    
    private var quickActionsSection: some View {
        VStack(spacing: 12) {
            PrimaryActionButton(
                "Generate New Plan",
                icon: "wand.and.stars",
                isLoading: viewModel.getMealPlanningManager().isGenerating
            ) {
                viewModel.generateNewPlan()
            }
            
            HStack(spacing: 12) {
                SecondaryActionButton(
                    "Preferences",
                    icon: "slider.horizontal.3",
                    color: .blue
                ) {
                    viewModel.showPreferences()
                }
                
                SecondaryActionButton(
                    "Recommendations",
                    icon: "star.circle",
                    color: .purple
                ) {
                    viewModel.selectTab(.recommendations)
                }
            }
        }
    }
    
    // MARK: - Current Plan Tab
    
    private var currentPlanTab: some View {
        ScrollView {
            VStack(spacing: SCALDesignSystem.Spacing.xl) {
                if let currentPlan = viewModel.getMealPlanningManager().currentPlan {
                    currentPlanView(currentPlan)
                } else {
                    EmptyStateView(
                        title: "No Active Plan",
                        subtitle: "Create your first AI-generated meal plan to get started",
                        icon: "calendar.badge.plus",
                        actionTitle: "Generate Plan",
                        action: viewModel.generateNewPlan
                    )
                }
            }
            .padding(SCALDesignSystem.Spacing.screenPadding)
        }
    }
    
    private func currentPlanView(_ plan: MealPlan) -> some View {
        VStack(spacing: SCALDesignSystem.Spacing.xl) {
            // Plan header
            planHeaderSection(plan)
            
            // Daily meal breakdown
            dailyMealBreakdown(plan)
        }
    }
    
    private func planHeaderSection(_ plan: MealPlan) -> some View {
        SectionContainer(
            title: plan.name,
            subtitle: plan.description,
            icon: "calendar.circle.fill"
        ) {
            VStack(spacing: 16) {
                // Plan details
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    PlanDetailCard(title: "Duration", value: "\(plan.duration)", unit: "days", color: .blue)
                    PlanDetailCard(title: "Cuisine", value: plan.cuisineType.flag, unit: plan.cuisineType.rawValue, color: .green)
                    PlanDetailCard(title: "Difficulty", value: "👩‍🍳", unit: plan.difficulty.rawValue, color: .orange)
                    PlanDetailCard(title: "Prep Time", value: "\(plan.averagePreparationTime)", unit: "min avg", color: .purple)
                }
                
                // Plan tags
                if !plan.tags.isEmpty {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 8) {
                        ForEach(plan.tags, id: \.self) { tag in
                            Text(tag)
                                .font(SCALDesignSystem.Typography.caption2)
                                .foregroundColor(SCALDesignSystem.Colors.primaryText)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(SCALDesignSystem.Colors.primary.opacity(0.2))
                                )
                        }
                    }
                }
            }
        }
    }
    
    private func dailyMealBreakdown(_ plan: MealPlan) -> some View {
        SectionContainer(
            title: "Daily Meals",
            subtitle: "\(plan.duration)-day meal breakdown",
            icon: "list.bullet.circle.fill"
        ) {
            let dailyMeals = plan.dailyMeals
            
            ForEach(Array(dailyMeals.enumerated()), id: \.offset) { dayIndex, dayMeals in
                VStack(alignment: .leading, spacing: 8) {
                    Text("Day \(dayIndex + 1)")
                        .font(SCALDesignSystem.Typography.subheadlineBold)
                        .foregroundColor(SCALDesignSystem.Colors.primary)
                    
                    ForEach(dayMeals) { meal in
                        PlannedMealRow(meal: meal) {
                            viewModel.showMealDetail(meal)
                        } onAdd: {
                            viewModel.addMealToToday(meal)
                        }
                    }
                }
                .padding(.vertical, 8)
                
                if dayIndex < dailyMeals.count - 1 {
                    Divider()
                        .background(SCALDesignSystem.Colors.secondaryBackground)
                }
            }
        }
    }
    
    // MARK: - Recommendations Tab
    
    private var recommendationsTab: some View {
        ScrollView {
            VStack(spacing: SCALDesignSystem.Spacing.xl) {
                // Meal type selector
                mealTypeRecommendations
                
                // AI suggestions
                aiSuggestionsSection
            }
            .padding(SCALDesignSystem.Spacing.screenPadding)
        }
    }
    
    private var mealTypeRecommendations: some View {
        SectionContainer(
            title: "Meal Recommendations",
            subtitle: "AI-powered suggestions for each meal type",
            icon: "star.fill"
        ) {
            VStack(spacing: 16) {
                ForEach(MealType.allCases, id: \.self) { mealType in
                    Button(action: {
                        viewModel.generateRecommendations(for: mealType)
                    }) {
                        HStack {
                            Image(systemName: mealType.icon)
                                .foregroundColor(mealType.color)
                                .font(.title2)
                            
                            VStack(alignment: .leading) {
                                Text(mealType.rawValue)
                                    .font(SCALDesignSystem.Typography.subheadlineBold)
                                    .foregroundColor(SCALDesignSystem.Colors.primaryText)
                                
                                Text("Get personalized recommendations")
                                    .font(SCALDesignSystem.Typography.caption)
                                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "chevron.right")
                                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(SCALDesignSystem.Colors.secondaryBackground)
                        )
                    }
                }
            }
        }
    }
    
    private var aiSuggestionsSection: some View {
        SectionContainer(
            title: "AI Suggestions",
            subtitle: "Based on your preferences and history",
            icon: "brain.head.profile"
        ) {
            let recommendations = viewModel.getMealPlanningManager().recommendations
            
            if recommendations.isEmpty {
                EmptyStateView(
                    title: "No Suggestions Yet",
                    subtitle: "Select a meal type above to get personalized recommendations",
                    icon: "wand.and.stars"
                )
                .frame(height: 150)
            } else {
                VStack(spacing: 12) {
                    ForEach(recommendations) { meal in
                        PlannedMealCard(meal: meal) {
                            viewModel.showMealDetail(meal)
                        } onAdd: {
                            viewModel.addMealToToday(meal)
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Library Tab
    
    private var libraryTab: some View {
        ScrollView {
            VStack(spacing: SCALDesignSystem.Spacing.xl) {
                // Available plans
                availablePlansSection
                
                // Generate new plan
                generatePlanSection
            }
            .padding(SCALDesignSystem.Spacing.screenPadding)
        }
    }
    
    private var availablePlansSection: some View {
        SectionContainer(
            title: "Meal Plan Library",
            subtitle: "Your saved and generated plans",
            icon: "books.vertical.fill"
        ) {
            let plans = viewModel.getMealPlanningManager().availablePlans
            
            if plans.isEmpty {
                EmptyStateView(
                    title: "No Plans Yet",
                    subtitle: "Create your first meal plan to get started",
                    icon: "plus.circle",
                    actionTitle: "Generate Plan",
                    action: viewModel.generateNewPlan
                )
                .frame(height: 200)
            } else {
                VStack(spacing: 12) {
                    ForEach(plans) { plan in
                        MealPlanCard(plan: plan) {
                            viewModel.selectPlan(plan)
                        } onDuplicate: {
                            viewModel.duplicatePlan(plan)
                        } onDelete: {
                            viewModel.deletePlan(plan)
                        }
                    }
                }
            }
        }
    }
    
    private var generatePlanSection: some View {
        VStack(spacing: 12) {
            PrimaryActionButton(
                "Generate New Plan",
                icon: "plus.circle.fill",
                isLoading: viewModel.getMealPlanningManager().isGenerating
            ) {
                viewModel.generateNewPlan()
            }
            
            Text("Create personalized meal plans with AI")
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                .multilineTextAlignment(.center)
        }
    }
}

// MARK: - Supporting Views

struct PlannedMealCard: View {
    let meal: PlannedMeal
    let onTap: () -> Void
    let onAdd: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: meal.mealType.icon)
                        .foregroundColor(meal.mealType.color)
                        .font(.caption)
                    
                    Text(meal.name)
                        .font(SCALDesignSystem.Typography.subheadlineBold)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        .lineLimit(1)
                }
                
                Text("\(meal.calories) cal • \(meal.preparationTime) min")
                    .font(SCALDesignSystem.Typography.caption)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                
                HStack(spacing: 8) {
                    NutritionPill(label: "P", value: meal.protein, color: SCALDesignSystem.Colors.protein)
                    NutritionPill(label: "C", value: meal.carbs, color: SCALDesignSystem.Colors.carbs)
                    NutritionPill(label: "F", value: meal.fat, color: SCALDesignSystem.Colors.fat)
                }
            }
            
            Spacer()
            
            VStack(spacing: 8) {
                IconButton(
                    icon: "info.circle",
                    color: .blue,
                    size: 16,
                    action: onTap
                )
                
                IconButton(
                    icon: "plus.circle.fill",
                    color: .green,
                    size: 16,
                    action: onAdd
                )
            }
        }
        .scalCard()
    }
}

struct PlannedMealRow: View {
    let meal: PlannedMeal
    let onTap: () -> Void
    let onAdd: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: meal.mealType.icon)
                .foregroundColor(meal.mealType.color)
                .font(.subheadline)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(meal.name)
                    .font(SCALDesignSystem.Typography.subheadline)
                    .foregroundColor(SCALDesignSystem.Colors.primaryText)
                
                Text("\(meal.calories) cal • \(meal.preparationTime) min")
                    .font(SCALDesignSystem.Typography.caption2)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }
            
            Spacer()
            
            HStack(spacing: 8) {
                Button(action: onTap) {
                    Image(systemName: "info.circle")
                        .foregroundColor(.blue)
                        .font(.caption)
                }
                
                Button(action: onAdd) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.green)
                        .font(.caption)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct PlanDetailCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            
            Text(value)
                .font(SCALDesignSystem.Typography.title3)
                .foregroundColor(color)
            
            Text(unit)
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
        }
        .scalCard()
    }
}

struct MacroBreakdownBar: View {
    let title: String
    let percentage: Double
    let color: Color
    
    var body: some View {
        HStack {
            Text(title)
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
                .frame(width: 60, alignment: .leading)
            
            ProgressView(value: percentage)
                .progressViewStyle(LinearProgressViewStyle(tint: color))
                .frame(height: 6)
            
            Text(String(format: "%.0f%%", percentage * 100))
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(color)
                .frame(width: 40, alignment: .trailing)
        }
    }
}

struct MealPlanCard: View {
    let plan: MealPlan
    let onSelect: () -> Void
    let onDuplicate: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(plan.name)
                        .font(SCALDesignSystem.Typography.subheadlineBold)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    Text(plan.description)
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                        .lineLimit(2)
                }
                
                Spacer()
                
                Text(plan.cuisineType.flag)
                    .font(.title2)
            }
            
            HStack {
                Text("\(plan.duration) days")
                    .font(SCALDesignSystem.Typography.caption2)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                
                Spacer()
                
                HStack(spacing: 8) {
                    Button("Select", action: onSelect)
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(.blue)
                    
                    Button("Copy", action: onDuplicate)
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(.green)
                    
                    Button("Delete", action: onDelete)
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(.red)
                }
            }
        }
        .scalCard()
    }
}

// MARK: - Plan Generator Sheet

struct PlanGeneratorView: View {
    @ObservedObject var viewModel: MealPlanningViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Generation progress
                    if viewModel.generationProgress > 0 {
                        generationProgressView
                    } else {
                        planConfigurationView
                    }
                }
                .padding()
            }
            .background(SCALDesignSystem.Colors.background)
            .navigationTitle("Generate Meal Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
                
                if viewModel.generationProgress == 0 {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Generate") {
                            viewModel.startPlanGeneration()
                        }
                        .foregroundColor(SCALDesignSystem.Colors.primary)
                    }
                }
            }
        }
    }
    
    private var generationProgressView: some View {
        VStack(spacing: 20) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 60))
                .foregroundColor(SCALDesignSystem.Colors.primary)
            
            Text("Generating Your Plan")
                .font(SCALDesignSystem.Typography.title2)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
            
            ProgressView(value: viewModel.generationProgress)
                .progressViewStyle(LinearProgressViewStyle(tint: SCALDesignSystem.Colors.primary))
                .frame(height: 8)
            
            Text(String(format: "%.0f%% Complete", viewModel.generationProgress * 100))
                .font(SCALDesignSystem.Typography.subheadline)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var planConfigurationView: some View {
        VStack(spacing: 20) {
            // Duration
            VStack(alignment: .leading, spacing: 8) {
                Text("Plan Duration")
                    .font(SCALDesignSystem.Typography.subheadlineBold)
                    .foregroundColor(SCALDesignSystem.Colors.primaryText)
                
                Picker("Duration", selection: $viewModel.planDuration) {
                    Text("3 Days").tag(3)
                    Text("7 Days").tag(7)
                    Text("14 Days").tag(14)
                    Text("30 Days").tag(30)
                }
                .pickerStyle(SegmentedPickerStyle())
            }
            
            // Nutrition targets
            nutritionTargetsSection
            
            // Preferences
            preferencesSection
            
            // Generate button
            PrimaryActionButton(
                "Generate AI Plan",
                icon: "wand.and.stars"
            ) {
                viewModel.startPlanGeneration()
            }
        }
    }
    
    private var nutritionTargetsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Nutrition Targets")
                .font(SCALDesignSystem.Typography.subheadlineBold)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
            
            VStack(spacing: 12) {
                SliderInput(
                    title: "Daily Calories",
                    value: Binding(
                        get: { Double(viewModel.customCalories) },
                        set: { viewModel.customCalories = Int($0) }
                    ),
                    range: 1200...3500,
                    step: 50,
                    formatter: {
                        let fmt = NumberFormatter()
                        fmt.maximumFractionDigits = 0
                        return fmt
                    }(),
                    unit: " cal",
                    color: SCALDesignSystem.Colors.calories
                )
                
                SliderInput(
                    title: "Protein Target",
                    value: $viewModel.customProtein,
                    range: 50...200,
                    step: 5,
                    formatter: {
                        let fmt = NumberFormatter()
                        fmt.maximumFractionDigits = 0
                        return fmt
                    }(),
                    unit: "g",
                    color: SCALDesignSystem.Colors.protein
                )
            }
        }
    }
    
    private var preferencesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Preferences")
                .font(SCALDesignSystem.Typography.subheadlineBold)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
            
            VStack(spacing: 12) {
                ToggleButton(
                    title: "Include Snacks",
                    icon: "leaf.fill",
                    isOn: $viewModel.includeSnacks
                )
                
                ToggleButton(
                    title: "Vegetarian Only",
                    icon: "leaf.circle.fill",
                    isOn: $viewModel.vegetarianOnly,
                    activeColor: .green
                )
            }
        }
    }
}

// MARK: - Meal Detail Sheet

struct MealDetailView: View {
    let meal: PlannedMeal
    @ObservedObject var viewModel: MealPlanningViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Meal header
                    mealHeaderSection
                    
                    // Nutrition info
                    nutritionSection
                    
                    // Ingredients
                    ingredientsSection
                    
                    // Instructions
                    instructionsSection
                    
                    // Add to today button
                    PrimaryActionButton(
                        "Add to Today's Meals",
                        icon: "plus.circle.fill"
                    ) {
                        viewModel.addMealToToday(meal)
                        dismiss()
                    }
                }
                .padding()
            }
            .background(SCALDesignSystem.Colors.background)
            .navigationTitle(meal.name)
            .navigationBarTitleDisplayMode(.large)
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
    
    private var mealHeaderSection: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: meal.mealType.icon)
                    .font(.title)
                    .foregroundColor(meal.mealType.color)
                
                VStack(alignment: .leading) {
                    Text(meal.mealType.rawValue)
                        .font(SCALDesignSystem.Typography.subheadlineBold)
                        .foregroundColor(meal.mealType.color)
                    
                    Text("\(meal.preparationTime) min prep • \(meal.servings) serving(s)")
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                }
                
                Spacer()
            }
            
            Text(meal.description)
                .font(SCALDesignSystem.Typography.body)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
        }
        .scalCard()
    }
    
    private var nutritionSection: some View {
        SectionContainer(
            title: "Nutrition Facts",
            icon: "chart.bar.fill"
        ) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                NutritionFactCard(title: "Calories", value: "\(meal.calories)", unit: "kcal", color: SCALDesignSystem.Colors.calories)
                NutritionFactCard(title: "Protein", value: String(format: "%.1f", meal.protein), unit: "g", color: SCALDesignSystem.Colors.protein)
                NutritionFactCard(title: "Carbs", value: String(format: "%.1f", meal.carbs), unit: "g", color: SCALDesignSystem.Colors.carbs)
                NutritionFactCard(title: "Fat", value: String(format: "%.1f", meal.fat), unit: "g", color: SCALDesignSystem.Colors.fat)
            }
        }
    }
    
    private var ingredientsSection: some View {
        SectionContainer(
            title: "Ingredients",
            subtitle: "\(meal.ingredients.count) items",
            icon: "list.bullet"
        ) {
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(meal.ingredients.enumerated()), id: \.offset) { index, ingredient in
                    HStack {
                        Text("•")
                            .foregroundColor(SCALDesignSystem.Colors.primary)
                        
                        Text(ingredient)
                            .font(SCALDesignSystem.Typography.subheadline)
                            .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        
                        Spacer()
                    }
                }
            }
        }
    }
    
    private var instructionsSection: some View {
        SectionContainer(
            title: "Instructions",
            subtitle: "\(meal.instructions.count) steps",
            icon: "list.number"
        ) {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(meal.instructions.enumerated()), id: \.offset) { index, instruction in
                    HStack(alignment: .top) {
                        Text("\(index + 1)")
                            .font(SCALDesignSystem.Typography.captionBold)
                            .foregroundColor(SCALDesignSystem.Colors.primary)
                            .frame(width: 20, alignment: .leading)
                        
                        Text(instruction)
                            .font(SCALDesignSystem.Typography.subheadline)
                            .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        
                        Spacer()
                    }
                }
            }
        }
    }
}

struct NutritionFactCard: View {
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

// MARK: - Preferences Sheet

struct MealPlanPreferencesView: View {
    @ObservedObject var viewModel: MealPlanningViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Nutrition goals
                    nutritionGoalsSection
                    
                    // Dietary preferences
                    dietaryPreferencesSection
                    
                    // Cooking preferences
                    cookingPreferencesSection
                }
                .padding()
            }
            .background(SCALDesignSystem.Colors.background)
            .navigationTitle("Meal Plan Preferences")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        // Save preferences
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
            }
        }
    }
    
    private var nutritionGoalsSection: some View {
        SectionContainer(
            title: "Nutrition Goals",
            subtitle: "Daily targets for meal planning",
            icon: "target"
        ) {
            VStack(spacing: 16) {
                NumberInputField(
                    title: "Daily Calories",
                    placeholder: "2000",
                    value: $viewModel.customCalories,
                    formatter: {
                        let fmt = NumberFormatter()
                        fmt.numberStyle = .decimal
                        fmt.maximumFractionDigits = 0
                        return fmt
                    }(),
                    icon: "flame.fill"
                )
                
                NumberInputField(
                    title: "Protein (grams)",
                    placeholder: "150",
                    value: $viewModel.customProtein,
                    formatter: {
                        let fmt = NumberFormatter()
                        fmt.numberStyle = .decimal
                        fmt.maximumFractionDigits = 1
                        return fmt
                    }(),
                    icon: "circle.fill"
                )
            }
        }
    }
    
    private var dietaryPreferencesSection: some View {
        SectionContainer(
            title: "Dietary Preferences",
            subtitle: "Customize your meal types",
            icon: "leaf.fill"
        ) {
            VStack(spacing: 12) {
                ToggleButton(
                    title: "Vegetarian Meals Only",
                    icon: "leaf.circle.fill",
                    isOn: $viewModel.vegetarianOnly,
                    activeColor: .green
                )
                
                ToggleButton(
                    title: "Include Snacks",
                    icon: "takeoutbag.and.cup.and.straw.fill",
                    isOn: $viewModel.includeSnacks
                )
            }
        }
    }
    
    private var cookingPreferencesSection: some View {
        SectionContainer(
            title: "Cooking Preferences",
            subtitle: "Meal preparation settings",
            icon: "timer"
        ) {
            VStack(spacing: 16) {
                SliderInput(
                    title: "Max Preparation Time",
                    value: Binding(
                        get: { Double(viewModel.maxPrepTime) },
                        set: { viewModel.maxPrepTime = Int($0) }
                    ),
                    range: 15...120,
                    step: 15,
                    formatter: {
                        let fmt = NumberFormatter()
                        fmt.maximumFractionDigits = 0
                        return fmt
                    }(),
                    unit: " min",
                    color: .purple
                )
                
                CustomPicker(
                    title: "Difficulty Level",
                    options: PlanDifficulty.allCases,
                    selection: $viewModel.selectedDifficulty,
                    displayText: { $0.rawValue },
                    icon: "chef.hat.fill"
                )
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
struct MealPlanningView_Previews: PreviewProvider {
    static var previews: some View {
        MealPlanningView(userProfileManager: UserProfileManager())
    }
}
#endif