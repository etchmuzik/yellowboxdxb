//
//  NutritionCoachView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  AI Nutrition Coach chat interface
//

import SwiftUI

struct NutritionCoachView: View {
    @StateObject private var coach = NutritionCoach.shared
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @State private var messageText = ""
    @State private var showingTopicPicker = false
    @State private var scrollToBottom = false
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            if subscriptionManager.hasAccess(to: .aiNutritionCoach) {
                chatInterface
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "lock.fill")
                        .font(.largeTitle)
                        .foregroundColor(.calPrimary)
                    Text("Unlock the AI Coach with Pro")
                        .font(.headline)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.calTextPrimary)
                    Text("Upgrade to chat with our GCC nutrition team and sync telehealth recommendations.")
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.calTextSecondary)
                }
                .padding()
            }
        }
    }
    
    private var chatInterface: some View {
        VStack(spacing: 0) {
            // Insights bar
            if !coach.insights.isEmpty {
                insightsBar
            }
            
            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 16) {
                        ForEach(coach.messages) { message in
                            CoachChatMessageBubble(message: message) { suggestion in
                                handleSuggestionTap(suggestion)
                            }
                            .id(message.id)
                        }
                        
                        if coach.isTyping {
                            CoachChatTypingIndicator()
                                .id("typing")
                        }
                    }
                    .padding()
                }
                .onChange(of: coach.messages.count) { _, _ in
                    withAnimation {
                        proxy.scrollTo(coach.messages.last?.id, anchor: .bottom)
                    }
                }
                .onChange(of: coach.isTyping) { _, isTyping in
                    if isTyping {
                        withAnimation {
                            proxy.scrollTo("typing", anchor: .bottom)
                        }
                    }
                }
            }
            
            // Input bar
            inputBar
        }
        .background(SCALDesignSystem.Colors.background)
        .navigationTitle("AI Nutrition Coach")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Done") {
                    dismiss()
                }
                .foregroundColor(SCALDesignSystem.Colors.primary)
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingTopicPicker = true }) {
                    Image(systemName: "lightbulb.fill")
                        .foregroundColor(SCALDesignSystem.Colors.primary)
                }
            }
        }
        .sheet(isPresented: $showingTopicPicker) {
            TopicPickerView { topic in
                askAboutTopic(topic)
            }
        }
        .onAppear {
            // Generate daily check-in if needed
            if shouldShowDailyCheckIn() {
                Task {
                    await coach.generateDailyCheckIn()
                }
            }
        }
    }
    
    // MARK: - Insights Bar
    
    private var insightsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(coach.insights.prefix(3)) { insight in
                    InsightCard(insight: insight) {
                        askAboutInsight(insight)
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(SCALDesignSystem.Colors.secondaryBackground)
    }
    
    // MARK: - Input Bar
    
    private var inputBar: some View {
        VStack(spacing: 0) {
            // Quick actions
            if messageText.isEmpty {
                quickActionsBar
            }
            
            // Text input
            HStack(spacing: 12) {
                TextField("Ask your nutrition coach...", text: $messageText)
                    .font(SCALDesignSystem.Typography.body)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(SCALDesignSystem.Colors.secondaryBackground)
                    )
                    .onSubmit {
                        sendMessage()
                    }
                
                Button(action: sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(messageText.isEmpty ? .gray : SCALDesignSystem.Colors.primary)
                }
                .disabled(messageText.isEmpty)
            }
            .padding()
        }
        .background(
            Rectangle()
                .fill(SCALDesignSystem.Colors.background)
                .shadow(color: .black.opacity(0.05), radius: 5, y: -2)
        )
    }
    
    private var quickActionsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                QuickActionButton(title: "How am I doing?", icon: "chart.line.uptrend.xyaxis") {
                    messageText = "How am I doing with my nutrition goals?"
                    sendMessage()
                }
                
                QuickActionButton(title: "Meal ideas", icon: "fork.knife") {
                    messageText = "What should I eat for my next meal?"
                    sendMessage()
                }
                
                QuickActionButton(title: "Protein tips", icon: "bolt.fill") {
                    messageText = "How can I increase my protein intake?"
                    sendMessage()
                }
                
                QuickActionButton(title: "Hydration", icon: "drop.fill") {
                    messageText = "Am I drinking enough water?"
                    sendMessage()
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }
    
    // MARK: - Helper Methods
    
    private func sendMessage() {
        guard !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        coach.sendMessage(messageText)
        messageText = ""
    }
    
    private func handleSuggestionTap(_ suggestion: CoachSuggestion) {
        switch suggestion.action {
        case .adjustGoals(let calories, let protein, _, _):
            // Navigate to goals adjustment
            print("Adjust goals: \(calories) cal, \(protein)g protein")
            
        case .viewMealPlan(let planId):
            // Navigate to meal plan
            print("View meal plan: \(planId)")
            
        case .logFood(let foodName):
            // Quick log food
            print("Log food: \(foodName)")
            
        case .viewRecipe(let recipeId):
            // Navigate to recipe
            print("View recipe: \(recipeId)")
            
        case .scheduleReminder(let time, let message):
            // Schedule notification
            print("Schedule reminder: \(message) at \(time)")
            
        case .viewProgress(let metric):
            // Navigate to analytics
            print("View progress: \(metric)")
        }
    }
    
    private func askAboutTopic(_ topic: NutritionCoach.CoachTopic) {
        let questions = getQuestionsForTopic(topic)
        if let question = questions.randomElement() {
            messageText = question
            sendMessage()
        }
    }
    
    private func askAboutInsight(_ insight: CoachingInsight) {
        messageText = "Tell me more about my \(insight.category.rawValue.lowercased())"
        sendMessage()
    }
    
    private func shouldShowDailyCheckIn() -> Bool {
        // Check if daily check-in was shown today
        let lastCheckIn = UserDefaults.standard.object(forKey: "lastCoachCheckIn") as? Date ?? .distantPast
        return !Calendar.current.isDateInToday(lastCheckIn)
    }
    
    private func getQuestionsForTopic(_ topic: NutritionCoach.CoachTopic) -> [String] {
        switch topic {
        case .general:
            return [
                "What are the basics of good nutrition?",
                "How do I read nutrition labels?",
                "What's a balanced diet?"
            ]
        case .weightLoss:
            return [
                "How can I lose weight effectively?",
                "What's a healthy calorie deficit?",
                "Best foods for weight loss?"
            ]
        case .muscleGain:
            return [
                "How much protein do I need for muscle gain?",
                "Best post-workout meals?",
                "How to gain muscle without too much fat?"
            ]
        case .healthyEating:
            return [
                "What are some healthy snack options?",
                "How to eat healthy on a budget?",
                "Best foods for energy?"
            ]
        case .mealTiming:
            return [
                "When should I eat my meals?",
                "Is intermittent fasting good for me?",
                "Best pre-workout meal timing?"
            ]
        case .supplements:
            return [
                "Do I need supplements?",
                "What supplements should I take?",
                "When to take vitamins?"
            ]
        case .hydration:
            return [
                "How much water should I drink?",
                "Best times to hydrate?",
                "Does coffee count as water intake?"
            ]
        case .specialDiets:
            return [
                "Is keto right for me?",
                "How to go vegetarian healthily?",
                "What about gluten-free diets?"
            ]
        }
    }
}

