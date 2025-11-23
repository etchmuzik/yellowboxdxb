//
//  CardComponents.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Reusable card components for consistent UI
//

import SwiftUI

// MARK: - Base Card

struct BaseCard<Content: View>: View {
    let content: Content
    var padding: CGFloat = 16
    var cornerRadius: CGFloat = 16
    var backgroundColor: Color = Color.gray.opacity(0.1)
    var borderColor: Color? = nil
    var borderWidth: CGFloat = 1
    
    init(
        padding: CGFloat = 16,
        cornerRadius: CGFloat = 16,
        backgroundColor: Color = Color.gray.opacity(0.1),
        borderColor: Color? = nil,
        borderWidth: CGFloat = 1,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.backgroundColor = backgroundColor
        self.borderColor = borderColor
        self.borderWidth = borderWidth
    }
    
    var body: some View {
        content
            .padding(padding)
            .background(backgroundColor)
            .cornerRadius(cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(borderColor ?? Color.clear, lineWidth: borderWidth)
            )
    }
}

// MARK: - Metric Card

struct MetricCard: View {
    let title: String
    let value: String
    let subtitle: String?
    let color: Color
    let icon: String?
    var action: (() -> Void)? = nil
    
    init(
        title: String,
        value: String,
        subtitle: String? = nil,
        color: Color,
        icon: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.title = title
        self.value = value
        self.subtitle = subtitle
        self.color = color
        self.icon = icon
        self.action = action
    }
    
    var body: some View {
        BaseCard {
            VStack(spacing: 8) {
                HStack {
                    if let icon = icon {
                        Image(systemName: icon)
                            .foregroundColor(color)
                            .font(.caption)
                    }
                    
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Spacer()
                }
                
                Text(value)
                    .font(.title3.bold())
                    .foregroundColor(color)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
        }
        .onTapGesture {
            action?()
        }
    }
}

// MARK: - Progress Card

struct ProgressCard: View {
    let title: String
    let current: Double
    let goal: Double
    let unit: String
    let color: Color
    let icon: String?
    
    var progress: Double {
        min(current / goal, 1.0)
    }
    
    init(
        title: String,
        current: Double,
        goal: Double,
        unit: String,
        color: Color,
        icon: String? = nil
    ) {
        self.title = title
        self.current = current
        self.goal = goal
        self.unit = unit
        self.color = color
        self.icon = icon
    }
    
    var body: some View {
        BaseCard {
            VStack(spacing: 12) {
                HStack {
                    if let icon = icon {
                        Image(systemName: icon)
                            .foregroundColor(color)
                            .font(.caption)
                    }
                    
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    Text("\(String(format: "%.0f", progress * 100))%")
                        .font(.caption2.bold())
                        .foregroundColor(color)
                }
                
                VStack(spacing: 8) {
                    HStack(alignment: .bottom) {
                        Text(String(format: "%.1f", current))
                            .font(.title3.bold())
                            .foregroundColor(color)
                        
                        Text(unit)
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Spacer()
                        
                        Text("/ \(String(format: "%.0f", goal))")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    
                    ProgressView(value: progress)
                        .progressViewStyle(LinearProgressViewStyle(tint: color))
                        .frame(height: 6)
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(3)
                }
            }
        }
    }
}

// MARK: - Food Item Card

struct FoodItemCard: View {
    let food: SimpleFood
    let onTap: () -> Void
    var showNutrition: Bool = true
    var isSelected: Bool = false
    
    init(
        food: SimpleFood,
        showNutrition: Bool = true,
        isSelected: Bool = false,
        onTap: @escaping () -> Void
    ) {
        self.food = food
        self.showNutrition = showNutrition
        self.isSelected = isSelected
        self.onTap = onTap
    }
    
    var body: some View {
        BaseCard(
            backgroundColor: isSelected ? Color.orange.opacity(0.1) : Color.gray.opacity(0.1),
            borderColor: isSelected ? .orange : nil
        ) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(food.name)
                            .font(.subheadline.bold())
                            .foregroundColor(.white)
                            .lineLimit(2)
                        
                        if let brand = food.brand, !brand.isEmpty {
                            Text(brand)
                                .font(.caption)
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }
                    }
                    
                    Spacer()
                    
                    Text("\(food.calories) cal")
                        .font(.caption.bold())
                        .foregroundColor(.orange)
                }
                
                if showNutrition {
                    HStack(spacing: 12) {
                        NutritionPill(label: "P", value: food.protein, color: .blue)
                        NutritionPill(label: "C", value: food.carbs, color: .green)
                        NutritionPill(label: "F", value: food.fat, color: .yellow)
                    }
                }
            }
        }
        .onTapGesture(perform: onTap)
    }
}

// MARK: - Meal History Card

struct MealHistoryCard: View {
    let meal: SimpleMeal
    let onTap: () -> Void
    let onDelete: () -> Void
    
    init(
        meal: SimpleMeal,
        onTap: @escaping () -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.meal = meal
        self.onTap = onTap
        self.onDelete = onDelete
    }
    
