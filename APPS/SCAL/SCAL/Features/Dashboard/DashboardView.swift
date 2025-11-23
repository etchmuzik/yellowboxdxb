import SwiftUI
import Charts

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @State private var selectedDate = Date()
    @State private var showingDatePicker = false
    @State private var showingAICoach = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Date selector
                dateHeader
                
                // Daily summary card
                dailySummaryCard
                
                // Macro breakdown chart
                macroBreakdownSection
                
                // Scanner promo (if premium feature)
                if !subscriptionManager.hasAccess(to: .advancedFoodScanning) {
                    scannerPromoSection
                }
                
                // Meals list
                mealsSection
                
                // Quick stats
                quickStatsSection
                
                // AI Coach card
                aiCoachCard
            }
            .padding()
        }
        .background(Color(UIColor.systemGroupedBackground))
        .navigationTitle("Dashboard")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingDatePicker.toggle() }) {
                    Image(systemName: "calendar")
                }
            }
        }
        .sheet(isPresented: $showingDatePicker) {
            DatePickerSheet(selectedDate: $selectedDate)
        }
        .sheet(isPresented: $showingAICoach) {
            NutritionCoachView()
        }
        .onAppear {
            viewModel.loadData(for: selectedDate)
        }
        .onChange(of: selectedDate) { _, newDate in
            viewModel.loadData(for: newDate)
        }
    }
    
    // MARK: - Components
    
    private var dateHeader: some View {
        HStack {
            Button(action: {
                // Check date navigation limits for free tier
                let daysDiff = Calendar.current.dateComponents([.day], from: selectedDate.addingTimeInterval(-86400), to: Date()).day ?? 0
                if subscriptionManager.currentTier == .free && daysDiff > 30 {
                    subscriptionManager.requestFeatureAccess(.unlimitedHistory)
                } else {
                    previousDay()
                }
            }) {
                Image(systemName: "chevron.left")
                    .font(.title3)
                    .foregroundColor(.accentColor)
            }
            
            Spacer()
            
            VStack(spacing: 4) {
                Text(dateFormatter.string(from: selectedDate))
                    .font(.headline)
                
                if Calendar.current.isDateInToday(selectedDate) {
                    Text("Today")
                        .font(.caption)
                        .foregroundColor(.accentColor)
                }
            }
            
            Spacer()
            
            Button(action: nextDay) {
                Image(systemName: "chevron.right")
                    .font(.title3)
                    .foregroundColor(.accentColor)
            }
            .disabled(Calendar.current.isDateInToday(selectedDate))
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var dailySummaryCard: some View {
        VStack(spacing: 16) {
            // Calorie progress
            VStack(spacing: 8) {
                HStack {
                    Text("Calories")
                        .font(.headline)
                    Spacer()
                    Text("\(viewModel.totalCalories) / \(viewModel.calorieGoal)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                ProgressView(value: Double(viewModel.totalCalories), total: Double(viewModel.calorieGoal))
                    .progressViewStyle(LinearProgressViewStyle(tint: calorieProgressColor))
                    .scaleEffect(x: 1, y: 2, anchor: .center)
                
                HStack {
                    Text("\(viewModel.remainingCalories) remaining")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(Int(viewModel.calorieProgress * 100))%")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Divider()
            
            // Macros summary
            HStack(spacing: 20) {
                MacroProgressView(
                    title: "Protein",
                    current: viewModel.totalProtein,
                    goal: viewModel.proteinGoal,
                    unit: "g",
                    color: .red
                )
                
                MacroProgressView(
                    title: "Carbs",
                    current: viewModel.totalCarbs,
                    goal: viewModel.carbGoal,
                    unit: "g",
                    color: .blue
                )
                
                MacroProgressView(
                    title: "Fat",
                    current: viewModel.totalFat,
                    goal: viewModel.fatGoal,
                    unit: "g",
                    color: .green
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
    
    private var macroBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Macro Breakdown")
                .font(.headline)
                .padding(.horizontal)
            
            // Pie chart
            MacroPieChart(
                protein: viewModel.totalProtein,
                carbs: viewModel.totalCarbs,
                fat: viewModel.totalFat
            )
            .frame(height: 200)
            .padding()
            .background(Color(UIColor.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }
    
    private var mealsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Meals")
                    .font(.headline)
                Spacer()
                Text("\(viewModel.meals.count) logged")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)
            
            if viewModel.meals.isEmpty {
                EmptyMealsView()
            } else {
                ForEach(viewModel.meals) { meal in
                    MealCard(meal: meal)
                }
            }
        }
    }
    
    private var scannerPromoSection: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "camera.metering.multispot")
                            .font(.title2)
                            .foregroundColor(SCALDesignSystem.Colors.primary)
                        
                        Text("Multi-Food Scanner")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        if subscriptionManager.hasAccess(to: .advancedFoodScanning) {
                            PremiumBadge(tier: .premium, size: .small)
                        } else {
                            Image(systemName: "lock.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                    
                    Text("Scan complex meals with multiple foods in one photo")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {
                    if subscriptionManager.hasAccess(to: .advancedFoodScanning) {
                        // Open multi-food scanner
                    } else {
                        subscriptionManager.requestFeatureAccess(.advancedFoodScanning)
                    }
                }) {
                    Text("Try It")
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            LinearGradient(
                                colors: [.orange, .yellow],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(20)
                }
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [Color.orange.opacity(0.1), Color.orange.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
        }
    }
    
    private var aiCoachCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "brain.head.profile")
                            .font(.title2)
                            .foregroundColor(Color.blue)
                        
                        Text("AI Nutrition Coach")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        if subscriptionManager.hasAccess(to: .aiNutritionCoach) {
                            PremiumBadge(tier: .pro, size: .small)
                        } else {
                            Image(systemName: "lock.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                    
                    Text("Get personalized nutrition guidance from your AI coach")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            Button(action: {
                if subscriptionManager.hasAccess(to: .aiNutritionCoach) {
                    showingAICoach = true
                } else {
                    subscriptionManager.requestFeatureAccess(.aiNutritionCoach)
                }
            }) {
                Text(subscriptionManager.hasAccess(to: .aiNutritionCoach) ? "Chat with Coach" : "Unlock Coach")
                    .font(.subheadline.bold())
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: subscriptionManager.hasAccess(to: .aiNutritionCoach) ? 
                                [.blue, .purple] : [.orange, .yellow],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [
                    subscriptionManager.hasAccess(to: .aiNutritionCoach) ?
                    Color.blue.opacity(0.1) : Color.orange.opacity(0.1),
                    subscriptionManager.hasAccess(to: .aiNutritionCoach) ?
                    Color.purple.opacity(0.05) : Color.orange.opacity(0.05)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    subscriptionManager.hasAccess(to: .aiNutritionCoach) ?
                    Color.blue.opacity(0.2) : Color.orange.opacity(0.2),
                    lineWidth: 1
                )
        )
    }
    
    private var quickStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Stats")
                .font(.headline)
                .padding(.horizontal)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickStatCard(
                    icon: "flame.fill",
                    title: "Streak",
                    value: "\(viewModel.currentStreak)",
                    unit: "days",
                    color: .orange
                )
                
                QuickStatCard(
                    icon: "chart.line.uptrend.xyaxis",
                    title: "Avg Calories",
                    value: "\(viewModel.weeklyAverageCalories)",
                    unit: "per day",
                    color: .purple
                )
                
                QuickStatCard(
                    icon: "drop.fill",
                    title: "Water",
                    value: "\(viewModel.waterIntake)",
                    unit: "glasses",
                    color: .blue
                )
                
                QuickStatCard(
                    icon: "figure.walk",
                    title: "Steps",
                    value: "\(viewModel.steps)",
                    unit: "today",
                    color: .green
                )
            }
        }
    }
    
    // MARK: - Actions
    
    private func previousDay() {
        selectedDate = Calendar.current.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
    }
    
    private func nextDay() {
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: selectedDate) ?? selectedDate
        if !Calendar.current.isDateInTomorrow(tomorrow) {
            selectedDate = tomorrow
        }
    }
    
    // MARK: - Helpers
    
    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter
    }
    
    private var calorieProgressColor: Color {
        let progress = viewModel.calorieProgress
        if progress < 0.8 { return .blue }
        else if progress < 1.0 { return .green }
        else { return .orange }
    }
}

// MARK: - Supporting Views

struct MacroProgressView: View {
    let title: String
    let current: Double
    let goal: Double
    let unit: String
    let color: Color
    
    private var progress: Double {
        goal > 0 ? current / goal : 0
    }
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            ZStack {
                Circle()
                    .stroke(color.opacity(0.2), lineWidth: 8)
                
                Circle()
                    .trim(from: 0, to: min(progress, 1.0))
                    .stroke(color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut, value: progress)
            }
            .frame(width: 60, height: 60)
            .overlay(
                VStack(spacing: 0) {
                    Text("\(Int(current))")
                        .font(.system(.footnote, design: .rounded))
                        .fontWeight(.bold)
                    Text(unit)
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            )
            
            Text("\(Int(goal))\(unit)")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

struct MacroPieChart: View {
    let protein: Double
    let carbs: Double
    let fat: Double
    
    private var total: Double {
        protein + carbs + fat
    }
    
    private var proteinAngle: Angle {
        total > 0 ? .degrees(360 * protein / total) : .zero
    }
    
    private var carbAngle: Angle {
        total > 0 ? .degrees(360 * carbs / total) : .zero
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Protein slice
                PieSlice(startAngle: .zero, endAngle: proteinAngle)
                    .fill(Color.red)
                
                // Carbs slice
                PieSlice(startAngle: proteinAngle, endAngle: proteinAngle + carbAngle)
                    .fill(Color.blue)
                
                // Fat slice
                PieSlice(startAngle: proteinAngle + carbAngle, endAngle: .degrees(360))
                    .fill(Color.green)
                
                // Center circle
                Circle()
                    .fill(Color(UIColor.systemBackground))
                    .frame(width: geometry.size.width * 0.6, height: geometry.size.width * 0.6)
                
                // Legend
                VStack(spacing: 4) {
                    MacroLegendItem(color: .red, label: "Protein", value: protein, total: total)
                    MacroLegendItem(color: .blue, label: "Carbs", value: carbs, total: total)
                    MacroLegendItem(color: .green, label: "Fat", value: fat, total: total)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct PieSlice: Shape {
    let startAngle: Angle
    let endAngle: Angle
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2
        
        path.move(to: center)
        path.addArc(center: center, radius: radius, startAngle: startAngle - .degrees(90), endAngle: endAngle - .degrees(90), clockwise: false)
        path.closeSubpath()
        
        return path
    }
}

struct MacroLegendItem: View {
    let color: Color
    let label: String
    let value: Double
    let total: Double
    
    private var percentage: Int {
        total > 0 ? Int((value / total) * 100) : 0
    }
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text("\(label) \(percentage)%")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

struct MealCard: View {
    let meal: Meal
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: meal.mealType.icon)
                    .font(.title3)
                    .foregroundColor(.accentColor)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(meal.name)
                        .font(.headline)
                    Text(meal.timeOfDay)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text("\(Int(meal.totalNutrition.calories)) cal")
                    .font(.headline)
                    .foregroundColor(.orange)
            }
            
            // Food items
            if !meal.foods.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(meal.foods.prefix(3)) { food in
                        HStack {
                            Text("• \(food.name)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                            Spacer()
                            Text("\(Int(food.adjustedNutrition.calories)) cal")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if meal.foods.count > 3 {
                        Text("+ \(meal.foods.count - 3) more items")
                            .font(.caption)
                            .foregroundColor(.accentColor)
                    }
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct EmptyMealsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "fork.knife.circle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No meals logged yet")
                .font(.headline)
            
            Text("Scan your first meal to start tracking")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct QuickStatCard: View {
    let icon: String
    let title: String
    let value: String
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
            }
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                Text(unit)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct DatePickerSheet: View {
    @Binding var selectedDate: Date
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            DatePicker(
                "Select Date",
                selection: $selectedDate,
                in: ...Date(),
                displayedComponents: .date
            )
            .datePickerStyle(GraphicalDatePickerStyle())
            .padding()
            .navigationTitle("Select Date")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        DashboardView()
    }
}