// MARK: - Message Bubble

struct CoachChatMessageBubble: View {
    let message: CoachMessage
    let onSuggestionTap: (CoachSuggestion) -> Void
    
    var body: some View {
        HStack {
            if message.type == .user {
                Spacer(minLength: 60)
            }
            
            VStack(alignment: message.type == .user ? .trailing : .leading, spacing: 8) {
                // Message content
                Text(message.content)
                    .font(SCALDesignSystem.Typography.body)
                    .foregroundColor(message.type == .user ? .white : SCALDesignSystem.Colors.primaryText)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(message.type == .user ? 
                                  SCALDesignSystem.Colors.primary : 
                                  SCALDesignSystem.Colors.secondaryBackground)
                    )
                
                // Suggestions
                if let suggestions = message.suggestions {
                    VStack(spacing: 8) {
                        ForEach(suggestions) { suggestion in
                            SuggestionButton(suggestion: suggestion) {
                                onSuggestionTap(suggestion)
                            }
                        }
                    }
                }
                
                // Timestamp
                Text(message.timestamp.formatted(date: .omitted, time: .shortened))
                    .font(SCALDesignSystem.Typography.caption2)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }
            
            if message.type == .coach {
                Spacer(minLength: 60)
            }
        }
    }
}

// MARK: - Supporting Views