    var body: some View {
        BaseCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(meal.name)
                        .font(.subheadline.bold())
                        .foregroundColor(.white)
                        .lineLimit(2)
                    
                    Text("\(meal.time) • \(meal.calories) cal")
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    if meal.protein > 0 || meal.carbs > 0 || meal.fat > 0 {
                        HStack(spacing: 8) {
                            if meal.protein > 0 {
                                NutritionPill(label: "P", value: meal.protein, color: .blue)
                            }
                            if meal.carbs > 0 {
                                NutritionPill(label: "C", value: meal.carbs, color: .green)
                            }
                            if meal.fat > 0 {
                                NutritionPill(label: "F", value: meal.fat, color: .yellow)
                            }
                        }
                    }
                }
                
                Spacer()
                
                VStack(spacing: 8) {
                    IconButton(
                        icon: "info.circle",
                        color: .blue,
                        size: 16,
                        backgroundColor: Color.blue.opacity(0.1)
                    ) {
                        onTap()
                    }
                    
                    IconButton(
                        icon: "trash",
                        color: .red,
                        size: 16,
                        backgroundColor: Color.red.opacity(0.1)
                    ) {
                        onDelete()
                    }
                }
            }
        }
    }
}

// MARK: - Achievement Card

struct AchievementCard: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    let isUnlocked: Bool
    let progress: Double?
    
    init(
        title: String,
        description: String,
        icon: String,
        color: Color,
        isUnlocked: Bool,
        progress: Double? = nil
    ) {
        self.title = title
        self.description = description
        self.icon = icon
        self.color = color
        self.isUnlocked = isUnlocked
        self.progress = progress
    }
    
    var body: some View {
        BaseCard(
            backgroundColor: isUnlocked ? color.opacity(0.1) : Color.gray.opacity(0.1),
            borderColor: isUnlocked ? color : nil
        ) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(isUnlocked ? color : .gray)
                    .frame(width: 40, height: 40)
                    .background(
                        Circle()
                            .fill(isUnlocked ? color.opacity(0.2) : Color.gray.opacity(0.2))
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundColor(isUnlocked ? .white : .gray)
                    
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.gray)
                        .lineLimit(2)
                    
                    if let progress = progress, !isUnlocked {
                        ProgressView(value: progress)
                            .progressViewStyle(LinearProgressViewStyle(tint: color))
                            .frame(height: 4)
                    }
                }
                
                Spacer()
                
                if isUnlocked {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(color)
                }
            }
        }
    }
}

// MARK: - Statistics Card

struct StatisticsCard: View {
    let title: String
    let stats: [(label: String, value: String, color: Color)]
    let icon: String?
    
    init(
        title: String,
        stats: [(label: String, value: String, color: Color)],
        icon: String? = nil
    ) {
        self.title = title
        self.stats = stats
        self.icon = icon
    }
    
    var body: some View {
        BaseCard {
            VStack(spacing: 12) {
                HStack {
                    if let icon = icon {
                        Image(systemName: icon)
                            .foregroundColor(.orange)
                    }
                    
                    Text(title)
                        .font(.headline.bold())
                        .foregroundColor(.white)
                    
                    Spacer()
                }
                
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: min(stats.count, 3)), spacing: 12) {
                    ForEach(Array(stats.enumerated()), id: \.offset) { index, stat in
                        VStack(spacing: 4) {
                            Text(stat.value)
                                .font(.headline.bold())
                                .foregroundColor(stat.color)
                            
                            Text(stat.label)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Supporting Views

struct NutritionPill: View {
    let label: String
    let value: Double
    let color: Color
    
    var body: some View {
        HStack(spacing: 2) {
            Text(label)
                .font(.caption2.bold())
                .foregroundColor(color)
            
            Text(String(format: "%.1f", value))
                .font(.caption2)
                .foregroundColor(.gray)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(
            Capsule()
                .fill(color.opacity(0.1))
        )
    }
}

// MARK: - Preview

#if DEBUG
struct CardComponents_Previews: PreviewProvider {
    static let sampleFood = SimpleFood(
        name: "Chicken Shawarma",
        brand: "Local Restaurant",
        calories: 475,
        protein: 35,
        carbs: 40,
        fat: 20
    )
    
    static let sampleMeal = SimpleMeal(
        name: "Chicken Shawarma",
        calories: 475,
        time: "12:30 PM",
        protein: 35,
        carbs: 40,
        fat: 20
    )
    
    static var previews: some View {
        ScrollView {
            VStack(spacing: 20) {
                MetricCard(
                    title: "Calories",
                    value: "1,250",
                    subtitle: "remaining",
                    color: .orange,
                    icon: "flame.fill"
                )
                
                ProgressCard(
                    title: "Protein",
                    current: 35.5,
                    goal: 50.0,
                    unit: "g",
                    color: .blue,
                    icon: "circle.fill"
                )
                
                FoodItemCard(food: sampleFood) { }
                
                MealHistoryCard(meal: sampleMeal, onTap: { }, onDelete: { })
                
                AchievementCard(
                    title: "First Week",
                    description: "Log meals for 7 consecutive days",
                    icon: "star.fill",
                    color: .yellow,
                    isUnlocked: true
                )
                
                StatisticsCard(
                    title: "Weekly Summary",
                    stats: [
                        ("Avg Calories", "1,847", .orange),
                        ("Total Meals", "21", .green),
                        ("Streak", "5 days", .blue)
                    ],
                    icon: "chart.bar.fill"
                )
            }
            .padding()
        }
        .background(Color.black)
    }
}
#endif