struct InsightCard: View {
    let insight: CoachingInsight
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: insight.category.icon)
                        .foregroundColor(insight.priority.color)
                    
                    Text(insight.title)
                        .font(SCALDesignSystem.Typography.captionBold)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    Spacer()
                }
                
                Text(insight.message)
                    .font(SCALDesignSystem.Typography.caption2)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                    .lineLimit(2)
            }
            .padding(12)
            .frame(width: 200)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(insight.priority.color.opacity(0.3), lineWidth: 1)
                    )
            )
        }
    }
}

struct SuggestionButton: View {
    let suggestion: CoachSuggestion
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: suggestion.icon)
                    .font(.caption)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(suggestion.title)
                        .font(SCALDesignSystem.Typography.captionBold)
                    
                    Text(suggestion.description)
                        .font(SCALDesignSystem.Typography.caption2)
                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }
            .foregroundColor(SCALDesignSystem.Colors.primaryText)
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(SCALDesignSystem.Colors.primary.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(SCALDesignSystem.Colors.primary.opacity(0.3), lineWidth: 1)
                    )
            )
        }
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                
                Text(title)
                    .font(SCALDesignSystem.Typography.caption)
            }
            .foregroundColor(SCALDesignSystem.Colors.primaryText)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(SCALDesignSystem.Colors.secondaryBackground)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                    )
            )
        }
    }
}

struct CoachChatTypingIndicator: View {
    @State private var animationOffset: CGFloat = 0
    
    var body: some View {
        HStack {
            HStack(spacing: 4) {
                ForEach(0..<3) { index in
                    Circle()
                        .fill(SCALDesignSystem.Colors.primary)
                        .frame(width: 8, height: 8)
                        .offset(y: animationOffset)
                        .animation(
                            Animation.easeInOut(duration: 0.5)
                                .repeatForever()
                                .delay(Double(index) * 0.15),
                            value: animationOffset
                        )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(SCALDesignSystem.Colors.secondaryBackground)
            )
            
            Spacer(minLength: 60)
        }
        .onAppear {
            animationOffset = -5
        }
    }
}

// MARK: - Topic Picker

struct TopicPickerView: View {
    let onSelect: (NutritionCoach.CoachTopic) -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List(NutritionCoach.CoachTopic.allCases, id: \.self) { topic in
                Button(action: {
                    onSelect(topic)
                    dismiss()
                }) {
                    HStack {
                        Image(systemName: topicIcon(for: topic))
                            .foregroundColor(SCALDesignSystem.Colors.primary)
                            .frame(width: 30)
                        
                        Text(topic.rawValue)
                            .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
            }
            .navigationTitle("Topics")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
            }
        }
    }
    
    private func topicIcon(for topic: NutritionCoach.CoachTopic) -> String {
        switch topic {
        case .general: return "info.circle.fill"
        case .weightLoss: return "chart.line.downtrend.xyaxis"
        case .muscleGain: return "figure.strengthtraining.traditional"
        case .healthyEating: return "leaf.fill"
        case .mealTiming: return "clock.fill"
        case .supplements: return "pills.fill"
        case .hydration: return "drop.fill"
        case .specialDiets: return "fork.knife.circle.fill"
        }
    }
}

// MARK: - Extensions

extension CoachingInsight.InsightCategory {
    var icon: String {
        switch self {
        case .nutrition: return "chart.pie.fill"
        case .timing: return "clock.fill"
        case .hydration: return "drop.fill"
        case .goals: return "target"
        case .habits: return "repeat.circle.fill"
        case .trends: return "chart.line.uptrend.xyaxis"
        }
    }
}

// MARK: - Preview

#if DEBUG
struct NutritionCoachView_Previews: PreviewProvider {
    static var previews: some View {
        NutritionCoachView()
    }
}
#endif
